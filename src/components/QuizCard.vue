<script setup lang="ts">
/**
 * 测验卡片组件 — GSAP 增强版
 * GSAP confetti burst 替代 Canvas 粒子
 */
import { ref, computed } from 'vue'
import type { TutorialPage } from '../types'
import { confettiBurst } from '../composables/useGsap'

const props = defineProps<{
  page: TutorialPage
  hideExplanation?: boolean
}>()

const selectedOption = ref<string | null>(null)
const hasSubmitted = ref(false)
const isCorrect = ref(false)
const quizContainer = ref<HTMLElement | null>(null)

const options = computed(() => props.page.options || [])
const correctAnswer = computed(() => (props.page.answer || '').trim().toUpperCase())

function selectOption(optKey: string): void {
  if (hasSubmitted.value) return
  selectedOption.value = optKey
}

function submitAnswer(): void {
  if (!selectedOption.value || hasSubmitted.value) return
  hasSubmitted.value = true
  isCorrect.value = selectedOption.value === correctAnswer.value
  if (isCorrect.value && quizContainer.value) {
    confettiBurst(quizContainer.value, { count: 50 })
  }
}

function resetQuiz(): void {
  selectedOption.value = null
  hasSubmitted.value = false
  isCorrect.value = false
}

function getOptionClasses(optKey: string): string {
  const base = 'w-full text-left px-5 py-4 rounded-xl border cursor-pointer transition-all duration-200'

  if (!hasSubmitted.value) {
    if (selectedOption.value === optKey) {
      return `${base} border-primary bg-primary/10 text-fg ring-1 ring-primary/50`
    }
    return `${base} border-border bg-bg-card text-fg hover:border-fg-subtle`
  }

  if (optKey === correctAnswer.value) {
    return `${base} border-success bg-success/10 text-success font-medium`
  }
  if (optKey === selectedOption.value && !isCorrect.value) {
    return `${base} border-error bg-error/10 text-error`
  }
  return `${base} border-border bg-bg-card text-fg opacity-40`
}
</script>

<template>
  <div ref="quizContainer" class="flex flex-col gap-5 relative overflow-hidden">
    <!-- 题目 -->
    <h3 class="text-xl font-semibold leading-relaxed text-fg">
      {{ page.content }}
    </h3>

    <!-- 选项列表 -->
    <div class="flex flex-col gap-3">
      <button
        v-for="opt in options"
        :key="opt"
        @click="selectOption(opt[0])"
        :disabled="hasSubmitted"
        :class="getOptionClasses(opt[0])"
      >
        {{ opt }}
      </button>
    </div>

    <!-- 提交按钮 -->
    <button
      v-if="!hasSubmitted"
      @click="submitAnswer"
      :disabled="!selectedOption"
      class="btn-primary w-full"
    >
      提交答案
    </button>

    <!-- 结果反馈 -->
    <div v-if="hasSubmitted" class="flex flex-col gap-3">
      <div
        v-if="isCorrect"
        class="text-center py-4 px-4 rounded-xl font-medium bg-success/10 text-success animate-fade-in-scale"
      >
        ✅ 回答正确！🎉
      </div>

      <div
        v-else
        class="text-center py-4 px-4 rounded-xl font-medium bg-error/10 text-error animate-fade-in-up"
      >
        ❌ 回答错误。正确答案是 {{ correctAnswer }}
      </div>

      <!-- 解析 -->
      <p
        v-if="page.explanation && !hideExplanation"
        class="text-sm px-4 py-3 rounded-lg leading-relaxed bg-accent/10 text-accent"
      >
        📖 {{ page.explanation }}
      </p>

      <!-- 重试按钮 -->
      <button
        @click="resetQuiz"
        class="btn-ghost mt-2"
      >
        重新作答
      </button>
    </div>
  </div>
</template>
