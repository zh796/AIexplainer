export type PageType = "text" | "code" | "diagram" | "quiz"
export type Theme = "light" | "dark" | "sepia" | "neon"
export type ParserState = "idle" | "parsing_line" | "line_complete"
export type TutorialStatus = "uncategorized" | "classified"
export type ApiProvider = "deepseek" | "openai" | "custom"

export interface TutorialPage {
  pageType: PageType
  content: string
  language?: string
  desc?: string
  options?: string[]
  answer?: string
  explanation?: string
}

export interface ApiConfig {
  apiKey: string
  baseUrl?: string
  model?: string
  provider?: ApiProvider
}

export interface Topic {
  id?: number
  name: string
  aliases: string[]
  parentId: number
  isFolder: boolean
  isAuto: boolean
  createdAt: number
  updatedAt: number
}

export interface SavedTutorial {
  id?: number
  topicId: number
  topicName: string
  originalQuery: string
  pageCount: number
  savedAt: number
  status: TutorialStatus
}

export interface SavedPage {
  explanation?: string
  id?: number
  tutorialId?: number
  concept: string
  summary: string
  pageType: PageType
  content: string
  options?: string[]
  answer?: string
  savedAt: number
  pageIndex: number
}

export interface AppState {
  apiKey: string | null
  conceptInput: string
  pages: TutorialPage[]
  currentPageIndex: number
  isLoading: boolean
  error: string | null
  theme: Theme
}