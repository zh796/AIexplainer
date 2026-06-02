<script setup lang="ts">
/**
 * 目录树组件
 * 递归渲染主题/文件夹树形结构
 * 多层级展开互不干扰（用 Set 管理展开状态）
 * 子节点自己根据 topics 数组解析 children
 */
import { computed } from 'vue'
import type { Topic } from '../types'
import TreeNode from './TreeNode.vue'

const props = defineProps<{
  topics: Topic[]
  selectedId: number | null
  uncategorizedCount: number
  expandedIds: Set<number>
}>()

const emit = defineEmits<{
  (e: 'select', id: number | null): void
  (e: 'select-uncategorized'): void
  (e: 'toggle-expand', id: number): void
  (e: 'contextmenu', event: MouseEvent, topic: Topic): void
}>()

/** 只显示文件夹（用户创建 + AI自动分类），不显示单个教程条目 */
const roots = computed(() =>
  props.topics.filter(t => t.parentId === 0 && t.isFolder),
)
</script>

<template>
  <nav class="select-none" aria-label="目录导航">
    <div
      class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150
             hover:bg-bg-elevated mb-1"
      :class="{
        'bg-primary/10 text-primary font-medium': selectedId === -1,
        'text-fg-muted': selectedId !== -1,
      }"
      @click="emit('select-uncategorized')"
      role="treeitem"
    >
      <span class="text-sm">📥</span>
      <span class="text-sm font-medium flex-1">待分类</span>
      <span
        v-if="uncategorizedCount > 0"
        class="text-xs px-1.5 py-0.5 rounded-full bg-primary text-primary-fg"
      >
        {{ uncategorizedCount }}
      </span>
    </div>

    <div class="my-2 border-t border-border" />

    <TreeNode
      v-for="topic in roots"
      :key="topic.id"
      :topic="topic"
      :topics="topics"
      :selected-id="selectedId"
      :expanded-ids="expandedIds"
      :depth="0"
      @select="id => emit('select', id)"
      @toggle-expand="id => emit('toggle-expand', id)"
      @contextmenu="(e, t) => emit('contextmenu', e, t)"
    />
  </nav>
</template>
