<script setup lang="ts">
/**
 * API Key 配置面板
 * - 未设置时：输入框 + 保存
 * - 已设置时：显示当前 Key（部分隐藏）+ 更换/清除
 */
import { ref, computed } from 'vue'
import { useTutorialStore } from '../stores/tutorialStore'

const store = useTutorialStore()
const inputKey = ref('')
const showKey = ref(false)
const isEditing = ref(false)

const hasKey = computed(() => !!store.state.apiKey)
const maskedKey = computed(() => {
  const key = store.state.apiKey || ''
  if (key.length <= 8) return '••••••••'
  return key.slice(0, 4) + '••••••••••••' + key.slice(-4)
})

function saveKey(): void {
  const key = inputKey.value.trim()
  if (key) {
    store.setApiKey(key)
    inputKey.value = ''
    isEditing.value = false
  }
}

function startEdit(): void {
  isEditing.value = true
  inputKey.value = store.state.apiKey || ''
}

function cancelEdit(): void {
  isEditing.value = false
  inputKey.value = ''
}

function clearKey(): void {
  store.clearApiKey()
  isEditing.value = false
  inputKey.value = ''
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
        API Key 配置
      </h2>
      <p class="text-sm mb-6 text-fg-muted">
        DeepSeek API Key，安全保存在本地浏览器
      </p>

      <!-- 已设置 Key 的展示状态 -->
      <div v-if="hasKey && !isEditing" class="flex flex-col gap-4">
        <div class="p-4 rounded-xl bg-bg-elevated border border-border">
          <p class="text-xs text-fg-subtle mb-1">当前 API Key</p>
          <div class="flex items-center gap-2">
            <code class="flex-1 text-sm font-mono text-fg select-all">{{ maskedKey }}</code>
            <button
              @click="showKey = !showKey"
              class="text-sm px-2 py-1 rounded transition-colors text-fg-muted hover:text-fg cursor-pointer shrink-0"
            >
              {{ showKey ? '🙈' : '👁️' }}
            </button>
          </div>
          <p v-if="showKey" class="mt-2 text-xs font-mono text-fg break-all bg-bg p-2 rounded">
            {{ store.state.apiKey }}
          </p>
        </div>

        <div class="flex gap-3">
          <button @click="startEdit" class="btn-primary flex-1">
            🔄 更换 API Key
          </button>
          <button @click="clearKey" class="btn-danger flex-1">
            🗑 清除 Key
          </button>
        </div>
      </div>

      <!-- 输入/编辑状态 -->
      <form v-else @submit.prevent="saveKey" class="flex flex-col gap-4">
        <div class="relative">
          <input
            v-model="inputKey"
            :type="showKey ? 'text' : 'password'"
            :placeholder="isEditing ? '输入新的 API Key' : 'sk-...'"
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

        <div class="flex gap-3">
          <button
            type="submit"
            :disabled="!inputKey.trim()"
            class="btn-primary flex-1"
          >
            {{ isEditing ? '💾 保存新 Key' : '保存并开始使用' }}
          </button>
          <button
            v-if="isEditing"
            type="button"
            @click="cancelEdit"
            class="btn-ghost flex-1"
          >
            取消
          </button>
        </div>

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
