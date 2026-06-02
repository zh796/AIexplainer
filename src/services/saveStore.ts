/**
 * AI Explainer - 保存模块 (v2)
 *
 * 对接 db.ts v2 Schema，同时保持旧 API 兼容。
 * topics / tutorials / pages 三层结构。
 */
import { toRaw } from 'vue'
import { db, getOrCreateTopic } from './db'
import type { SavedPage, TutorialPage } from '../types'
import { getPageSummary } from '../utils/pageSummary'

// ====== 旧 API 兼容 ======

/** 保存单个页面（用于 "📌 记录此页" 功能） */
export async function savePage(
  concept: string,
  page: TutorialPage,
  pageIndex: number,
): Promise<number> {
  const raw = toRaw(page)
  const summary = getPageSummary(raw)
  const topicId = await getOrCreateTopic(concept, concept)

  const existing = await db.tutorials
    .where({ topicId, originalQuery: concept })
    .first()

  let tutorialId: number
  if (existing && existing.id != null) {
    tutorialId = existing.id
    await db.tutorials.update(tutorialId, {
      pageCount: existing.pageCount + 1,
    })
  } else {
    tutorialId = await db.tutorials.add({
      topicId,
      topicName: concept,
      originalQuery: concept,
      pageCount: 1,
      savedAt: Date.now(),
      status: 'classified',
    })
  }

  return db.pages.add({
    tutorialId,
    concept,
    summary,
    pageType: raw.pageType,
    content: raw.content,
    options: raw.options,
    answer: raw.answer,
    savedAt: Date.now(),
    pageIndex,
  })
}

/** 删除一条记录 */
export async function removeSavedPage(id: number): Promise<void> {
  await db.pages.delete(id)
}

/** 清空所有记录 */
export async function clearAllSaved(): Promise<void> {
  await db.pages.clear()
  await db.tutorials.clear()
  await db.topics.clear()
}

/** 获取所有记录（按保存时间倒序） */
export async function getAllSaved(): Promise<SavedPage[]> {
  return db.pages.orderBy('savedAt').reverse().toArray()
}

/** 检查该页是否已保存 */
export async function isPageSaved(
  concept: string,
  pageIndex: number,
): Promise<boolean> {
  const count = await db.pages
    .where({ concept, pageIndex })
    .count()
  return count > 0
}

// ====== 从 db.ts 统一导出 ======
export {
  getOrCreateTopic,
  saveFullTutorial,
  getRootTopics,
  getChildTopics,
  getAllTopics,
  createFolder,
  createAutoFolder,
  moveTopic,
  renameTopic,
  deleteTopic,
  getTopicTutorials,
  getUncategorizedTutorials,
  getTutorialPages,
  moveTutorial,
  deleteTutorial,
  markClassified,
  getUncategorizedCount,
} from './db'
