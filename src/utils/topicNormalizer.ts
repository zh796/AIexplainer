/**
 * 话题归一化器
 *
 * 将用户的自然语言查询（如"什么是闭包？"、"给我讲讲闭包"）
 * 归一化为标准主题名（如"闭包"），以便自动归类合并。
 */

/** 疑问前缀模式（按长度降序匹配） */
const QUESTION_PREFIXES = [
  '什么是', '什么叫做', '什么叫', '怎样', '如何', '怎么',
  '请解释', '解释一下', '讲讲', '说说', '讲一讲', '聊一聊',
  '给我讲', '告诉我', '介绍一下', '介绍', '能否',
  '能不能', '可以', '帮我', '请',
]

/** 疑问后缀 / 语气词 */
const QUESTION_SUFFIXES = [
  '是什么', '什么意思', '如何工作', '怎么用',
  '的原理', '的概念', '的用法', '的作用',
  '？', '?', '！', '!', '。', '.',
  '吧', '呢', '啊', '嘛', '呀',
]

/** 停用后缀（复合匹配后缀） */
const COMPOUND_SUFFIXES = [
  '原理', '入门', '教程', '详解', '指南', '基础',
  '进阶', '实战', '面试', '总结', '概述', '介绍',
  '学习', '理解', '掌握', '精通',
]

/** 特殊映射表（手动维护的别名 → 标准名） */
const ALIAS_MAP: Record<string, string> = {
  'js': 'JavaScript',
  'ts': 'TypeScript',
  'react': 'React',
  'vue': 'Vue.js',
  'ai': '人工智能',
  'ml': '机器学习',
  'dl': '深度学习',
  'nlp': '自然语言处理',
  'cv': '计算机视觉',
  'oop': '面向对象编程',
  'fp': '函数式编程',
  'ds': '数据结构',
  'algo': '算法',
  'db': '数据库',
  'os': '操作系统',
  'rest': 'RESTful API',
  'restful': 'RESTful API',
  'api': 'API设计',
  'http': 'HTTP协议',
  'css': 'CSS',
  'html': 'HTML',
}

/**
 * 归一化话题名
 *
 * @param raw 用户原始输入
 * @returns 归一化后的主题名
 *
 * @example
 *   normalizeTopic("什么是闭包？")         // → "闭包"
 *   normalizeTopic("给我讲讲闭包")         // → "闭包"
 *   normalizeTopic("快速排序原理")         // → "快速排序"
 *   normalizeTopic("RESTful API设计")     // → "RESTful API"
 */
export function normalizeTopic(raw: string): string {
  let result = raw.trim()

  // 0. 全小写匹配别名表
  const lower = result.toLowerCase()
  if (ALIAS_MAP[lower]) {
    return ALIAS_MAP[lower]
  }

  // 1. 去掉疑问前缀
  for (const prefix of QUESTION_PREFIXES) {
    if (result.startsWith(prefix)) {
      result = result.slice(prefix.length)
      break
    }
  }

  // 2. 去掉疑问后缀 / 语气词
  for (const suffix of QUESTION_SUFFIXES) {
    if (result.endsWith(suffix)) {
      result = result.slice(0, -suffix.length)
      break
    }
  }

  // 3. 去掉复合后缀（"原理"、"入门"等）—— 仅在结果够长时
  for (const suffix of COMPOUND_SUFFIXES) {
    if (result.endsWith(suffix) && result.length > suffix.length + 1) {
      result = result.slice(0, -suffix.length)
      break
    }
  }

  // 4. 清理残留标点和空白
  result = result
    .replace(/[？?！!。，,、；;：:（）()【】\[\]《》""''\s]/g, '')
    .trim()

  // 5. 兜底：如果归一化后过短（如只剩一个字），保留原始输入的前 10 字
  if (result.length <= 1) {
    const cleaned = raw.replace(/[？?！!。，,、\s]/g, '').trim()
    return cleaned.slice(0, 15) || raw.slice(0, 10)
  }

  // 6. 长度限制
  return result.slice(0, 20)
}

/**
 * 计算两个主题名的相似度（简单包含匹配）
 * 返回 0-1，≥0.5 视为可合并
 */
export function topicSimilarity(a: string, b: string): number {
  const la = a.toLowerCase()
  const lb = b.toLowerCase()
  if (la === lb) return 1
  if (la.includes(lb) || lb.includes(la)) {
    const shorter = Math.min(la.length, lb.length)
    const longer = Math.max(la.length, lb.length)
    return shorter / longer
  }
  return 0
}
