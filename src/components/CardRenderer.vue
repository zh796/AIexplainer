<script setup lang="ts">
/**
 * 卡片渲染引擎 — GSAP 增强版
 * 使用 Vue Transition JS hooks + GSAP 实现进出动画
 */
import { ref, computed, onMounted, onUnmounted, nextTick, toRaw } from 'vue'
import { useTutorialStore } from '../stores/tutorialStore'
import { useToast } from '../composables/useToast'
import { gsap } from '../composables/useGsap'
import { getPageSummary } from '../utils/pageSummary'
import { saveFullTutorial } from '../services/db'
import TutorialCard from './TutorialCard.vue'
import ThemeToggle from './ThemeToggle.vue'
import PageIndicator from './PageIndicator.vue'

const emit = defineEmits<{
  (e: 'open-saves'): void
}>()

const store = useTutorialStore()
const toast = useToast()
const isSaving = ref(false)

// 询问更多
const showAskInput = ref(false)
const followUpQuestion = ref('')
const askInputRef = ref<HTMLInputElement | null>(null)



const currentSummary = computed(() => {
  const page = store.currentPage
  return page ? getPageSummary(page) : ''
})

// ====== GSAP 进度条 ======
// 监听 progress getter 的变化
const progressEl = ref<HTMLElement | null>(null)
onMounted(() => {
  // 进度条通过 CSS transition 驱动，GSAP 弹性只在初始加载
  nextTick(() => {
    if (progressEl.value) {
      gsap.fromTo(progressEl.value, { scaleX: 0 }, {
        scaleX: 0.01,
        duration: 0.3,
        ease: 'power2.out',
      })
    }
  })
})

// ====== Vue Transition JS hooks ======
function onBeforeEnter(el: Element): void {
  const htmlEl = el as HTMLElement
  gsap.set(htmlEl, {
    opacity: 0,
    x: 80,
    scale: 0.88,
  })
}

function onEnter(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement
  gsap.to(htmlEl, {
    opacity: 1,
    x: 0,
    scale: 1,
    duration: 0.55,
    ease: 'elastic.out(1, 0.65)',
    onComplete: done,
  })
}

function onLeave(el: Element, done: () => void): void {
  const htmlEl = el as HTMLElement
  gsap.to(htmlEl, {
    opacity: 0,
    x: -50,
    scale: 0.92,
    duration: 0.22,
    ease: 'power2.in',
    onComplete: done,
  })
}

function onPageChange(newIndex: number): void {
  store.goToPage(newIndex)
}

function toggleAskInput(): void {
  showAskInput.value = !showAskInput.value
  if (showAskInput.value) {
    followUpQuestion.value = ''
    nextTick(() => askInputRef.value?.focus())
  }
}

function submitFollowUp(): void {
  const q = followUpQuestion.value.trim()
  if (!q) return
  if (!store.state.apiKey) {
    toast.warning('请先配置 DeepSeek API Key')
    return
  }
  showAskInput.value = false
  store.state.conceptInput = q
  store.startGeneration()
}

async function handleSaveTutorial(): Promise<void> {
  if (isSaving.value) return
  isSaving.value = true
  try {
    const concept = store.state.conceptInput.trim()
    const pages = toRaw(store.state.pages)
    const result = await saveFullTutorial(
      concept, concept,
      pages.map((p) => ({
        summary: getPageSummary(p),
        pageType: p.pageType,
        content: p.content,
        explanation: p.explanation,
        language: p.language,
        desc: p.desc,
        options: p.options,
        answer: p.answer,
      })),
    )
    console.log('[保存教程] 成功:', result)
    toast.success('教程已保存 ✓')
    setTimeout(() => { try { store.resetToHome() } catch { /* ignore */ } }, 1500)
  } catch (err) {
    console.error('[保存教程] 失败:', err)
    toast.error(`保存失败: ${err instanceof Error ? err.message : '未知错误'}`)
  } finally {
    isSaving.value = false
  }
}

// ====== 键盘 ======
function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'ArrowLeft')  { e.preventDefault(); store.prevPage() }
  if (e.key === 'ArrowRight') { e.preventDefault(); store.nextPage() }
  if (e.key === 'Escape')     { if (showAskInput.value) showAskInput.value = false; else emit('open-saves') }
}
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

