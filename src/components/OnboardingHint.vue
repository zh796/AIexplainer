<script setup lang="ts">
import { ref, onMounted } from "vue"

const visible = ref(false)
const dismissed = ref(false)

onMounted(() => {
  const seen = localStorage.getItem("ai-explainer-onboarded")
  if (!seen) {
    setTimeout(() => { visible.value = true }, 800)
  }
})

function dismiss(): void {
  visible.value = false
  dismissed.value = true
  localStorage.setItem("ai-explainer-onboarded", "1")
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible && !dismissed"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] max-w-sm w-[90vw] p-5 rounded-2xl
               bg-bg-card border border-primary/30 shadow-lg shadow-primary/10"
      >
        <div class="flex items-start gap-3">
          <span class="text-3xl shrink-0">👋</span>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-fg mb-1">欢迎使用 AI Explainer</h4>
            <p class="text-xs text-fg-muted leading-relaxed mb-3">
              输入任何概念，AI 为你生成互动教程。
              按 <kbd class="px-1 py-0.5 rounded bg-bg border border-border text-[10px]">← →</kbd> 翻页，
              翻到最后一页点击保存即可存入本地。
            </p>
            <div class="flex gap-2">
              <button @click="dismiss" class="btn-primary text-xs py-1.5 px-4">开始探索 🚀</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>