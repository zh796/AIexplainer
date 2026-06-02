/**
 * AI Explainer - 全局状态管理
 *
 * 使用 Vue 3 reactive 实现轻量状态管理。
 */

import { reactive } from 'vue'
import type { TutorialPage, ApiConfig, Theme } from '../types'
import { streamTutorial } from '../services/deepseekApi'

/** 全局响应式状态 */
const state = reactive({
  apiKey: localStorage.getItem('ai-explainer-api-key') || null as string | null,
  conceptInput: '',
  pages: [] as TutorialPage[],
  currentPageIndex: 0,
  isLoading: false,
  error: null as string | null,
  theme: (localStorage.getItem('ai-explainer-theme') || 'neon') as Theme,
})

// ====== 关键修复：初始化时立即应用主题到 DOM ======
document.documentElement.setAttribute('data-theme', state.theme)

/** 主题切换 */
function setTheme(theme: Theme): void {
  state.theme = theme
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('ai-explainer-theme', theme)
}

/** 设置 API Key 并保存到 localStorage */
function setApiKey(key: string): void {
  state.apiKey = key
  localStorage.setItem('ai-explainer-api-key', key)
}

/** 清除 API Key */
function clearApiKey(): void {
  state.apiKey = null
  localStorage.removeItem('ai-explainer-api-key')
}

/** 回到首页（退出当前学习，重新选择话题） */
function resetToHome(): void {
  state.pages = []
  state.currentPageIndex = 0
  state.conceptInput = ''
  state.error = null
  state.isLoading = false
}

/** 开始生成教程（流式） */
async function startGeneration(): Promise<void> {
  const concept = state.conceptInput.trim()
  if (!concept || !state.apiKey) return

  // 重置状态
  state.pages = []
  state.currentPageIndex = 0
  state.error = null
  state.isLoading = true

  const config: ApiConfig = {
    apiKey: state.apiKey,
  }

  await streamTutorial(config, concept, {
    onPage: (page: TutorialPage) => {
      state.pages.push(page)
    },
    onError: (error: string) => {
      state.error = error
      state.isLoading = false
    },
    onDone: () => {
      state.isLoading = false
    },
  })
}

/** 翻页导航 */
function goToPage(index: number): void {
  if (index >= 0 && index < state.pages.length) {
    state.currentPageIndex = index
  }
}

function nextPage(): void {
  goToPage(state.currentPageIndex + 1)
}

function prevPage(): void {
  goToPage(state.currentPageIndex - 1)
}

/** 导出组合式 API */
export function useTutorialStore() {
  return {
    state,

    get currentPage() { return state.pages[state.currentPageIndex] || null },
    get totalPages() { return state.pages.length },
    get progress(): number {
      return state.pages.length > 0
        ? ((state.currentPageIndex + 1) / state.pages.length) * 100
        : 0
    },
    get hasPages(): boolean { return state.pages.length > 0 },
    get isFirstPage(): boolean { return state.currentPageIndex === 0 },
    get isLastPage(): boolean { return state.currentPageIndex >= state.pages.length - 1 },

    setApiKey,
    clearApiKey,
    setTheme,
    resetToHome,
    startGeneration,
    goToPage,
    nextPage,
    prevPage,
  }
}

export type TutorialStore = ReturnType<typeof useTutorialStore>
