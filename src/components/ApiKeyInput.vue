<script setup lang="ts">
/**
 * API Key 输入 — 简洁卡片 + 清晰层次
 */
import { ref } from 'vue'
import { useTutorialStore } from '../stores/tutorialStore'

const store = useTutorialStore()
const inputKey = ref('')
const showKey = ref(false)

function saveKey(): void {
  const key = inputKey.value.trim()
  if (key) store.setApiKey(key)
}
</script>

<template>
  <div class="h-full flex items-center justify-center p-6">
    <div
      class="w-full max-w-md p-8 rounded-2xl bg-bg-card border border-border shadow-sm animate-fade-in-scale"
      role="form"
      aria-label="API Key 配置"
    >
      <h2 class="text-2xl font-bold mb-2 text-primary">
        API Key
      </h2>
      <p class="text-sm mb-6 text-fg-muted">
        输入 DeepSeek API Key，安全保存在本地
      </p>

      <form @submit.prevent="saveKey" class="flex flex-col gap-4">
        <div class="relative">
          <input
            v-model="inputKey"
            :type="showKey ? 'text' : 'password'"
            placeholder="sk-..."
            aria-label="API Key 输入"
            class="w-full px-4 py-3 rounded-lg border text-sm transition-all duration-200
                   bg-bg border-border text-fg placeholder:text-fg-subtle
                   focus:border-primary focus:ring-2 focus:ring-primary/20 pr-12"
          />
          <button
            type="button"
            @click="showKey = !showKey"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer text-fg-muted hover:text-fg"
            :aria-label="showKey ? '隐藏' : '显示'"
          >
            {{ showKey ? '🙈' : '👁️' }}
          </button>
        </div>

        <button
          type="submit"
          :disabled="!inputKey.trim()"
          class="btn-primary w-full"
        >
          保存并开始使用
        </button>

        <a
          href="https://platform.deepseek.com/api_keys"
          target="_blank"
          class="text-xs text-center text-fg-subtle hover:text-primary transition-colors"
        >
          去 DeepSeek 获取 Key →
        </a>
      </form>
    </div>
  </div>
</template>
