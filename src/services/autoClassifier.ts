/**
 * 智能分类器
 *
 * 调用 DeepSeek API 分析待分类教程，返回分组建议。
 * 本地执行分组写入，AI 只提供建议不做实际写入。
 */
import type { SavedTutorial, ApiConfig } from '../types'
import { createAutoFolder, moveTutorial, getOrCreateTopic } from './db'

/** AI 返回的分组建议 */
interface ClassifySuggestion {
  groupName: string
  tutorialIds: number[]
}

/** 清洗 AI 返回的分组名，防止注入和超长内容 */
function sanitizeGroupName(name: string): string {
  return name
    .replace(/[<>"'&]/g, '')
    .trim()
    .slice(0, 50)
}

/** 分类结果统计 */
export interface ClassifyResult {
  groupsCreated: number
  tutorialsMoved: number
}

/**
 * 智能分类
 *
 * @param config API 配置
 * @param tutorials 待分类的教程列表
 * @param existingTopics 已有的主题名列表（供 AI 参考，避免重复创建）
 */
export async function autoClassify(
  config: ApiConfig,
  tutorials: SavedTutorial[],
  existingTopics: string[],
): Promise<ClassifyResult> {
  if (tutorials.length === 0) return { groupsCreated: 0, tutorialsMoved: 0 }

  // 准备 AI 输入
  const tutorialList = tutorials
    .filter(t => t.id != null)
    .map(t => `[${t.id}] ${t.originalQuery} (${t.pageCount}页)`)
    .join('\n')

  const topicsHint = existingTopics.length > 0
    ? `\n已有分类: ${existingTopics.join('、')}`
    : ''

  const prompt = `将以下教程按主题分组。${topicsHint}

教程列表:
${tutorialList}

请返回 JSON 数组，每个元素包含 groupName（简短的分组名）和 tutorialIds（该分组的教程 ID 数组）。
只输出 JSON，不要其他文字。

示例:
[{"groupName":"编程基础","tutorialIds":[1,3]},{"groupName":"数据结构","tutorialIds":[2]}]`

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      throw new Error(`API 错误: ${response.status}`)
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content || '[]'

    // 解析 AI 返回的 JSON
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('未找到有效 JSON')

    const suggestions: ClassifySuggestion[] = JSON.parse(jsonMatch[0])

    // 执行分组写入
    const result: ClassifyResult = { groupsCreated: 0, tutorialsMoved: 0 }

    for (const sug of suggestions) {
      if (!sug.tutorialIds || sug.tutorialIds.length === 0) continue

      // 创建智能分类文件夹
      const folderId = await createAutoFolder(sanitizeGroupName(sug.groupName))

      for (const tutorialId of sug.tutorialIds) {
        const tutorial = tutorials.find(t => t.id === tutorialId)
        if (!tutorial) continue

        // 在文件夹下创建 topic
        const topicId = await getOrCreateTopic(
          tutorial.topicName,
          tutorial.originalQuery,
          folderId,
        )

        await moveTutorial(tutorialId, topicId)
        result.tutorialsMoved++
      }

      result.groupsCreated++
    }

    return result
  } catch (err) {
    console.warn('[AutoClassifier] 智能分类失败:', err)
    throw err
  }
}
