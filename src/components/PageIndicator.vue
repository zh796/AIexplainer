<script setup lang="ts">
/**
 * 水平页面指示器
 * 一排竖条，当前页高亮。悬停 tooltip 显示摘要。点击跳转。
 */
import { computed } from 'vue'
import type { TutorialPage } from '../types'
import { getPageSummary } from '../utils/pageSummary'

const props = defineProps<{
  pages: TutorialPage[]
  currentIndex: number
}>()

const emit = defineEmits<{
  (e: 'go', index: number): void
}>()

const summaries = computed(() => props.pages.map(p => getPageSummary(p)))
</script>

<template>
  <div class="flex items-end justify-center gap-1 h-12 px-2">
    <div
      v-for="(_, i) in pages"
      :key="i"
      class="relative group flex flex-col items-center"
    >
      <button
        @click="emit('go', i)"
        class="w-2 rounded-full cursor-pointer transition-all duration-300
               bg-border hover:bg-fg-subtle"
        :class="{
          'h-7 !bg-primary shadow-[0_0_8px_rgba(var(--color-primary),0.4)]': i === currentIndex,
          'h-3 hover:h-5': i !== currentIndex,
        }"
        :style="i === currentIndex ? {
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          transitionDuration: '400ms',
        } : {}"
      />

      <div
        class="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap
               opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none
               bg-fg text-bg"
      >
        {{ summaries[i] }}
      </div>
    </div>
  </div>
</template>
