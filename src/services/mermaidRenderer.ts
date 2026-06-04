/**
 * AI Explainer - 图形转译器
 *
 * 将 AI 输出的图表文本安全地交给 Mermaid.js 渲染为 SVG。
 * 主题变量由 mermaidThemes.ts 管理。
 *
 * v2: 添加渲染缓存 + 超时保护 + 输出清理
 */
import mermaid from 'mermaid'
import { resolveVars } from './mermaidThemes'
import type { MermaidVars } from './mermaidThemes'

export interface MermaidResult {
  type: 'success' | 'error'
  svg?: string
  fallback?: string
  errorDetail?: string
}

/** 渲染超时 (ms) */
const RENDER_TIMEOUT = 15_000

/** 简易缓存：contentHash → { svg, theme } */
const renderCache = new Map<string, { svg: string; theme: string }>()
const MAX_CACHE_SIZE = 20

/** 生成缓存键 */
function cacheKey(definition: string, theme: string): string {
  // 简单哈希：content + theme
  let hash = 0
  const str = definition + '|' + theme
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0
  }
  return String(hash)
}

/** 清理 Mermaid 输出的 SVG（移除脚本、外部资源、危险元素等） */
function sanitizeSvg(svg: string): string {
  return svg
    // 移除 script 标签及其内容
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // 移除所有 on* 事件处理器（双引号和单引号）
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    // 移除外部资源引用（保留 data: URI）
    .replace(/xlink:href\s*=\s*"(?!data:)[^"]*"/gi, '')
    .replace(/href\s*=\s*"(?:https?:|javascript:)[^"]*"/gi, '')
    // 移除 foreignObject（可嵌入任意 HTML）
    .replace(/<foreignObject\b[\s\S]*?<\/foreignObject>/gi, '')
    // 移除危险的动画/设置元素中带 href 的标签
    .replace(/<(?:animate|set)\b[^>]*href\s*=\s*"[^"]*"[^>]*\/?>/gi, '')
    // 移除 <use> 引用外部资源
    .replace(/<use\b[^>]*(?:href|xlink:href)\s*=\s*"(?!#)[^"]*"[^>]*\/?>/gi, '')
}

/** 配置 Mermaid 全局选项 */
function configureMermaid(): void {
  const v: MermaidVars = resolveVars()

  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: { ...v, fontSize: '14px' },
    flowchart: {
      htmlLabels: false, curve: 'basis',
      nodeSpacing: 60, rankSpacing: 70, padding: 20, useMaxWidth: false,
    },
    sequence: {
      diagramMarginX: 50, diagramMarginY: 20, actorMargin: 50,
      boxMargin: 10, boxTextMargin: 5, noteMargin: 10, messageMargin: 35,
      mirrorActors: true, useMaxWidth: false,
    },
    gantt: {
      titleTopMargin: 25, barHeight: 20, barGap: 4,
      topPadding: 50, leftPadding: 75, gridLineStartPadding: 35,
      fontSize: 13, sectionFontSize: 14,
    },
  })
}

/**
 * 带超时的 Promise 包装
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`渲染超时 (${ms}ms)`)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) },
    )
  })
}

export async function renderDiagram(
  definition: string,
  desc?: string,
): Promise<MermaidResult> {
  const cleaned = definition.trim()
  if (!cleaned) {
    return { type: 'error', fallback: desc || '（图表内容为空）', errorDetail: 'definition 为空字符串' }
  }

  // 检查缓存
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark'
  const key = cacheKey(cleaned, currentTheme)
  const cached = renderCache.get(key)
  if (cached) {
    return { type: 'success', svg: cached.svg, fallback: desc }
  }

  let container: HTMLDivElement | null = null

  try {
    configureMermaid()

    container = document.createElement('div')
    container.style.cssText =
      'position:absolute;left:-9999px;top:0;width:800px;visibility:visible;pointer-events:none;'
    container.textContent = cleaned
    document.body.appendChild(container)

    await withTimeout(mermaid.run({ nodes: [container] }), RENDER_TIMEOUT)

    const rawSvg = container.innerHTML

    if (!rawSvg || rawSvg === cleaned) {
      throw new Error('Mermaid 未生成有效 SVG（可能是不支持的图表类型）')
    }

    const svg = sanitizeSvg(rawSvg)

    // 写入缓存（LRU 简单实现：满了就清一半）
    if (renderCache.size >= MAX_CACHE_SIZE) {
      const entries = [...renderCache.keys()]
      for (let i = 0; i < Math.floor(entries.length / 2); i++) {
        renderCache.delete(entries[i])
      }
    }
    renderCache.set(key, { svg, theme: currentTheme })

    return { type: 'success', svg, fallback: desc }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[MermaidRenderer] 失败:', message)

    let hint = ''
    if (message.includes('syntax') || message.includes('parse') || message.includes('Lex')) {
      hint = '—— 图表语法有误，请检查定义'
    } else if (message.includes('未生成有效')) {
      hint = '—— 该图表类型可能暂不支持'
    } else if (message.includes('超时')) {
      hint = '—— 图表过于复杂，渲染超时'
    }

    return {
      type: 'error',
      fallback: desc || `（图表渲染失败${hint}）`,
      errorDetail: message,
    }
  } finally {
    if (container?.parentNode) {
      container.parentNode.removeChild(container)
    }
  }
}

/** 清空渲染缓存（主题切换时调用可保留，因为已按 theme 分 key） */
export function clearRenderCache(): void {
  renderCache.clear()
}

/** 验证 Mermaid 定义文本是否合法 */
export function isValidDefinition(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed) return false

  const validPrefixes = [
    'graph ', 'flowchart ', 'sequenceDiagram', 'classDiagram',
    'stateDiagram', 'stateDiagram-v2', 'gantt', 'pie ',
    'erDiagram', 'journey', 'mindmap', 'timeline',
    'gitGraph', 'quadrantChart', 'requirementDiagram',
    'block', 'c4context', 'c4container', 'c4component',
    'sankey', 'xychart', 'kanban',
  ]

  return validPrefixes.some(prefix => trimmed.startsWith(prefix))
}
