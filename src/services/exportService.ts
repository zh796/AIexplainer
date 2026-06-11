import { getTutorialPages } from "./db"
import type { SavedTutorial, SavedPage } from "../types"

export type ExportFormat = "markdown" | "json"

function formatPage(page: SavedPage, index: number): string {
  const typeLabel: Record<string, string> = {
    text: "📝 正文", code: "💻 代码", diagram: "📊 图表", quiz: "🧪 测验",
  }
  let md = `\n### 第 ${index + 1} 页 — ${typeLabel[page.pageType] || page.pageType}\n\n`
  md += `${page.content}\n\n`
  if (page.explanation) md += `> 📖 ${page.explanation}\n\n`
  if (page.options && page.answer) {
    md += `**选项：** ${page.options.join(" / ")}\n\n`
    md += `**答案：** ${page.answer}\n\n`
  }
  return md
}

export async function exportTutorialAsMarkdown(tutorial: SavedTutorial): Promise<string> {
  const pages = await getTutorialPages(tutorial.id!)
  let md = `# ${tutorial.topicName}\n\n`
  md += `> 原始查询：${tutorial.originalQuery}\n`
  md += `> 保存时间：${new Date(tutorial.savedAt).toLocaleString("zh-CN")}\n`
  md += `> 共 ${pages.length} 页\n\n---\n`
  pages.forEach((p, i) => { md += formatPage(p, i) })
  md += `\n---\n*由 AI Explainer 生成 · ${new Date().toLocaleString("zh-CN")}*\n`
  return md
}

export async function exportTutorialAsJson(tutorial: SavedTutorial): Promise<string> {
  const pages = await getTutorialPages(tutorial.id!)
  return JSON.stringify({
    topicName: tutorial.topicName,
    originalQuery: tutorial.originalQuery,
    savedAt: new Date(tutorial.savedAt).toISOString(),
    pageCount: pages.length,
    pages: pages.map((p) => ({
      index: p.pageIndex,
      type: p.pageType,
      content: p.content,
      explanation: p.explanation,
      options: p.options,
      answer: p.answer,
      summary: p.summary,
    })),
    exportedAt: new Date().toISOString(),
    generator: "AI Explainer",
  }, null, 2)
}

export function downloadText(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export async function exportAndDownload(tutorial: SavedTutorial, format: ExportFormat): Promise<void> {
  const content = format === "json"
    ? await exportTutorialAsJson(tutorial)
    : await exportTutorialAsMarkdown(tutorial)
  const ext = format === "json" ? "json" : "md"
  const filename = `${tutorial.topicName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")}.${ext}`
  downloadText(content, filename)
}