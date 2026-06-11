<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { useTutorialStore } from "../stores/tutorialStore"
import { useFluidCanvas } from "../composables/useFluidCanvas"
import { useToast } from "../composables/useToast"
import { staggerEnter } from "../composables/useGsap"

const emit = defineEmits<{
  (e: "open-saves"): void
  (e: "explore"): void
  (e: "start-learning"): void
}>()

const store = useTutorialStore()
const toast = useToast()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const { triggerWave } = useFluidCanvas(canvasRef, {
  particleCount: 40,
  gridSpacing: 55,
  attractRadius: 220,
})

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
  if (!store.state.apiKey) {
    toast.warning("请先配置 DeepSeek API Key")
    return
  }
  store.state.conceptInput = concept
  store.startGeneration()
  emit("start-learning")
}

const exampleConcepts = ["闭包是什么", "快速排序原理", "区块链入门", "RESTful API"]
</script>

<template>
  <div class="relative min-h-screen flex flex-col">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 z-0 pointer-events-none"
      style="width: 100%; height: 100%"
    />

    <div class="flex-1 flex items-center justify-center p-4 sm:p-6 pt-16">
      <div ref="heroContentRef" class="w-full max-w-2xl flex flex-col items-center gap-8">
        <div class="text-center">
          <h1
            class="hero-title text-5xl sm:text-6xl font-extrabold mb-4 tracking-tight text-fg"
            style="font-family: var(--font-display, inherit)"
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
              class="shrink-0 px-6 py-3 rounded-xl bg-primary text-primary-fg font-semibold text-sm hover:bg-primary-hover transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {{ store.state.isLoading ? "生成中..." : "开始学习 →" }}
            </button>
          </form>
        </div>

        <!-- 快捷标签（搜索栏外部） -->
        <div class="flex flex-wrap items-center justify-center gap-2">
          <span class="text-xs text-fg-subtle">试试:</span>
          <button
            v-for="example in exampleConcepts"
            :key="example"
            @click="handleQuickConcept(example)"
            class="px-3 py-1 rounded-full text-xs transition-all duration-200 cursor-pointer bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 active:scale-95"
          >
            {{ example }}
          </button>
        </div>

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

<style scoped>
.hero-title {
  text-shadow: 0 0 48px rgba(0, 232, 255, 0.18);
}
</style>
