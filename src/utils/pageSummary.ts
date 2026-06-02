/**
 * AI Explainer - 页面摘要获取工具
 *
 * 直接使用 AI 输出的 explanation 字段作为页面摘要。
 * explanation 已是 ≤15 字的页面标题，无需再处理。
 */

import type { TutorialPage } from '../types'

const TYPE_DEFAULTS: Record<string, string> = {
  text: '知识点讲解',
  code: '代码示例',
  diagram: '概念结构图',
  quiz: '学习检验',
}

/**
 * 获取页面摘要
 *
 * 优先使用 explanation（AI 输出的页面标题），
 * 降级到 desc / content 首句 / 类型默认名。
 */
export function getPageSummary(page: TutorialPage): string {
  // 1. explanation：AI 输出的标题（新 Prompt 强制 ≤15 字）
  if (page.explanation) {
    return page.explanation
  }

  // 2. 图表用 desc
  if (page.pageType === 'diagram' && page.desc) {
    return page.desc.length > 40
      ? page.desc.slice(0, 40) + '…'
      : page.desc
  }

  // 3. content 首句兜底
  const clean = stripMarkdown(page.content)
  const first = clean.split(/[。！？\n]/).find(s => s.trim().length >= 4)
  if (first) {
    const t = first.trim()
    return t.length > 30 ? t.slice(0, 30) + '…' : t
  }

  // 4. 兜底
  return TYPE_DEFAULTS[page.pageType] || '页面内容'
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .slice(0, 200)
}
