<script setup lang="ts">
/**
 * 教程卡片调度组件
 */
import type { TutorialPage } from '../types'
import TextCard from './TextCard.vue'
import CodeCard from './CodeCard.vue'
import DiagramCard from './DiagramCard.vue'
import QuizCard from './QuizCard.vue'

defineProps<{
  page: TutorialPage
  index: number
}>()
</script>

<template>
  <div class="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
    <div
      class="h-auto min-h-[320px] sm:min-h-[380px]
             max-h-[85vh] rounded-2xl px-4 sm:px-8 py-4 sm:py-6 flex flex-col overflow-y-auto
             bg-bg-card border border-border shadow-sm"
      :class="page.pageType === 'diagram' ? 'w-full max-w-full' : 'w-full max-w-3xl xl:max-w-4xl'"
      role="region"
      aria-label="教程卡片"
    >
      <div class="flex-1 flex flex-col justify-center" :class="page.pageType === 'diagram' ? '' : 'min-h-[260px]'">
        <TextCard v-if="page.pageType === 'text'" :page="page" />
        <CodeCard v-else-if="page.pageType === 'code'" :page="page" />
        <DiagramCard v-else-if="page.pageType === 'diagram'" :page="page" />
        <QuizCard v-else-if="page.pageType === 'quiz'" :page="page" />
        <div v-else class="text-center text-fg-muted">
          不支持的卡片类型: {{ page.pageType }}
        </div>
      </div>

      <div class="text-xs text-center mt-3 pt-3 text-fg-subtle border-t border-border">
        第 {{ index + 1 }} 页
      </div>
    </div>
  </div>
</template>
