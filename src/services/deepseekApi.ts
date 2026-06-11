import { StreamParser } from "./streamParser"
import type { TutorialPage, ApiConfig, ApiProvider } from "../types"
import systemPrompt from "../prompts/systemPrompt"

export interface StreamCallbacks {
  onPage: (page: TutorialPage) => void
  onError: (error: string) => void
  onDone: () => void
}

const PROVIDER_DEFAULTS: Record<ApiProvider, { url: string; model: string }> = {
  deepseek: { url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
  openai: { url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
  custom: { url: "", model: "" },
}

export async function streamTutorial(
  config: ApiConfig,
  concept: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  const parser = new StreamParser(callbacks.onPage)
  const provider = config.provider || "deepseek"
  const defaults = PROVIDER_DEFAULTS[provider]
  const baseUrl = config.baseUrl || defaults.url
  const model = config.model || defaults.model

  if (!baseUrl) {
    callbacks.onError("未配置 API 地址，请在设置中填写自定义 API 端点")
    return
  }

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: concept },
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text().catch(() => "")
      const status = response.status
      if (status === 401) {
        throw new Error("API Key 验证失败：当前 Key 无法通过服务商验证，请检查后重试。")
      } else if (status === 429) {
        throw new Error("请求频率过高或额度不足：当前模型暂时无法继续生成，稍后重试或切换模型可能恢复。")
      } else if (status === 403) {
        throw new Error("API 访问被拒绝：当前 Key 没有权限访问该模型，请检查 Key 配置。")
      } else if (status >= 500) {
        throw new Error("AI 服务暂时不可用：服务器出现异常，请稍后重试。")
      } else {
        throw new Error(`API 请求失败 (${status}): ${errBody}`)
      }
    }
    if (!response.body) throw new Error("当前浏览器不支持流式读取，请尝试使用现代浏览器（Chrome / Edge / Firefox）。")

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) { parser.flush(); callbacks.onDone(); break }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() || ""
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith("data:")) continue
        const dataStr = trimmed.slice(5).trim()
        if (dataStr === "[DONE]") continue
        try {
          const data = JSON.parse(dataStr)
          const content = data?.choices?.[0]?.delta?.content || ""
          if (content) parser.feed(content)
        } catch { /* skip malformed SSE lines */ }
      }
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : "未知错误"
    let message = raw
    if (raw === "Failed to fetch" || raw.includes("NetworkError") || raw.includes("Network Error")) {
      message = "网络连接异常：无法到达 AI 服务，请检查网络或代理配置后重试。"
    }
    callbacks.onError(message)
  }
}