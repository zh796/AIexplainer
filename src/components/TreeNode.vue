<script setup lang="ts">
/**
 * 树节点（递归组件）
 * 自己根据 topics 数组解析子节点 → 支持无限层级
 * 展开状态由父组件 expandedIds Set 管理 → 多层级互不干扰
 */
import { computed } from 'vue'
import type { Topic } from '../types'

const props = defineProps<{
  topic: Topic
  topics: Topic[]
  selectedId: number | null
  expandedIds: Set<number>
  depth: number
}>()

const emit = defineEmits<{
  (e: 'select', id: number): void
  (e: 'toggle-expand', id: number): void
  (e: 'contextmenu', event: MouseEvent, topic: Topic): void
}>()

/** 从 topics 数组中解析自己的子节点 — 只显示文件夹 */
const children = computed(() =>
  props.topic.id != null
    ? props.topics.filter(t => t.parentId === props.topic.id && t.isFolder)
    : [],
)

/** 当前节点是否展开 */
const isExpanded = computed(() =>
  props.topic.id != null && props.expandedIds.has(props.topic.id),
)

function handleClick(topic: Topic): void {
  if (topic.isFolder && topic.id != null) {
    emit('toggle-expand', topic.id)
  }
  if (topic.id != null) {
    emit('select', topic.id)
  }
}
</script>

<template>
  <div>
    <div
      class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150
             hover:bg-bg-elevated"
      :class="{
        'bg-primary/10 text-primary font-medium': topic.id === selectedId,
        'text-fg-muted': topic.id !== selectedId,
      }"
      :style="{ paddingLeft: `${12 + depth * 16}px` }"
      @click="handleClick(topic)"
      @contextmenu.prevent="emit('contextmenu', $event, topic)"
      role="treeitem"
      :aria-expanded="topic.isFolder ? isExpanded : undefined"
      :aria-selected="topic.id === selectedId"
    >
      <!-- 展开/折叠箭头 -->
      <span
        class="text-[10px] shrink-0 transition-transform duration-200"
        :class="{ 'rotate-90': isExpanded }"
      >▶</span>
      <span class="text-sm truncate flex-1">{{ topic.name }}</span>
      <span
        v-if="topic.isAuto"
        class="text-[10px] px-1 py-0.5 rounded bg-accent/15 text-accent"
      >AI</span>
    </div>

    <!-- 递归子节点 -->
    <template v-if="topic.isFolder && isExpanded">
      <TreeNode
        v-for="child in children"
        :key="child.id"
        :topic="child"
        :topics="topics"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :depth="depth + 1"
        @select="id => emit('select', id)"
        @toggle-expand="id => emit('toggle-expand', id)"
        @contextmenu="(e, t) => emit('contextmenu', e, t)"
      />
    </template>
  </div>
</template>
