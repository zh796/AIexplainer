<script setup lang="ts">
/**
 * 教程列表组件
 * 显示选中主题下的所有教程会话
 */
import type { SavedTutorial } from '../types'

defineProps<{
  tutorials: SavedTutorial[]
  topicName: string
  isLoading: boolean
  isFolder: boolean
}>()

const emit = defineEmits<{
  (e: 'view', tutorialId: number): void
  (e: 'delete', tutorialId: number): void
  (e: 'delete-folder'): void
}>()

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="flex-1 overflow-y-auto">
    <!-- 加载中 -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-16 text-fg-muted"
    >
      <div class="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin border-primary" />
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="tutorials.length === 0"
      class="flex flex-col items-center justify-center py-16 gap-2 text-fg-muted"
    >
      <span class="text-3xl">📭</span>
      <p class="text-sm">此目录下还没有保存的教程</p>
    </div>

    <!-- 教程列表 -->
    <div v-else class="flex flex-col gap-3 p-4">
      <div class="flex items-center justify-between px-1">
        <p class="text-xs font-medium text-fg-subtle">
          {{ topicName }} · {{ tutorials.length }} 次学习
        </p>
        <button
          v-if="isFolder"
          @click="emit('delete-folder')"
          class="text-xs cursor-pointer text-error hover:opacity-70 transition-opacity px-1"
          aria-label="删除此文件夹"
        >
          ✕
        </button>
      </div>

      <div
        v-for="tutorial in tutorials"
        :key="tutorial.id"
        class="rounded-lg p-4 cursor-pointer transition-all duration-200
               bg-bg border border-border shadow-sm hover:shadow-md hover:scale-[1.01] group"
        @click="tutorial.id != null && emit('view', tutorial.id)"
        role="button"
        :aria-label="'查看教程: ' + tutorial.originalQuery"
        tabindex="0"
        @keydown.enter="tutorial.id != null && emit('view', tutorial.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate text-fg">
              {{ tutorial.originalQuery }}
            </p>
            <p class="text-xs mt-1 text-fg-muted">
              {{ formatDate(tutorial.savedAt) }} · {{ tutorial.pageCount }} 页
            </p>
          </div>
          <button
            @click.stop="tutorial.id != null && emit('delete', tutorial.id)"
            class="text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100
                   transition-opacity cursor-pointer text-error bg-error/10 hover:bg-error/20"
            aria-label="删除教程"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