// ====== 触摸手势 ======
let touchStartX = 0; let touchStartY = 0
function onTouchStart(e: TouchEvent): void {
  touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY
}
function onTouchEnd(e: TouchEvent): void {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
    dx > 0 ? store.prevPage() : store.nextPage()
  }
}
</script>

<template>
  <div
    class="h-full w-full flex flex-col relative overflow-hidden"
    @touchstart="onTouchStart" @touchend="onTouchEnd"
  >
    <!-- ====== 顶部栏 ====== -->
    <header class="flex items-center justify-between px-4 sm:px-5 py-2.5 z-10 shrink-0
                    bg-bg/80 backdrop-blur-sm border-b border-border">
      <button
        @click="store.resetToHome()"
        class="flex items-center gap-1 text-sm cursor-pointer text-error hover:opacity-70 transition-opacity shrink-0"
        aria-label="退出当前教程"
      >
        ✕ 退出
      </button>

      <span class="text-sm font-medium text-center truncate mx-2 text-fg">
        {{ currentSummary }}
      </span>

      <ThemeToggle />
    </header>

    <!-- ====== 进度条 ====== -->
    <div class="h-0.5 w-full shrink-0 relative overflow-hidden bg-border">
      <div
        ref="progressEl"
        class="h-full bg-gradient-to-r from-primary to-accent origin-left"
        :style="{
          transform: `scaleX(${store.progress / 100})`,
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }"
      />
    </div>

    <!-- ====== 卡片（Vue Transition + GSAP JS hooks） ====== -->
    <div class="flex-1 relative overflow-hidden" aria-live="polite">
      <Transition
        mode="out-in"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @leave="onLeave"
      >
        <TutorialCard
          :key="store.state.currentPageIndex"
          :page="store.currentPage"
          :index="store.state.currentPageIndex"
        />
      </Transition>
    </div>

    <!-- ====== 底部栏 ====== -->
    <footer class="shrink-0 px-4 pt-3 pb-2 bg-bg/80 backdrop-blur-sm border-t border-border">
      <PageIndicator
        v-if="store.totalPages > 1"
        :pages="store.state.pages"
        :current-index="store.state.currentPageIndex"
        @go="onPageChange"
      />

      <!-- 询问更多输入栏 -->
      <Transition name="ask-slide">
        <div v-if="showAskInput" class="flex items-center gap-2 mb-2">
          <input
            ref="askInputRef"
            v-model="followUpQuestion"
            type="text"
            placeholder="输入你想深入了解的内容..."
            class="flex-1 px-4 py-2 rounded-lg text-sm bg-bg border border-border text-fg placeholder:text-fg-subtle
                   focus:border-primary focus:ring-2 focus:ring-primary/20"
            @keydown.enter="submitFollowUp"
            @keydown.escape="showAskInput = false"
          />
          <button @click="submitFollowUp" class="btn-primary text-sm px-4 py-2 whitespace-nowrap">
            🚀 提问
          </button>
        </div>
      </Transition>

      <div class="flex items-center justify-between mt-2 gap-2">
        <button
          @click="store.prevPage()"
          :disabled="store.isFirstPage"
          class="btn-ghost"
          aria-label="上一页"
        >
          ← 上一页
        </button>

        <button
          @click="toggleAskInput"
          class="btn-ghost"
          :class="{ '!bg-primary/10 !text-primary !border-primary/30': showAskInput }"
          aria-label="询问更多"
        >
          🤖 询问更多
        </button>

        <button
          @click="emit('open-saves')"
          class="btn-ghost px-3"
          aria-label="打开文件管理器"
        >
          📂
        </button>

        <button
          v-if="store.isLastPage"
          @click="handleSaveTutorial"
          :disabled="isSaving"
          class="btn-primary"
          aria-label="保存整份教程"
        >
          {{ isSaving ? '保存中...' : '💾 保存教程' }}
        </button>
        <button
          v-else
          @click="store.nextPage()"
          class="btn-primary"
          aria-label="下一页"
        >
          下一页 →
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.ask-slide-enter-active {
  transition: all 0.25s ease;
}
.ask-slide-leave-active {
  transition: all 0.15s ease;
}
.ask-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
  max-height: 0;
}
.ask-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
  max-height: 0;
}
</style>
