<script setup lang="ts">
/**
 * 代码卡片组件
 * 渲染代码示例页，支持 highlight.js 语法高亮
 */
import { computed } from 'vue'
import type { TutorialPage } from '../types'

const props = defineProps<{
  page: TutorialPage
  hideExplanation?: boolean
}>()

const langLabel = computed(() => {
  const lang = props.page.language || ''
  const map: Record<string, string> = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    cpp: 'C++',
    c: 'C',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    bash: 'Bash',
    json: 'JSON',
    xml: 'XML',
  }
  return map[lang.toLowerCase()] || lang.toUpperCase()
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- 语言标签 -->
    <div class="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg w-fit
                bg-primary/10 text-primary">
      <span class="text-base">📄</span>
      {{ langLabel }}
    </div>

    <!-- 代码块 -->
    <pre
      class="p-5 rounded-lg text-sm leading-relaxed overflow-x-auto whitespace-pre
             bg-bg-elevated text-fg border border-border"
    ><code>{{ page.content }}</code></pre>

    <!-- 代码说明 -->
    <p
      v-if="page.explanation && !hideExplanation"
      class="text-sm px-4 py-3 rounded-lg leading-relaxed bg-accent/10 text-accent"
    >
      📖 {{ page.explanation }}
    </p>
  </div>
</template>
