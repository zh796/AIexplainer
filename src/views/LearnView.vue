<script setup lang="ts">
import { ref, watch, computed } from "vue"
import { useRouter } from "vue-router"
import CardRenderer from "../components/CardRenderer.vue"
import FileBrowser from "../components/FileBrowser.vue"
import { useTutorialStore } from "../stores/tutorialStore"

const router = useRouter()
const store = useTutorialStore()
const showSavePanel = ref(false)

function onOpenSaves() { showSavePanel.value = true }

const streamingTip = computed(() => {
  const count = store.streamingPageCount
  if (count === 0) return "正在连接 AI..."
  if (count === 1) return "已生成 1 页，内容持续加载中..."
  return `已生成 ${count} 页，内容持续加载中...`
})

watch(
  () => store.hasPages || store.state.isLoading,
  (hasContentOrLoading) => {
    if (!hasContentOrLoading && !store.state.error) { router.replace("/") }
  },
  { immediate: true },
)
</script>

<template>
  <div class="h-full w-full flex flex-col relative">
    <!-- 加载态 -->
    <template v-if="store.state.isLoading && !store.hasPages">
      <div class="flex-1 flex flex-col items-center justify-center gap-5 p-6">
        <div class="relative">
          <div class="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
        <div class="text-center">
          <p class="text-lg font-semibold text-fg mb-1">正在生成教程...</p>
          <p class="text-sm text-fg-muted">{{ store.state.conceptInput }}</p>
        </div>
        <div class="text-xs text-fg-subtle animate-pulse">{{ streamingTip }}</div>
      </div>
    </template>

    <!-- 加载但有页面了（流式已开始） -->
    <template v-else-if="store.state.isLoading && store.hasPages">
      <div class="absolute top-2 left-1/2 -translate-x-1/2 z-20">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary animate-pulse">
          <span class="w-2 h-2 rounded-full bg-primary animate-ping" />
          {{ streamingTip }}
        </div>
      </div>
      <CardRenderer @open-saves="onOpenSaves" />
      <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    </template>

    <!-- 错误态 -->
    <template v-else-if="store.state.error && !store.hasPages">
      <div class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <span class="text-4xl">⚠️</span>
        <div class="text-center">
          <p class="text-lg font-semibold text-error mb-1">生成失败</p>
          <p class="text-sm text-fg-muted max-w-md">{{ store.state.error }}</p>
        </div>
        <button @click="router.replace('/')" class="btn-primary mt-2">返回首页</button>
      </div>
    </template>

    <!-- 正常内容 -->
    <template v-else-if="store.hasPages">
      <CardRenderer @open-saves="onOpenSaves" />
      <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    </template>
  </div>
</template>