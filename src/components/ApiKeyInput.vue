<script setup lang="ts">
/**
 * API Key 配置面板 — Modal 版
 * 从全页阻断改为按需弹出的 Modal
 */
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useTutorialStore } from "../stores/tutorialStore"
import type { ApiProvider } from "../types"

const emit = defineEmits<{
  (e: "close"): void
  (e: "saved"): void
}>()

const store = useTutorialStore()
const inputKey = ref("")
const showKey = ref(false)
const isEditing = ref(false)
const selectedProvider = ref<ApiProvider>("deepseek")
const customUrl = ref("")
const customModel = ref("")

const hasKey = computed(() => !!store.state.apiKey)
const maskedKey = computed(() => {
  const key = store.state.apiKey || ""
  if (key.length <= 8) return "••••••••"
  return key.slice(0, 4) + "•••••••••••" + key.slice(-4)
})

const providers: { key: ApiProvider; label: string; desc: string }[] = [
  { key: "deepseek", label: "DeepSeek", desc: "免费注册，性价比高" },
  { key: "openai", label: "OpenAI", desc: "GPT-4o 系列模型" },
  { key: "custom", label: "自定义", desc: "兼容 OpenAI 格式的 API" },
]

function saveKey() {
  const key = inputKey.value.trim()
  if (key) {
    store.setApiKey(key)
    localStorage.setItem("ai-explainer-provider", selectedProvider.value)
    if (selectedProvider.value === "custom") {
      localStorage.setItem("ai-explainer-custom-url", customUrl.value)
      localStorage.setItem("ai-explainer-custom-model", customModel.value || "gpt-3.5-turbo")
    }
    inputKey.value = ""
    isEditing.value = false
    emit("saved")
  }
}

function startEdit() {
  isEditing.value = true
  inputKey.value = store.state.apiKey || ""
  selectedProvider.value = (localStorage.getItem("ai-explainer-provider") as ApiProvider) || "deepseek"
  customUrl.value = localStorage.getItem("ai-explainer-custom-url") || ""
  customModel.value = localStorage.getItem("ai-explainer-custom-model") || ""
}

function cancelEdit() {
  isEditing.value = false
  inputKey.value = ""
}

function clearKey() {
  store.clearApiKey()
  isEditing.value = false
  inputKey.value = ""
}

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) emit("close")
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close")
}

onMounted(() => document.addEventListener("keydown", handleKeydown))
onUnmounted(() => document.removeEventListener("keydown", handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[200] flex items-center justify-center p-6
             bg-black/50 backdrop-blur-sm animate-fade-in-up"
      @click="handleBackdropClick"
    >
      <div
        class="w-full max-w-md p-8 rounded-2xl bg-bg-card border border-border shadow-lg animate-fade-in-scale"
        role="dialog"
        aria-label="API Key 配置"
        @click.stop
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-primary">API Key 配置</h2>
            <p class="text-xs text-fg-muted mt-1">安全保存在本地浏览器</p>
          </div>
          <button
            @click="emit('close')"
            class="w-8 h-8 flex items-center justify-center rounded-lg text-fg-muted hover:text-fg hover:bg-bg-elevated transition-colors cursor-pointer"
            aria-label="关闭"
          >
            &times;
          </button>
        </div>

        <div class="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-5">
          <p class="text-xs text-fg-muted leading-relaxed">
            配置后即可使用 AI 生成教程。支持 DeepSeek、OpenAI 及兼容 API。
          </p>
        </div>

        <div v-if="hasKey &amp;&amp; !isEditing" class="flex flex-col gap-4">
          <div class="p-4 rounded-xl bg-bg-elevated border border-border">
            <p class="text-xs text-fg-subtle mb-1">当前 API Key</p>
            <div class="flex items-center gap-2">
              <code class="flex-1 text-sm font-mono text-fg select-all">{{ maskedKey }}</code>
              <button @click="showKey = !showKey" class="text-sm px-2 py-1 rounded transition-colors text-fg-muted hover:text-fg cursor-pointer shrink-0">{{ showKey ? "🙈" : "👁️" }}</button>
            </div>
            <p v-if="showKey" class="mt-2 text-xs font-mono text-fg break-all bg-bg p-2 rounded">{{ store.state.apiKey }}</p>
          </div>
          <div class="flex gap-3">
            <button @click="startEdit" class="btn-primary flex-1">🔄 更换 API Key</button>
            <button @click="clearKey" class="btn-danger flex-1">🗑 清除 Key</button>
          </div>
        </div>

        <form v-else @submit.prevent="saveKey" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-xs text-fg-subtle">API 供应商</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="p in providers" :key="p.key" type="button"
                @click="selectedProvider = p.key"
                class="p-3 rounded-xl border text-center transition-all cursor-pointer"
                :class="selectedProvider === p.key ? 'border-primary bg-primary/10' : 'border-border bg-bg hover:border-fg-subtle'"
              >
                <div class="text-sm font-semibold" :class="selectedProvider === p.key ? 'text-primary' : 'text-fg'">{{ p.label }}</div>
                <div class="text-[10px] mt-0.5 text-fg-subtle">{{ p.desc }}</div>
              </button>
            </div>
          </div>

          <div v-if="selectedProvider === 'custom'" class="flex flex-col gap-3">
            <input v-model="customUrl" type="text" placeholder="API 端点 URL"
              class="w-full px-4 py-2.5 rounded-lg border text-xs bg-bg border-border text-fg placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input v-model="customModel" type="text" placeholder="模型名称"
              class="w-full px-4 py-2.5 rounded-lg border text-xs bg-bg border-border text-fg placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          <div class="relative">
            <input v-model="inputKey" :type="showKey ? 'text' : 'password'" :placeholder="isEditing ? '输入新的 API Key' : 'sk-...'"
              aria-label="API Key 输入" autofocus
              class="w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200 bg-bg border-border text-fg placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 pr-12" />
            <button type="button" @click="showKey = !showKey" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer text-fg-muted hover:text-fg"
              :aria-label="showKey ? '隐藏' : '显示'">{{ showKey ? "🙈" : "👁️" }}</button>
          </div>

          <div class="flex gap-3">
            <button type="submit" :disabled="!inputKey.trim()" class="btn-primary flex-1">{{ isEditing ? "💾 保存新 Key" : "保存并开始" }}</button>
            <button v-if="isEditing" type="button" @click="cancelEdit" class="btn-ghost flex-1">取消</button>
            <button v-if="!isEditing &amp;&amp; !hasKey" type="button" @click="emit('close')" class="btn-ghost flex-1">稍后设置</button>
          </div>

          <a v-if="selectedProvider === 'deepseek'" href="https://platform.deepseek.com/api_keys" target="_blank" class="text-xs text-center text-fg-subtle hover:text-primary transition-colors">
            去 DeepSeek 获取 Key →
          </a>
          <a v-else-if="selectedProvider === 'openai'" href="https://platform.openai.com/api-keys" target="_blank" class="text-xs text-center text-fg-subtle hover:text-primary transition-colors">
            去 OpenAI 获取 Key →
          </a>
        </form>
      </div>
    </div>
  </Teleport>
</template>
