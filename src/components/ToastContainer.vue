<script setup lang="ts">
/**
 * Toast 通知容器 — GSAP 增强版
 * 弹性弹入 / 淡出，自动堆叠
 */
import { watch, nextTick } from 'vue'
import { useToast } from '../composables/useToast'
import { bounceInUp } from '../composables/useGsap'

const { toasts } = useToast()

function typeClass(type: string): string {
  switch (type) {
    case 'success': return 'bg-success text-white border-success'
    case 'error':   return 'bg-error text-white border-error'
    case 'warning': return 'bg-warning text-white border-warning'
    default:        return 'bg-primary text-white border-primary'
  }
}

// 新 toast 入场动画
watch(() => toasts.value.length, (newLen, oldLen) => {
  if (newLen > (oldLen ?? 0)) {
    nextTick(() => {
      const items = document.querySelectorAll('.toast-item')
      const latest = items[items.length - 1] as HTMLElement
      if (latest) {
        bounceInUp(latest)
      }
    })
  }
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="toasts.length > 0"
      class="fixed top-4 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 pointer-events-none"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="toast-item px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg border pointer-events-auto"
        :class="typeClass(toast.type)"
      >
        {{ toast.message }}
      </div>
    </div>
  </Teleport>
</template>
