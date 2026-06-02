<script setup lang="ts">
/**
 * 右键上下文菜单
 */
import { type Topic } from '../types'

defineProps<{
  x: number
  y: number
  folders: Topic[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create-folder'): void
  (e: 'move-to-folder', folderId: number): void
  (e: 'mark-classified'): void
  (e: 'delete-topic'): void
}>()
</script>

<template>
  <!-- 点击遮罩关闭 -->
  <div class="fixed inset-0 z-[100]" @click="emit('close')" />

  <!-- 菜单 -->
  <div
    class="fixed z-[101] min-w-[160px] py-1 rounded-lg animate-fade-in-scale
           bg-bg-elevated border border-border shadow-lg"
    :style="{ left: x + 'px', top: y + 'px' }"
    role="menu"
  >
    <button
      class="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-bg-card transition-colors
             flex items-center gap-2 text-fg"
      @click="emit('create-folder')"
      role="menuitem"
    >
      <span>📁</span> 创建文件夹
    </button>

    <button
      class="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-bg-card transition-colors
             flex items-center gap-2 text-fg"
      @click="emit('mark-classified')"
      role="menuitem"
    >
      <span>✅</span> 标记为已分类
    </button>

    <!-- 移动到子菜单 -->
    <div v-if="folders.length > 0" class="relative group">
      <button
        class="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-bg-card transition-colors
               flex items-center gap-2 text-fg"
        role="menuitem"
      >
        <span>📂</span> 移动到...
        <span class="ml-auto text-xs text-fg-muted">▶</span>
      </button>

      <div
        class="absolute left-full top-0 ml-1 min-w-[140px] py-1 rounded-lg
               hidden group-hover:block bg-bg-elevated border border-border shadow-lg"
      >
        <button
          v-for="folder in folders"
          :key="folder.id"
          class="w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-bg-card
                 transition-colors truncate text-fg"
          @click="folder.id != null && emit('move-to-folder', folder.id)"
        >
          📁 {{ folder.name }}
        </button>
      </div>
    </div>

    <div class="mx-2 my-1 border-t border-border" />

    <button
      class="w-full text-left px-3 py-2 text-sm cursor-pointer hover:bg-bg-card transition-colors
             flex items-center gap-2 text-error"
      @click="emit('delete-topic')"
      role="menuitem"
    >
      <span>🗑️</span> 删除
    </button>
  </div>
</template>
