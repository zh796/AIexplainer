<script setup lang="ts">
/**
 * 分类操作栏
 * 在待分类区顶部显示，提供智能分类按钮
 */
import { ref } from 'vue'

const props = defineProps<{
  uncategorizedCount: number
}>()

const emit = defineEmits<{
  (e: 'auto-classify'): void
}>()

const isClassifying = ref(false)

async function handleAutoClassify(): Promise<void> {
  isClassifying.value = true
  try {
    emit('auto-classify')
  } finally {
    setTimeout(() => { isClassifying.value = false }, 2000)
  }
}
</script>

<template>
  <div
    v-if="uncategorizedCount > 0"
    class="flex items-center justify-between px-4 py-3 rounded-lg mb-3 animate-fade-in-up
           bg-warning/10 border border-warning/40"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm">📥</span>
      <span class="text-sm font-medium text-warning">
        {{ uncategorizedCount }} 个教程待分类
      </span>
      <span class="text-xs text-fg-muted hidden sm:inline">
        拖拽到左侧目录或点击智能分类
      </span>
    </div>

    <button
      @click="handleAutoClassify"
      :disabled="isClassifying"
      class="btn-primary text-xs py-1.5 px-3 gap-1"
      aria-label="智能分类"
    >
      <span
        v-if="isClassifying"
        class="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin inline-block"
        :style="{ borderColor: 'var(--color-primary-fg)', borderTopColor: 'transparent' }"
      />
      🪄 智能分类
    </button>
  </div>
</template>
