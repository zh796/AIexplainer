<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { useTutorialStore } from "../stores/tutorialStore"
import { useFluidCanvas } from "../composables/useFluidCanvas"
import { useToast } from "../composables/useToast"
import { staggerEnter } from "../composables/useGsap"
import type { Theme } from "../types"

const emit = defineEmits<{
  (e: "open-saves"): void
  (e: "explore"): void
  (e: "start-learning"): void
}>()

const store = useTutorialStore()
const toast = useToast()

// Canvas background
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { triggerWave } = useFluidCanvas(canvasRef, {
  particleCount: 40,
  gridSpacing: 55,
  attractRadius: 220,
})

// GSAP entrance
const heroContentRef = ref<HTMLElement | null>(null)
onMounted(() => {
  nextTick(() => {
    staggerEnter(heroContentRef.value!, {
      stagger: 0.1,
      from: { y: 36, opacity: 0 },
      to: { duration: 0.55, ease: "power3.out" },
    })
  })
})

const conceptInputRef = ref<HTMLInputElement | null>(null)

function handleSubmit(): void {
  if (!store.state.conceptInput.trim()) {
    toast.warning("请先输入一个学习概念")
    conceptInputRef.value?.focus()
    return
  }
  if (!store.state.apiKey) {
    toast.warning("请先配置 DeepSeek API Key")
    return
  }
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) triggerWave(rect.width / 2, rect.height / 2)
  store.startGeneration()
  emit("start-learning")
}

function handleQuickConcept(concept: string): void {
  if (!store.state.apiKey) { toast.warning("请先配置 DeepSeek API Key"); return }
  store.state.conceptInput = concept
  store.startGeneration()
  emit("start-learning")
}

const exampleConcepts = ["闭包是什么", "快速排序原理", "区块链入门", "RESTful API"]

const themes: { key: Theme; label: string; icon: string }[] = [
  { key: "neon", label: "霓虹", icon: "💠" },
  { key: "light", label: "浅色", icon: "☀️" },
  { key: "dark", label: "深色", icon: "🌙" },
  { key: "sepia", label: "护眼", icon: "📜" },
]

function switchTheme(theme: Theme): void {
  store.setTheme(theme)
}
</script>

<template>
  <div class="relative min-h-screen flex flex-col">
    <!-- Canvas 背景 -->
    <canvas
      ref="canvasRef"
      class="absolute inset-0 z-0 pointer-events-none"
      style="width:100%;height:100%"
    />

    <!-- 顶部操作栏 -->
    <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
      <button
        @click="switchTheme(themes[(themes.findIndex(t => t.key === store.state.theme) + 1) % themes.length].key)"
        class="btn-ghost text-xs py-1.5 px-3 cursor-pointer"
        :title="'主题：' + themes.find(t => t.key === store.state.theme)?.label"
      >
        {{ themes.find(t => t.key === store.state.theme)?.icon }}
      </button>
      <button @click="emit('open-saves')" class="btn-ghost text-xs py-1.5 px-3" aria-label="文件管理器">
        📂
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div ref="heroContentRef" class="w-full max-w-2xl flex flex-col items-center gap-8">
        <!-- 标题 -->
        <div class="text-center">
          <h1
            class="text-5xl sm:text-6xl font-extrabold mb-4 text-fg tracking-tight"
            style="font-family:var(--font-display,inherit)"
          >
            AI <span class="text-primary">Explainer</span>
          </h1>
          <p class="text-base sm:text-lg text-fg-muted max-w-lg mx-auto leading-relaxed">
            输入任何概念，AI 即时生成图文并茂的互动教程
          </p>
        </div>

        <!-- 搜索输入框 -->
        <div class="w-full bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-1.5 shadow-lg">
          <form @submit.prevent="handleSubmit" class="flex items-center gap-2">
            <input
              id="hero-concept-input"
              ref="conceptInputRef"
              v-model="store.state.conceptInput"
              type="text"
              placeholder="输入你想学习的任何概念..."
              class="flex-1 px-4 py-3.5 bg-transparent text-base text-fg placeholder:text-fg-subtle border-none outline-none"
            />
            <button
              type="submit"
              :disabled="store.state.isLoading"
              class="shrink-0 px-6 py-3 rounded-xl bg-primary text-primary-fg font-semibold text-sm
                     hover:bg-primary-hover transition-all duration-200
                     disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ store.state.isLoading ? "生成中..." : "开始学习 →" }}
            </button>
          </form>
          <!-- 快捷标签 -->
          <div class="flex flex-wrap gap-1.5 px-4 pb-2.5 mt-1">
            <span class="text-xs text-fg-subtle mr-1 pt-1">试试:</span>
            <button
              v-for="example in exampleConcepts" :key="example"
              @click="handleQuickConcept(example)"
              class="px-3 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer
                     bg-primary/10 text-primary border border-primary/20
                     hover:bg-primary/20 active:scale-95"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <!-- 特性简介 -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <div class="flex items-start gap-3 p-4 rounded-xl bg-bg-card/50 border border-border/50">
            <span class="text-2xl shrink-0">📝</span>
            <div>
              <h4 class="text-sm font-semibold text-fg">结构化讲解</h4>
              <p class="text-xs text-fg-muted mt-0.5">AI 自动拆解概念，分页呈现</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 rounded-xl bg-bg-card/50 border border-border/50">
            <span class="text-2xl shrink-0">📊</span>
            <div>
              <h4 class="text-sm font-semibold text-fg">图表 + 代码</h4>
              <p class="text-xs text-fg-muted mt-0.5">Mermaid 图表 + 高亮代码示例</p>
            </div>
          </div>
          <div class="flex items-start gap-3 p-4 rounded-xl bg-bg-card/50 border border-border/50">
            <span class="text-2xl shrink-0">✅</span>
            <div>
              <h4 class="text-sm font-semibold text-fg">互动测验</h4>
              <p class="text-xs text-fg-muted mt-0.5">学完即测，巩固知识点</p>
            </div>
          </div>
        </div>

        <!-- 了解更多提示 -->
        <button
          @click="emit('explore')"
          class="flex items-center gap-2 px-4 py-2 text-sm text-fg-muted hover:text-primary transition-colors cursor-pointer"
        >
          <span>▼</span> 了解 AI 如何工作
        </button>
      </div>
    </div>
  </div>
</template>