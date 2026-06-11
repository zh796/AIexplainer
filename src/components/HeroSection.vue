<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue"
import { useTutorialStore } from "../stores/tutorialStore"
import { useFluidCanvas } from "../composables/useFluidCanvas"
import { useToast } from "../composables/useToast"
import { staggerEnter } from "../composables/useGsap"

const props = defineProps<{
  hasKey: boolean
}>()

const emit = defineEmits<{
  (e: "open-saves"): void
  (e: "explore"): void
  (e: "start-learning"): void
  (e: "open-api-key"): void
}>()

const store = useTutorialStore()
const toast = useToast()

// Canvas background
const canvasRef = ref<HTMLCanvasElement | null>(null)
const { triggerWave } = useFluidCanvas(canvasRef, {
  particleCount: 30,
  gridSpacing: 55,
  attractRadius: 220,
})

// GSAP entrance
const titleRef = ref<HTMLElement | null>(null)
const inputCardRef = ref<HTMLElement | null>(null)
const featuresRef = ref<HTMLElement | null>(null)
const howItWorksRef = ref<HTMLElement | null>(null)

onMounted(() => {
  nextTick(() => {
    staggerEnter(titleRef.value!, {
      stagger: 0.12,
      from: { y: 40, opacity: 0, scale: 0.95 },
      to: { duration: 0.6, ease: "back.out(1.7)" },
    })
    staggerEnter(inputCardRef.value!, {
      stagger: 0.1,
      from: { y: 28, opacity: 0 },
      to: { duration: 0.5, ease: "power3.out", delay: 0.25 },
    })
    staggerEnter(featuresRef.value!, {
      stagger: 0.08,
      from: { opacity: 0, y: 16 },
      to: { duration: 0.4, delay: 0.4 },
    })
    staggerEnter(howItWorksRef.value!, {
      stagger: 0.06,
      from: { opacity: 0, y: 12 },
      to: { duration: 0.35, delay: 0.55 },
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
  const rect = canvasRef.value?.getBoundingClientRect()
  if (rect) triggerWave(rect.width / 2, rect.height / 2)
  emit("start-learning")
}

function handleQuickConcept(concept: string): void {
  store.state.conceptInput = concept
  handleSubmit()
}

const exampleConcepts = ["闭包是什么", "快速排序原理", "区块链入门", "RESTful API"]

const steps = [
  { icon: "✏️", title: "输入概念", desc: "输入你想深入学习的任意主题" },
  { icon: "🤖", title: "AI 生成", desc: "实时生成分步讲解、代码与测验" },
  { icon: "💾", title: "保存复习", desc: "保存到本地，随时回看已学内容" },
]
</script>

<template>
  <div class="relative min-h-[85vh] flex flex-col">
    <canvas
      ref="canvasRef"
      class="absolute inset-0 z-0 pointer-events-none"
      style="width:100%;height:100%"
    />

    <!-- Top bar: saves button only (theme toggle moved to global header) -->
    <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
      <button @click="emit('open-saves')" class="btn-ghost text-xs py-1.5 px-3" aria-label="文件管理器">
        📂 已保存
      </button>
    </div>

    <!-- Main hero content -->
    <div class="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
      <div class="w-full max-w-2xl flex flex-col items-center gap-8">

        <!-- Title -->
        <div ref="titleRef" class="text-center">
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

        <!-- Search input card -->
        <div ref="inputCardRef" class="w-full bg-bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-1.5 shadow-lg">
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
              {{ store.state.isLoading ? "生成中..." : (hasKey ? "开始学习 →" : "开始学习（需配置 Key）") }}
            </button>
          </form>
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

        <!-- API Key hint (only when not configured) -->
        <div v-if="!hasKey" class="text-center">
          <button
            @click="emit('open-api-key')"
            class="text-xs text-fg-subtle hover:text-primary transition-colors cursor-pointer"
          >
            ⚙️ 配置 API Key（首次使用需配置）
          </button>
        </div>

        <!-- Features -->
        <div ref="featuresRef" class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
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

        <!-- How it works -->
        <button
          @click="emit('explore')"
          class="flex items-center gap-2 px-4 py-2 text-sm text-fg-muted hover:text-primary transition-colors cursor-pointer"
        >
          <span>▼</span> 了解 AI 如何工作
        </button>
      </div>
    </div>

    <!-- How it works section -->
    <section ref="howItWorksRef" class="relative z-10 border-t border-border">
      <div class="max-w-2xl mx-auto px-4 py-10 sm:py-14">
        <h2 class="text-center text-lg font-semibold text-fg mb-8">如何使用</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            v-for="(step, i) in steps"
            :key="i"
            class="flex flex-col items-center text-center p-5 rounded-xl bg-bg-card/50 border border-border/50"
          >
            <span class="text-2xl mb-2">{{ step.icon }}</span>
            <h3 class="text-sm font-semibold text-fg mb-1">{{ step.title }}</h3>
            <p class="text-xs text-fg-muted leading-relaxed">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
