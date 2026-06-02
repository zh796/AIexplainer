/**
 * AI Explainer — 数据库 v2
 *
 * Schema:
 *   topics     — 主题/文件夹树形结构
 *   tutorials  — 完整教程会话
 *   pages      — 教程单页
 *
 * 从 v1 (ai-explainer-saves / savedPages) 自动迁移。
 */
import Dexie from 'dexie'
import type { Topic, SavedTutorial, SavedPage, PageType } from '../types'

class AppDatabase extends Dexie {
  topics!: Dexie.Table<Topic, number>
  tutorials!: Dexie.Table<SavedTutorial, number>
  pages!: Dexie.Table<SavedPage, number>

  constructor() {
    super('ai-explainer-v2')

    this.version(1).stores({
      topics: '++id, name, parentId, isFolder, isAuto, createdAt',
      tutorials: '++id, topicId, topicName, savedAt, status',
      pages: '++id, tutorialId, concept, pageIndex, savedAt',
    })

    // v2 迁移: 从旧 DB 导入 savedPages
    this.version(2).stores({}).upgrade(async () => {
      await migrateFromV1(this)
    })
  }
}

const db = new AppDatabase()

// ====== 迁移逻辑 ======

async function migrateFromV1(db: AppDatabase): Promise<void> {
  try {
    // 打开旧数据库
    const oldDB = new Dexie('ai-explainer-saves')
    oldDB.version(1).stores({ savedPages: '++id, concept, savedAt' })

    // 检查旧数据库是否存在
    const exists = await Dexie.exists('ai-explainer-saves')
    if (!exists) return

    await oldDB.open()
    const oldPages = await oldDB.table('savedPages').toArray() as SavedPage[]

    if (oldPages.length === 0) {
      oldDB.close()
      return
    }

    // 按 concept 分组
    const groups = new Map<string, SavedPage[]>()
    for (const p of oldPages) {
      const key = p.concept || '未分类'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    }

    const now = Date.now()

    for (const [concept, pages] of groups) {
      // 创建 topic
      const topicId = await db.topics.add({
        name: concept,
        aliases: [concept],
        parentId: 0,
        isFolder: false,
        isAuto: false,
        createdAt: now,
        updatedAt: now,
      })

      // 创建 tutorial（多页合并为一份）
      const tutorialId = await db.tutorials.add({
        topicId,
        topicName: concept,
        originalQuery: concept,
        pageCount: pages.length,
        savedAt: now,
        status: 'classified',
      })

      // 迁移页面
      for (const p of pages) {
        await db.pages.add({
          tutorialId,
          concept,
          summary: p.summary,
          pageType: p.pageType,
          content: p.content,
          savedAt: p.savedAt || now,
          pageIndex: p.pageIndex,
        })
      }
    }

    console.log(`[DB v2] 迁移完成: ${oldPages.length} 条旧记录 → ${groups.size} 个主题`)
    oldDB.close()
  } catch (err) {
    console.warn('[DB v2] 迁移失败（可忽略，新数据不受影响）:', err)
  }
}

// ====== Topic CRUD ======

