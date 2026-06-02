<script setup lang="ts">
/**
 * Hero 首页组件 — GSAP 增强版 + 双模式入口
 * 模式 1: 探索 AI (教育浏览)
 * 模式 2: 开始学习 (AI 教程生成)
 */
import { ref, onMounted, nextTick } from 'vue'
import { useTutorialStore } from '../stores/tutorialStore'
import { useFluidCanvas } from '../composables/useFluidCanvas'
import { useToast } from '../composables/useToast'
import { staggerEnter } from '../composables/useGsap'

const emit = defineEmits<{
  (e: 'open-saves'): void
  (e: 'explore'): void
  (e: 'start-learning'): void
}>()

const store = useTutorialStore()
const toast = useToast()

// ====== Canvas 背景 ======
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { triggerWave } = useFluidCanvas(canvasRef, {
  particleCount: 45,
  gridSpacing: 50,
  attractRadius: 250,
})

// ====== GSAP 入场 ======
const titleRef = ref<HTMLElement | null>(null)
const modeCardsRef = ref<HTMLElement | null>(null)
const inputCardRef = ref<HTMLElement | null>(null)
const footerRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    staggerEnter(titleRef.value!, {
      stagger: 0.12,
      from: { y: 40, opacity: 0, scale: 0.95 },
      to: { duration: 0.6, ease: 'back.out(1.7)' },
    })
    staggerEnter(modeCardsRef.value!, {
      stagger: 0.15,
      from: { y: 30, opacity: 0, scale: 0.9 },
      to: { duration: 0.5, ease: 'back.out(1.4)', delay: 0.25 },
    })
    staggerEnter(inputCardRef.value!, {
      stagger: 0.1,
      from: { y: 28, opacity: 0 },
      to: { duration: 0.5, ease: 'power3.out', delay: 0.45 },
    })
    staggerEnter(footerRef.value!, {
      stagger: 0.06,
      from: { opacity: 0, y: 8 },
      to: { duration: 0.3, delay: 0.6 },
    })
  })
})

// ====== 输入框引用 ======
const conceptInputRef = ref<HTMLInputElement | null>(null)

function handleSubmitClick(): void {
  if (!store.state.conceptInput.trim()) {
    toast.warning('请先输入一个学习概念')
    conceptInputRef.value?.focus()
    return
  }
  if (!store.state.apiKey) {
    toast.warning('请先配置 DeepSeek API Key')
    return
  }
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  triggerWave(rect.width / 2, rect.height / 2)
  store.startGeneration()
  emit('start-learning')
}

function handleExplore(): void {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) triggerWave(rect.width / 2, rect.height / 2)
  emit('explore')
}

/** 点击 "AI 教学" 卡片 → 聚焦输入框 */
function handleTeachingCardClick(): void {
  conceptInputRef.value?.focus()
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) triggerWave(rect.width / 2, rect.height / 2)
}

/** 快捷概念点击 → 先校验 API Key */
function handleQuickConcept(concept: string): void {
  if (!store.state.apiKey) {
    toast.warning('请先配置 DeepSeek API Key')
    return
  }
  store.state.conceptInput = concept
  store.startGeneration()
  emit('start-learning')
}

const exampleConcepts = ['闭包是什么', '快速排序原理', '区块链入门', 'RESTful API']
</script>

<template>
  <div class="flex-1 relative z-10 flex flex-col">
    <!-- Canvas 背景层 -->
    <canvas
      ref="canvasRef"
      class="absolute inset-0 z-0 pointer-events-none"
      style="width:100%;height:100%"
    />

    <!-- 顶部操作栏 -->
    <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
      <button
        @click="emit('open-saves')"
        class="btn-ghost text-xs py-1.5 px-3"
        aria-label="打开文件管理器"
      >
        📂
      </button>
    </div>

    <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="w-full max-w-xl sm:max-w-2xl flex flex-col gap-6">
        <!-- 标题区域 -->
        <div ref="titleRef" class="text-center">
          <h1 class="text-4xl sm:text-5xl font-bold mb-3 text-fg tracking-tight" style="font-family:var(--font-display,inherit)">
            AI <span class="text-primary">Explainer</span>
          </h1>
          <p class="text-sm sm:text-base text-fg-muted max-w-md mx-auto">
            了解 AI 如何工作，或让 AI 为你讲解任何概念
          </p>
        </div>

        <!-- ====== 双模式入口 ====== -->
        <div ref="modeCardsRef" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- 探索 AI -->
          <button
            @click="handleExplore()"
            class="group rounded-2xl p-5 sm:p-6 bg-bg-card border border-border
                   hover:border-primary transition-all duration-300 text-left
                   hover:shadow-md cursor-pointer"
          >
            <div class="flex items-start gap-4">
              <span class="text-3xl shrink-0">🔍</span>
              <div>
                <h3 class="font-semibold text-fg mb-1 group-hover:text-primary transition-colors">
                  了解 AI
                </h3>
                <p class="text-xs text-fg-muted leading-relaxed">
                  从零开始探索人工智能的核心概念、工作原理和关键术语
                </p>
                <span class="inline-block mt-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  开始浏览 →
                </span>
              </div>
            </div>
          </button>

          <!-- 开始学习 -->
          <button
            @click="handleTeachingCardClick()"
            class="group rounded-2xl p-5 sm:p-6 bg-primary/5 border border-primary/20
                   hover:bg-primary/10 hover:border-primary/40 transition-all duration-300 text-left
                   hover:shadow-md cursor-pointer"
          >
            <div class="flex items-start gap-4">
              <span class="text-3xl shrink-0">🚀</span>
              <div>
                <h3 class="font-semibold text-fg mb-1">AI 教学</h3>
                <p class="text-xs text-fg-muted leading-relaxed">
                  输入任何概念，AI 即时生成结构化教程——含代码、图表和测验
                </p>
                <span class="inline-block mt-2 text-xs text-primary">下方输入 →</span>
              </div>
            </div>
          </button>
        </div>

        <!-- 输入卡片 -->
        <div ref="inputCardRef" class="rounded-2xl p-6 sm:p-8 bg-bg-card border border-border shadow-sm">
          <form @submit.prevent="handleSubmitClick" class="flex flex-col gap-4">
            <label for="concept-input" class="sr-only">输入学习概念</label>
            <input
              id="concept-input"
              ref="conceptInputRef"
              v-model="store.state.conceptInput"
              type="text"
              placeholder="例如：什么是闭包、区块链原理..."
              class="w-full px-5 py-4 rounded-xl text-base transition-all duration-200
                     bg-bg border border-border text-fg placeholder:text-fg-subtle
                     focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              :disabled="store.state.isLoading"
              class="btn-primary w-full py-4 text-base"
            >
              {{ store.state.isLoading ? '生成中...' : '🚀 开始学习' }}
            </button>
          </form>

          <div class="mt-5 flex flex-wrap justify-center gap-2">
            <span class="text-xs w-full mb-1 text-center text-fg-subtle">
              试试这些 →
            </span>
            <button
              v-for="example in exampleConcepts"
              :key="example"
              @click="handleQuickConcept(example)"
              class="px-3 py-1.5 rounded-full text-xs transition-all duration-200 cursor-pointer
                     bg-primary/10 text-primary border border-primary/20
                     hover:bg-primary/20 active:scale-95"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <p ref="footerRef" class="text-center text-xs text-fg-subtle">
          🔒 数据保存在本地 · 已登录
        </p>
      </div>
    </main>
  </div>
</template>
