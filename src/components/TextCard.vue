<script setup lang="ts">
/**
 * 文本卡片组件
 * 渲染普通讲解页面，支持增强 Markdown：
 * - **粗体** → <strong>
 * - # 标题, ## 二级标题
 * - - 列表项 → <li>
 * - ` 行内代码 `
 * - > 引用块
 */
import { computed } from 'vue'
import type { TutorialPage } from '../types'

const props = defineProps<{
  page: TutorialPage
  hideExplanation?: boolean
}>()

/**
 * 将 content 中的简易 Markdown 渲染为 HTML
 *
 * 策略: 先用占位符保护代码块，再处理其他 Markdown 标记，最后还原代码块。
 * 这防止了代码块中的 `**` / `*` / `#` 等被错误渲染。
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderContent(text: string): string {
  // 1. 提取代码块 → 占位符保护
  const codeBlocks: string[] = []
  let html = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    codeBlocks.push(escapeHtml(code))
    return `%%CODE_${codeBlocks.length - 1}%%`
  })

  // 2. 转义剩余文本中的 HTML 特殊字符（在 Markdown 替换之前）
  html = escapeHtml(html)

  // 3. 标题（替换后的 $1 已经是安全的转义文本）
  html = html.replace(/^### (.+)$/gm, '<h4 class="text-base sm:text-lg font-semibold mt-3 mb-1">$1</h4>')
  html = html.replace(/^## (.+)$/gm, '<h3 class="text-lg font-semibold mt-3 mb-1">$1</h3>')
  html = html.replace(/^# (.+)$/gm, '<h2 class="text-xl font-semibold mt-3 mb-1">$1</h2>')

  // 4. 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // 5. 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-3 border-primary/40 pl-3 italic text-fg-muted my-2">$1</blockquote>')

  // 6. 列表项
  html = html.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')

  // 7. 还原代码块（已经转义过）
  html = html.replace(/%%CODE_(\d+)%%/g, (_m, idx: string) => {
    const code = codeBlocks[parseInt(idx)]
    return `<code class="bg-bg-elevated px-1.5 py-0.5 rounded text-sm font-mono">${code}</code>`
  })

  return html
}

const paragraphs = computed(() => {
  const raw = props.page.content
  const parts = raw.split(/\n\n+|\\n\\n+/).filter(Boolean)
  return parts.map(p => p.replace(/\\n/g, '\n').trim())
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 解释说明 -->
    <p
      v-if="page.explanation && !hideExplanation"
      class="text-sm sm:text-base px-4 py-2 rounded-lg mb-2 animate-fade-in-up bg-primary/10 text-primary"
    >
      💡 {{ page.explanation }}
    </p>

    <!-- 正文段落 -->
    <div
      v-for="(para, i) in paragraphs"
      :key="i"
      class="text-base sm:text-lg leading-relaxed max-w-[65ch] animate-fade-in-up text-fg"
      :style="{
        animationDelay: `${(page.explanation ? 1 : 0) * 80 + i * 80 + 50}ms`,
        animationFillMode: 'backwards',
      }"
      v-html="renderContent(para)"
    />
  </div>
</template>