/** 获取或创建主题（按归一化名匹配） */
export async function getOrCreateTopic(
  normalizedName: string,
  originalQuery: string,
  parentId = 0,
): Promise<number> {
  // 按 name + parentId 联合匹配（同一文件夹下不能重名）
  const candidates = await db.topics
    .where('name')
    .equals(normalizedName)
    .toArray()
  const existing = candidates.find(t => t.parentId === parentId)

  if (existing && existing.id != null) {
    // 追加别名
    const aliases = existing.aliases || []
    if (!aliases.includes(originalQuery)) {
      aliases.push(originalQuery)
      await db.topics.update(existing.id, {
        aliases,
        updatedAt: Date.now(),
      })
    }
    return existing.id
  }

  // 新建
  return db.topics.add({
    name: normalizedName,
    aliases: [originalQuery],
    parentId,
    isFolder: false,
    isAuto: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
}

/** 获取所有根级主题（parentId = 0） */
export async function getRootTopics(): Promise<Topic[]> {
  return db.topics.where('parentId').equals(0).toArray()
}

/** 获取某文件夹下的子主题 */
export async function getChildTopics(parentId: number): Promise<Topic[]> {
  return db.topics.where('parentId').equals(parentId).toArray()
}

/** 递归获取所有主题（树形结构需要） */
export async function getAllTopics(): Promise<Topic[]> {
  const all: Topic[] = []
  const roots = await db.topics.where('parentId').equals(0).toArray()
  all.push(...roots)
  
  for (const root of roots) {
    if (root.isFolder && root.id != null) {
      await collectChildren(root.id, all)
    }
  }
  return all
}

async function collectChildren(parentId: number, result: Topic[]): Promise<void> {
  const children = await db.topics.where('parentId').equals(parentId).toArray()
  result.push(...children)
  for (const child of children) {
    if (child.isFolder && child.id != null) {
      await collectChildren(child.id, result)
    }
  }
}

/** 创建用户自定义文件夹 */
export async function createFolder(
  name: string,
  parentId = 0,
): Promise<number> {
  return db.topics.add({
    name,
    aliases: [],
    parentId,
    isFolder: true,
    isAuto: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
}

/** 智能分类创建文件夹 */
export async function createAutoFolder(
  name: string,
  parentId = 0,
): Promise<number> {
  return db.topics.add({
    name,
    aliases: [],
    parentId,
    isFolder: true,
    isAuto: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
}

/** 移动主题到新父节点 */
export async function moveTopic(topicId: number, parentId: number): Promise<void> {
  await db.topics.update(topicId, { parentId, updatedAt: Date.now() })
}

/** 重命名主题 */
export async function renameTopic(topicId: number, newName: string): Promise<void> {
  await db.topics.update(topicId, { name: newName, updatedAt: Date.now() })
  // 同步更新关联的 tutorials.topicName
  await db.tutorials.where('topicId').equals(topicId).modify({ topicName: newName })
}

/** 删除主题及其下所有教程和页面 */
export async function deleteTopic(topicId: number): Promise<void> {
  const tutorials = await db.tutorials.where('topicId').equals(topicId).toArray()
  for (const t of tutorials) {
    if (t.id != null) {
      await db.pages.where('tutorialId').equals(t.id).delete()
    }
  }
  await db.tutorials.where('topicId').equals(topicId).delete()
  await db.topics.delete(topicId)
}

// ====== Tutorial CRUD ======

/** 保存一份完整教程 */
export async function saveFullTutorial(
  normalizedTopic: string,
  originalQuery: string,
  pages: { summary: string; pageType: string; content: string; explanation?: string; language?: string; desc?: string; options?: string[]; answer?: string }[],
): Promise<{ topicId: number; tutorialId: number }> {
  console.log('[DB] saveFullTutorial 开始:', { normalizedTopic, pageCount: pages.length })
  
  const topicId = await getOrCreateTopic(normalizedTopic, originalQuery)
  console.log('[DB] topicId:', topicId)

  const tutorialId = await db.tutorials.add({
    topicId,
    topicName: normalizedTopic,
    originalQuery,
    pageCount: pages.length,
    savedAt: Date.now(),
    status: 'uncategorized',
  })
  console.log('[DB] tutorialId:', tutorialId)

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]
    console.log(`[DB] 写入第${i+1}/${pages.length}页:`, p.pageType, p.summary)
    await db.pages.add({
      tutorialId,
      concept: normalizedTopic,
      summary: p.explanation || p.summary || `第${i + 1}页`,
      pageType: p.pageType as PageType,
      content: p.content,
      options: p.options,
      answer: p.answer,
      savedAt: Date.now(),
      pageIndex: i,
    })
  }
  console.log('[DB] saveFullTutorial 完成')

  return { topicId, tutorialId }
}

/** 获取某主题下的所有教程 */
export async function getTopicTutorials(topicId: number): Promise<SavedTutorial[]> {
  return db.tutorials
    .where('topicId')
    .equals(topicId)
    .reverse()
    .sortBy('savedAt')
}

/** 获取某文件夹下所有子主题的教程（含递归子文件夹） */
export async function getFolderTutorials(folderId: number): Promise<SavedTutorial[]> {
  const allTopicIds: number[] = [folderId]
  const queue = [folderId]
  while (queue.length > 0) {
    const pid = queue.shift()!
    const children = await db.topics.where('parentId').equals(pid).toArray()
    for (const child of children) {
      if (child.id != null) {
        allTopicIds.push(child.id)
        if (child.isFolder) queue.push(child.id)
      }
    }
  }
  const allTutorials: SavedTutorial[] = []
  for (const tid of allTopicIds) {
    const tuts = await db.tutorials.where('topicId').equals(tid).toArray()
    allTutorials.push(...tuts)
  }
  return allTutorials.sort((a, b) => b.savedAt - a.savedAt)
}

/** 获取待分类的教程 */
export async function getUncategorizedTutorials(): Promise<SavedTutorial[]> {
  return db.tutorials
    .where('status')
    .equals('uncategorized')
    .reverse()
    .sortBy('savedAt')
}

/** 获取某教程的所有页面 */
export async function getTutorialPages(tutorialId: number): Promise<SavedPage[]> {
  return db.pages
    .where('tutorialId')
    .equals(tutorialId)
    .sortBy('pageIndex')
}

/** 移动教程到另一主题 */
export async function moveTutorial(tutorialId: number, newTopicId: number): Promise<void> {
  await db.tutorials.update(tutorialId, { topicId: newTopicId, status: 'classified' })
}

/** 删除教程及其页面 */
export async function deleteTutorial(tutorialId: number): Promise<void> {
  await db.pages.where('tutorialId').equals(tutorialId).delete()
  await db.tutorials.delete(tutorialId)
}

/** 将教程标记为已分类 */
export async function markClassified(tutorialId: number): Promise<void> {
  await db.tutorials.update(tutorialId, { status: 'classified' })
}

// ====== 统计 ======

/** 获取待分类数量 */
export async function getUncategorizedCount(): Promise<number> {
  return db.tutorials.where('status').equals('uncategorized').count()
}

export { db }
