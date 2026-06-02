/**
 * AI Explainer - DeepSeek API 交互层
 *
 * 职责：
 * 1. 调用 DeepSeek V4 API（兼容 OpenAI 格式）
 * 2. 使用 SSE 流式接收响应
 * 3. 将流式文本块传给 StreamParser 解析
 */

import { StreamParser } from './streamParser'
import type { TutorialPage, ApiConfig } from '../types'
import systemPrompt from '../prompts/systemPrompt'

/** API 响应回调 */
export interface StreamCallbacks {
  onPage: (page: TutorialPage) => void   // 每解析出一页就回调
  onError: (error: string) => void        // 出错时回调
  onDone: () => void                      // 流结束时回调
}

const DEFAULT_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-chat'

/**
 * 创建流式对话请求
 * @param config API 配置（含 key）
 * @param concept 用户输入的概念
 * @param callbacks 回调函数集合
 */
export async function streamTutorial(
  config: ApiConfig,
  concept: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const parser = new StreamParser(callbacks.onPage)
  const baseUrl = config.baseUrl || DEFAULT_API_URL
  const model = config.model || DEFAULT_MODEL

  try {
    const response = await fetch(`${baseUrl}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: concept },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => '')
      throw new Error(`API 请求失败 (${response.status}): ${errBody}`)
    }

    if (!response.body) {
      throw new Error('浏览器不支持流式读取')
    }

    // 读取 SSE 流
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 冲刷解析器：处理缓冲区中最后可能不完整的行
        parser.flush()
        callbacks.onDone()
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // 解析 SSE 事件
      // 格式: data: {"choices":[{"delta":{"content":"..."}}]}
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留可能不完整的最后一行

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const dataStr = trimmed.slice(5).trim()

        // SSE 结束标志
        if (dataStr === '[DONE]') continue

        try {
          const data = JSON.parse(dataStr)
          const content = data?.choices?.[0]?.delta?.content || ''
          if (content) {
            parser.feed(content)
          }
        } catch {
          // 忽略解析失败的 SSE 数据行
          console.warn('[DeepSeekApi] SSE 数据解析失败:', dataStr.slice(0, 80))
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误'
    callbacks.onError(message)
  }
}
