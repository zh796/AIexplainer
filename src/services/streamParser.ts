/**
 * AI Explainer - 流式解析器（状态机）
 *
 * 核心难点：将 DeepSeek 流式返回的文本块实时解析为 TutorialPage 对象数组。
 *
 * AI 输出格式（JSON Lines）：
 *   {"pageType":"text","content":"..."}
 *   {"pageType":"code","content":"...","language":"javascript"}
 *
 * 容错策略：
 * 1. 非 JSON 文本（markdown 围栏、问候语）自动跳过
 * 2. 不完整行缓存等待下个 chunk
 * 3. 同一段数据重试 3 次后丢弃（防死循环）
 * 4. 流结束时 flush() 强制执行一次尝试
 * 5. 缓冲区上限保护（防内存泄漏）
 */

import type { TutorialPage, ParserState } from '../types'

/** 解析结果回调 */
export type PageCallback = (page: TutorialPage) => void

/** 缓冲区安全上限 */
const MAX_BUFFER_SIZE = 50_000

/** 单段数据最大重试次数 */
const MAX_RETRIES = 3

/**
 * JSON Lines 流式解析器
 *
 * 将流式文本块解析为逐行的 JSON 对象。
 * 支持不完整的行缓存 + 重试 + 非 JSON 内容跳过。
 */
export class StreamParser {
  private buffer = ''
  private state: ParserState = 'idle'
  private onPage: PageCallback
  /** 当前缓冲段的重试计数 */
  private retryCount = 0
  /** 是否已经触发过 flush（防止重复调用） */
  private flushed = false
  /** 解析成功的总行数 */
  private parsedCount = 0

  constructor(onPage: PageCallback) {
    this.onPage = onPage
  }

  /**
   * 输入新的文本块
   * @param chunk SSE 流中的一个文本片段
   */
  feed(chunk: string): void {
    if (!chunk) return

    // 缓冲区溢出保护
    if (this.buffer.length + chunk.length > MAX_BUFFER_SIZE) {
      console.warn('[StreamParser] 缓冲区溢出，丢弃最早的数据')
      this.buffer = this.buffer.slice(-MAX_BUFFER_SIZE / 2)
    }

    this.buffer += chunk
    this.processBuffer()
  }

  /**
   * 流结束时冲刷缓冲区
   * 对剩余的未完成行做最后一次解析尝试
   */
  flush(): void {
    if (this.flushed) return
    this.flushed = true

    const remaining = this.buffer.trim()
    if (!remaining) return

    // 最后一次尝试解析缓冲区剩余内容
    if (this.tryParseLine(remaining)) {
      this.buffer = ''
    } else {
      // 如果仍然失败，尝试提取其中任何可能的 JSON
      this.extractAnyJson(remaining)
      this.buffer = ''
    }
  }

  /**
   * 处理缓冲区中的所有完整行
   */
  private processBuffer(): void {
    const lines = this.buffer.split('\n')
    // 最后一段可能是不完整的行，留在缓冲区
    this.buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // 跳过明显不是 JSON 的行
      if (!this.looksLikeJson(trimmed)) continue

      if (this.tryParseLine(trimmed)) {
        this.retryCount = 0 // 解析成功 → 重置重试
      }
    }
  }

  /**
   * 快速判断一行"看起来像" JSON 对象
   * 避免对问候语/说明文本做无意义的 JSON.parse
   */
  private looksLikeJson(line: string): boolean {
    const trimmed = line.trim()
    return trimmed.startsWith('{') && trimmed.endsWith('}')
  }

  /**
   * 尝试将一行文本解析为 TutorialPage
   * @returns true 表示解析成功，false 表示需要缓存重试
   */
  private tryParseLine(line: string): boolean {
    this.state = 'parsing_line'

    try {
      const parsed = JSON.parse(line)

      // 校验基础字段
      if (!parsed.pageType || !parsed.content) {
        console.warn('[StreamParser] 跳过无效行：缺少必要字段', line.slice(0, 80))
        this.state = 'line_complete'
        return true // 无效但已处理（不重试）
      }

      // 校验 pageType
      const validTypes = ['text', 'code', 'diagram', 'quiz']
      if (!validTypes.includes(parsed.pageType)) {
        console.warn(`[StreamParser] 未知 pageType: ${parsed.pageType}`)
        this.state = 'line_complete'
        return true
      }

      const page: TutorialPage = {
        pageType: parsed.pageType,
        content: parsed.content,
      }

      // 可选字段（只在有值时赋值，保持输出干净）
      if (parsed.language) page.language = String(parsed.language)
      if (parsed.desc) page.desc = String(parsed.desc)
      if (Array.isArray(parsed.options)) page.options = parsed.options
      if (parsed.answer) page.answer = String(parsed.answer)
      if (parsed.explanation) page.explanation = String(parsed.explanation)
      else console.warn('[StreamParser] 页面缺少 explanation 字段，摘要将降级', page.pageType, line.slice(0, 60))

      this.state = 'line_complete'
      this.parsedCount++
      this.onPage(page)
      return true
    } catch {
      // JSON 解析失败：
      // 1. 可能是跨 chunk 的不完整行 → 放回缓冲区等待
      // 2. 重试超过 MAX_RETRIES 次 → 丢弃（防死循环）
      this.retryCount++

      if (this.retryCount > MAX_RETRIES) {
        console.warn(
          `[StreamParser] 重试 ${MAX_RETRIES} 次仍失败，丢弃该段:`,
          line.slice(0, 60),
        )
        this.retryCount = 0
        this.state = 'line_complete'
        return true // 标记为已处理（丢弃）
      }

      // 放回缓冲区等待更多数据
      this.buffer = line + '\n' + this.buffer
      this.state = 'idle'
      return false
    }
  }

  /**
   * 从一段文本中提取任何可能的 JSON 对象
   * 用于 flush() 时兜底：即使外层有非 JSON 文本，也可能包含有效对象
   */
  private extractAnyJson(text: string): void {
    // 查找所有以 { 开始 } 结束的疑似 JSON 片段
    const jsonRegex = /\{(?:[^{}]|(?!\})\{[^{}]*\})*\}/g
    const matches = text.match(jsonRegex)

    if (matches) {
      for (const match of matches) {
        try {
          const parsed = JSON.parse(match)
          if (parsed.pageType && parsed.content) {
            const page: TutorialPage = {
              pageType: parsed.pageType,
              content: parsed.content,
            }
            if (parsed.language) page.language = String(parsed.language)
            if (parsed.desc) page.desc = String(parsed.desc)
            if (Array.isArray(parsed.options)) page.options = parsed.options
            if (parsed.answer) page.answer = String(parsed.answer)
            if (parsed.explanation) page.explanation = String(parsed.explanation)

            this.parsedCount++
            this.onPage(page)
          }
        } catch {
          // 静默跳过，已经尽力了
        }
      }
    }
  }

  /**
   * 重置解析器状态
   */
  reset(): void {
    this.buffer = ''
    this.state = 'idle'
    this.retryCount = 0
    this.flushed = false
    this.parsedCount = 0
  }

  /**
   * 获取当前状态
   */
  getState(): ParserState {
    return this.state
  }

  /**
   * 检查是否还有未完成的解析
   */
  hasPendingData(): boolean {
    return this.buffer.length > 0
  }

  /**
   * 获取已解析的页面数量
   */
  getParsedCount(): number {
    return this.parsedCount
  }
}
