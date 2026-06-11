import { reactive } from "vue"
import type { TutorialPage, ApiConfig, Theme } from "../types"
import { streamTutorial } from "../services/deepseekApi"

const state = reactive({
  apiKey: localStorage.getItem("ai-explainer-api-key") || (null as string | null),
  conceptInput: "",
  pages: [] as TutorialPage[],
  currentPageIndex: 0,
  isLoading: false,
  streamingPages: [] as TutorialPage[],
  error: null as string | null,
  theme: (localStorage.getItem("ai-explainer-theme") || "neon") as Theme,
})

document.documentElement.setAttribute("data-theme", state.theme)

function setTheme(theme: Theme): void {
  state.theme = theme
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem("ai-explainer-theme", theme)
}

function setApiKey(key: string): void {
  state.apiKey = key
  localStorage.setItem("ai-explainer-api-key", key)
}

function clearApiKey(): void {
  state.apiKey = null
  localStorage.removeItem("ai-explainer-api-key")
}

function resetToHome(): void {
  state.pages = []
  state.streamingPages = []
  state.currentPageIndex = 0
  state.conceptInput = ""
  state.error = null
  state.isLoading = false
}

async function startGeneration(): Promise<void> {
  const concept = state.conceptInput.trim()
  if (!concept || !state.apiKey) return
  state.pages = []
  state.streamingPages = []
  state.currentPageIndex = 0
  state.error = null
  state.isLoading = true
  const config: ApiConfig = {
    apiKey: state.apiKey,
    provider: (localStorage.getItem('ai-explainer-provider') as any) || 'deepseek',
    baseUrl: localStorage.getItem('ai-explainer-custom-url') || undefined,
    model: localStorage.getItem('ai-explainer-custom-model') || undefined,
  }
  await streamTutorial(config, concept, {
    onPage: (page: TutorialPage) => {
      state.pages.push(page)
      state.streamingPages.push(page)
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

function goToPage(index: number): void {
  if (index >= 0 && index < state.pages.length) state.currentPageIndex = index
}
function nextPage(): void { goToPage(state.currentPageIndex + 1) }
function prevPage(): void { goToPage(state.currentPageIndex - 1) }

export function useTutorialStore() {
  return {
    state,
    get currentPage() { return state.pages[state.currentPageIndex] || null },
    get totalPages() { return state.pages.length },
    get streamingPageCount() { return state.streamingPages.length },
    get progress(): number {
      return state.pages.length > 0 ? ((state.currentPageIndex + 1) / state.pages.length) * 100 : 0
    },
    get hasPages(): boolean { return state.pages.length > 0 },
    get isFirstPage(): boolean { return state.currentPageIndex === 0 },
    get isLastPage(): boolean { return state.currentPageIndex >= state.pages.length - 1 },
    setApiKey, clearApiKey, setTheme, resetToHome, startGeneration, goToPage, nextPage, prevPage,
  }
}

export type TutorialStore = ReturnType<typeof useTutorialStore>