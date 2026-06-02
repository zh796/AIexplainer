/**
 * AI Explainer - 类型定义
 */

/** 卡片页面类型 */
export type PageType = 'text' | 'code' | 'diagram' | 'quiz'

/** 单页卡片数据 */
export interface TutorialPage {
  pageType: PageType
  content: string
  language?: string
  desc?: string
  options?: string[]
  answer?: string
  explanation?: string
}

/** 流式解析器状态 */
export type ParserState = 'idle' | 'parsing_line' | 'line_complete'

/** DeepSeek API 配置 */
export interface ApiConfig {
  apiKey: string
  baseUrl?: string
  model?: string
}

/** 主题类型 */
export type Theme = 'light' | 'dark' | 'sepia' | 'neon'

/* ====== 数据库 v2 Schema 类型 ====== */

/** 教程分类状态 */
export type TutorialStatus = 'uncategorized' | 'classified'

/** 主题/文件夹节点 */
export interface Topic {
  id?: number
  name: string              // 归一化后的主题名（如"闭包"）
  aliases: string[]         // 原始查询词数组（如["什么是闭包？","给我讲讲闭包"]）
  parentId: number           // 父文件夹 id，0=根目录
  isFolder: boolean         // 是否为用户手动创建的文件夹
  isAuto: boolean           // 是否为智能分类自动创建
  createdAt: number
  updatedAt: number
}

/** 一份完整教程 */
export interface SavedTutorial {
  id?: number
  topicId: number           // 所属主题/文件夹 id
  topicName: string         // 冗余：主题名（快速显示）
  originalQuery: string     // 用户原始输入
  pageCount: number         // 页面总数
  savedAt: number           // 保存时间戳
  status: TutorialStatus    // 分类状态
}

/** 教程中的单页 */
export interface SavedPage {
  id?: number               // Dexie 自增主键
  tutorialId?: number       // 所属教程 id
  concept: string            // 学习话题
  summary: string            // 页面摘要
  pageType: PageType
  content: string            // 原始内容
  options?: string[]         // 测验选项 (quiz 类型)
  answer?: string            // 测验答案 (quiz 类型)
  savedAt: number            // 保存时间戳
  pageIndex: number          // 在原教程中的页码
}

/** 应用状态 */
export interface AppState {
  apiKey: string | null
  conceptInput: string
  pages: TutorialPage[]
  currentPageIndex: number
  isLoading: boolean
  error: string | null
  theme: Theme
}
