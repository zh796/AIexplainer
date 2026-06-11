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

// Structured error analysis
const errorInfo = computed(() => {
  const raw = store.state.error
  if (!raw) return null
  const msg = raw.toLowerCase()

  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("验证失败")) {
    return {
      title: "API 验证失败",
      desc: "当前 Key 无法通过服务商验证，请检查后重试。",
      suggestions: ["检查 API Key 是否正确", "确认 Key 未过期或被撤销"],
      actions: [
        { label: "前往配置", handler: () => router.push("/api-key") },
        { label: "返回首页", handler: () => router.replace("/") },
      ],
    }
  }
  if (msg.includes("429") || msg.includes("rate") || msg.includes("quota") || msg.includes("额度")) {
    return {
      title: "请求频率过高或额度不足",
      desc: "当前模型暂时无法继续生成，稍后重试或切换模型可能恢复。",
      suggestions: ["等待一段时间后重试", "尝试切换到其他模型"],
      actions: [
        { label: "稍后重试", handler: () => router.replace("/") },
        { label: "前往配置", handler: () => router.push("/api-key") },
      ],
    }
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("cors") || msg.includes("网络") || msg.includes("failed to fetch")) {
    return {
      title: "网络连接异常",
      desc: "无法到达 AI 服务，请检查网络或代理配置。",
      suggestions: ["检查网络连接", "如使用代理，请确认配置正确"],
      actions: [
        { label: "重试", handler: () => router.replace("/") },
      ],
    }
  }
  if (msg.includes("stream") || msg.includes("流")) {
    return {
      title: "内容流中断",
      desc: "AI 输出被意外中断，已生成内容可能保留。",
      suggestions: ["部分页面可能已生成成功"],
      actions: [
        { label: "返回首页", handler: () => router.replace("/") },
      ],
    }
  }
  // Fallback
  return {
    title: "生成失败",
    desc: raw,
    suggestions: [],
    actions: [
      { label: "返回首页", handler: () => router.replace("/") },
      { label: "前往配置", handler: () => router.push("/api-key") },
    ],
  }
})

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
    <!-- Loading: no pages yet -->
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

    <!-- Streaming: pages exist and still loading -->
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

    <!-- Error state: structured error display -->
    <template v-else-if="store.state.error && !store.hasPages && errorInfo">
      <div class="flex-1 flex flex-col items-center justify-center gap-4 p-6">
        <span class="text-4xl">⚠️</span>
        <div class="text-center max-w-md">
          <p class="text-lg font-semibold text-error mb-1">{{ errorInfo.title }}</p>
          <p class="text-sm text-fg-muted leading-relaxed mb-3">{{ errorInfo.desc }}</p>
          <ul v-if="errorInfo.suggestions.length" class="text-xs text-fg-subtle text-left bg-bg-elevated rounded-xl p-4 border border-border mb-4">
            <li v-for="(s, i) in errorInfo.suggestions" :key="i" class="flex items-start gap-2 mb-1 last:mb-0">
              <span class="text-primary shrink-0">&bull;</span>
              <span>{{ s }}</span>
            </li>
          </ul>
        </div>
        <div class="flex gap-3">
          <button
            v-for="(action, i) in errorInfo.actions"
            :key="i"
            @click="action.handler"
            :class="i === 0 ? 'btn-primary' : 'btn-ghost'"
          >
            {{ action.label }}
          </button>
        </div>
      </div>
    </template>

    <!-- Content -->
    <template v-else-if="store.hasPages">
      <CardRenderer @open-saves="onOpenSaves" />
      <FileBrowser v-if="showSavePanel" @close="showSavePanel = false" />
    </template>
  </div>
</template>
