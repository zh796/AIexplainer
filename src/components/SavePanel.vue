<script setup lang="ts">
/**
 * 记录面板 — 已保存内容的树形目录浏览器
 * 从右侧滑入
 */
import { ref, onMounted } from 'vue'
import type { SavedPage } from '../types'
import { getAllSaved, removeSavedPage, clearAllSaved } from '../services/saveStore'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const items = ref<SavedPage[]>([])
const isLoading = ref(true)
const expandedId = ref<number | null>(null)

async function loadItems(): Promise<void> {
  isLoading.value = true
  items.value = await getAllSaved()
  isLoading.value = false
}

async function remove(id: number): Promise<void> {
  await removeSavedPage(id)
  items.value = items.value.filter(it => it.id !== id)
  if (expandedId.value === id) expandedId.value = null
}

async function clearAll(): Promise<void> {
  if (!confirm('确定要清空所有记录吗？此操作不可撤销。')) return
  await clearAllSaved()
  items.value = []
  expandedId.value = null
}

function toggleExpand(id: number): void {
  expandedId.value = expandedId.value === id ? null : id
}

onMounted(loadItems)
</script>

<template>
  <!-- 遮罩 -->
  <div
    class="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300"
    @click="emit('close')"
    role="presentation"
  />

  <!-- 面板 -->
  <aside
    class="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col animate-slide-in-right
           bg-bg-card shadow-lg"
    role="dialog"
    aria-label="文件管理器"
  >
    <!-- 标题栏 -->
    <header class="flex items-center justify-between px-5 py-4 shrink-0 border-b border-border">
      <h2 class="text-lg font-bold text-fg">📂 文件管理</h2>
      <div class="flex items-center gap-2">
        <button
          v-if="items.length > 0"
          @click="clearAll"
          class="btn-danger text-xs"
        >
          清空
        </button>
        <button
          @click="emit('close')"
          class="text-lg cursor-pointer px-2 text-fg-muted hover:text-fg transition-colors"
          aria-label="关闭面板"
        >
          ✕
        </button>
      </div>
    </header>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto px-5 py-4">
      <div v-if="isLoading" class="text-center py-12 text-fg-muted">
        加载中...
      </div>

      <div
        v-else-if="items.length === 0"
        class="text-center py-12 text-fg-muted"
      >
        <p class="text-4xl mb-3">📝</p>
        <p class="text-sm">还没有保存任何内容</p>
        <p class="text-xs mt-1">浏览教程时点击"💾 保存教程"或"📌 记录此页"</p>
      </div>

      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="(item, idx) in items"
          :key="item.id"
          class="rounded-lg p-4 border border-border bg-bg animate-slide-in-right"
          :style="{ animationDelay: `${idx * 60}ms`, animationFillMode: 'backwards' }"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 cursor-pointer" @click="toggleExpand(item.id!)">
              <p class="text-xs px-2 py-0.5 rounded-full w-fit mb-1.5 bg-primary/10 text-primary">
                {{ item.concept }}
              </p>
              <p class="text-sm font-medium leading-snug text-fg">
                {{ item.summary }}
              </p>
              <p class="text-xs mt-1 text-fg-muted">
                第 {{ item.pageIndex + 1 }} 页 · {{ new Date(item.savedAt).toLocaleString('zh-CN') }}
              </p>
            </div>
            <button
              @click="remove(item.id!)"
              class="text-xs shrink-0 cursor-pointer text-fg-muted hover:text-error transition-colors"
              aria-label="删除记录"
            >
              ✕
            </button>
          </div>

          <div
            v-if="expandedId === item.id"
            class="mt-3 pt-3 animate-fade-in-scale border-t border-border"
          >
            <pre
              class="p-3 rounded-lg text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap
                     max-h-60 overflow-y-auto bg-bg-elevated text-fg"
            >{{ item.content }}</pre>
          </div>
        </li>
      </ul>
    </div>
  </aside>
</template>
