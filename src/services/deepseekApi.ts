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
      throw new Error(`API 请求失败 (${response.status}): ${errBody}`)
    }
    if (!response.body) throw new Error("浏览器不支持流式读取")

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
    callbacks.onError(err instanceof Error ? err.message : "未知错误")
  }
}