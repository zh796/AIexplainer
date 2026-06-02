<script setup lang="ts">
/**
 * 文件浏览器 — 主容器
 * 左侧：目录树 + 右侧：教程列表/页面阅读
 * 响应式：移动端切换标签（目录/内容）
 */
import { ref, onMounted } from 'vue'
import type { Topic, SavedTutorial } from '../types'
import {
  getAllTopics,
  getUncategorizedTutorials, getUncategorizedCount,
  getTopicTutorials, getFolderTutorials, deleteTutorial, deleteTopic,
  createFolder, moveTutorial, markClassified,
} from '../services/db'
import TopicTree from './TopicTree.vue'
import TutorialList from './TutorialList.vue'
import PageReader from './PageReader.vue'
import ContextMenu from './ContextMenu.vue'
import ClassifyBar from './ClassifyBar.vue'
import { autoClassify } from '../services/autoClassifier'
import { useToast } from '../composables/useToast'
import type { ApiConfig } from '../types'

const toast = useToast()

const emit = defineEmits<{
  (e: 'close'): void
}>()

// ====== 状态 ======
const view = ref<'browser' | 'reader'>('browser')
// 移动端标签：'tree' | 'content'
const mobileTab = ref<'tree' | 'content'>('tree')
// 多层级展开状态（Set 管理，各层级互不干扰）
const expandedIds = ref<Set<number>>(new Set())
const topics = ref<Topic[]>([])
const tutorials = ref<SavedTutorial[]>([])
const selectedTopicId = ref<number | null>(null)
const selectedTopicName = ref('')
const uncategorizedCount = ref(0)
const isLoading = ref(false)
const readerTutorialId = ref<number>(0)
const readerTopicName = ref('')
const isReaderUncategorized = ref(false)

const ctxVisible = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxTopic = ref<Topic | null>(null)
const showCreateModal = ref(false)
const newFolderName = ref('')

// ====== 智能分类 ======
async function handleAutoClassify(): Promise<void> {
  const apiKey = localStorage.getItem('ai-explainer-api-key')
  if (!apiKey) {
    toast.warning('请先配置 API Key')
    
    return
  }

  toast.info('正在智能分类...')
  try {
    const config: ApiConfig = { apiKey }
    const uncategorized = await getUncategorizedTutorials()
    const existingNames = topics.value.filter(t => !t.isFolder).map(t => t.name)
    const result = await autoClassify(config, uncategorized, existingNames)
    toast.success(`分类完成：${result.groupsCreated} 个分组，${result.tutorialsMoved} 个教程已归类`)
    await refreshTopics()
    if (selectedTopicId.value === -1) await selectUncategorized()
  } catch (err) {
    console.error('[智能分类] 失败:', err)
    const msg = err instanceof Error ? err.message : String(err)
    toast.error(`智能分类失败：${msg.slice(0, 30)}`)
  }
  
}

// ====== 创建文件夹 ======
function openCreateModal(): void {
  showCreateModal.value = true
  newFolderName.value = ''
}

function closeCreateModal(): void {
  showCreateModal.value = false
}

async function confirmCreateFolder(): Promise<void> {
  const name = newFolderName.value.trim()
  if (!name) return

  const parentId = (selectedTopicId.value != null && selectedTopicId.value !== -1)
    ? selectedTopicId.value : 0

  const siblings = topics.value.filter(t => t.parentId === parentId && t.isFolder)
  if (siblings.some(s => s.name === name)) {
      toast.warning(`文件夹「${name}」已存在`)
    
    return
  }

  try {
    await createFolder(name, parentId)
    closeCreateModal()
    await refreshTopics()
    toast.success(`文件夹「${name}」已创建`)
  } catch (err) {
    console.error('[创建文件夹] 失败:', err)
    toast.error('创建文件夹失败，请重试')
  }
  
}

// ====== 数据加载 ======
async function refreshTopics(): Promise<void> {
  topics.value = await getAllTopics()
  uncategorizedCount.value = await getUncategorizedCount()
}

async function selectTopic(id: number | null): Promise<void> {
  view.value = 'browser'
  selectedTopicId.value = id
  mobileTab.value = 'content'

  if (id != null) {
    const topic = topics.value.find(t => t.id === id)
    selectedTopicName.value = topic?.name || ''

    isLoading.value = true
    tutorials.value = topic?.isFolder
      ? await getFolderTutorials(id)
      : await getTopicTutorials(id)
    isLoading.value = false
  }
}

/** 展开文件夹，同时关闭同级其他文件夹（手风琴） */
function toggleExpand(id: number): void {
  const next = new Set(expandedIds.value)
  if (next.has(id)) {
    // 关闭
    next.delete(id)
  } else {
    // 打开前关闭所有同级文件夹
    const node = topics.value.find(t => t.id === id)
    if (node) {
      for (const t of topics.value) {
        if (t.parentId === node.parentId && t.isFolder && t.id != null && next.has(t.id)) {
          next.delete(t.id)
        }
      }
    }
    next.add(id)
  }
  expandedIds.value = next
}

async function selectUncategorized(): Promise<void> {
  view.value = 'browser'
  selectedTopicId.value = -1
  selectedTopicName.value = '待分类'
  mobileTab.value = 'content'
  isLoading.value = true

  // 关闭所有一级文件夹 — 让「待分类」参与手风琴
  const next = new Set(expandedIds.value)
  for (const t of topics.value) {
    if (t.parentId === 0 && t.isFolder && t.id != null) {
      next.delete(t.id)
    }
  }
  expandedIds.value = next

  tutorials.value = await getUncategorizedTutorials()
  isLoading.value = false
}

// ====== 操作 ======
async function handleDeleteTutorial(tutorialId: number): Promise<void> {
  await deleteTutorial(tutorialId)
  if (selectedTopicId.value === -1) await selectUncategorized()
  else if (selectedTopicId.value != null) await selectTopic(selectedTopicId.value)
}

function openReader(tutorialId: number): void {
  readerTutorialId.value = tutorialId
  readerTopicName.value = selectedTopicName.value
  isReaderUncategorized.value = selectedTopicId.value === -1
  view.value = 'reader'
}

async function closeReader(): Promise<void> {
  view.value = 'browser'
  if (selectedTopicId.value === -1) await selectUncategorized()
  else if (selectedTopicId.value != null) await selectTopic(selectedTopicId.value)
}

async function handleReaderMoved(): Promise<void> {
  await refreshTopics()
  if (selectedTopicId.value === -1) await selectUncategorized()
  else if (selectedTopicId.value != null) await selectTopic(selectedTopicId.value)
}

async function handleDeleteSelected(): Promise<void> {
  const id = selectedTopicId.value
  if (id == null || id === -1) return
  const topic = topics.value.find(t => t.id === id)
  if (!topic) return
  const label = topic.isFolder ? '文件夹' : '主题'
  if (!confirm(`确定要删除${label}「${topic.name}」及其所有内容？此操作不可撤销。`)) return
  await deleteTopic(id)
  selectedTopicId.value = null; selectedTopicName.value = ''; tutorials.value = []
  toast.info(`已删除${label}「${topic.name}」`)
  
  await refreshTopics()
}

async function handleDeleteCurrentFolder(): Promise<void> {
  const id = selectedTopicId.value
  if (id == null || id === -1) return
  const topic = topics.value.find(t => t.id === id)
  if (!topic?.isFolder) return
  if (!confirm(`确定要删除文件夹「${topic.name}」及其所有内容？此操作不可撤销。`)) return
  await deleteTopic(id)
  selectedTopicId.value = null; selectedTopicName.value = ''; tutorials.value = []
  await refreshTopics()
}

// ====== 右键菜单 ======
function onContextMenu(e: MouseEvent, topic: Topic): void {
  ctxTopic.value = topic; ctxX.value = e.clientX; ctxY.value = e.clientY; ctxVisible.value = true
}

function closeContextMenu(): void { ctxVisible.value = false }

async function handleMoveToFolder(folderId: number): Promise<void> {
  closeContextMenu()
  if (selectedTopicId.value != null && selectedTopicId.value !== -1) {
    const tuts = await getTopicTutorials(selectedTopicId.value)
    for (const t of tuts) { if (t.id != null) await moveTutorial(t.id, folderId) }
  }
  await refreshTopics()
  if (selectedTopicId.value != null) await selectTopic(selectedTopicId.value)
}

async function handleMarkClassified(): Promise<void> {
  if (selectedTopicId.value === -1) {
    for (const t of tutorials.value) { if (t.id != null) await markClassified(t.id) }
    await selectUncategorized()
  }
  closeContextMenu()
}

function handleDeleteTopic(): void {
  if (ctxTopic.value?.id == null) return
  if (!confirm(`确定要删除"${ctxTopic.value.name}"及其所有内容？此操作不可撤销。`)) return
  deleteTopic(ctxTopic.value.id).then(() => refreshTopics())
  closeContextMenu()
}

function getFolders(): Topic[] {
  return topics.value.filter(t => t.isFolder)
}

onMounted(refreshTopics)
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
    class="fixed top-0 right-0 h-full w-full max-w-3xl z-50 flex animate-slide-in-right
           bg-bg-card shadow-lg"
    role="dialog"
    aria-label="文件管理器"
  >
    <!-- 移动端标签切换 -->
    <div class="md:hidden flex border-b border-border absolute top-0 left-0 right-0 z-10 bg-bg-card">
      <button
        @click="mobileTab = 'tree'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'tree' ? 'text-primary border-b-2 border-primary' : 'text-fg-muted'"
      >目录</button>
      <button
        @click="mobileTab = 'content'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-fg-muted'"
      >内容</button>
    </div>

    <!-- 左侧目录树 -->
    <div
      class="w-64 shrink-0 overflow-y-auto py-4 flex flex-col border-r border-border
             md:block"
      :class="mobileTab === 'tree' ? 'block mt-10' : 'hidden mt-10 md:mt-0'"
    >
      <div class="px-3 mb-3 flex items-center justify-between">
        <h3 class="text-sm font-bold text-fg">📂 文件管理</h3>
        <button
          @click="emit('close')"
          class="text-sm cursor-pointer text-fg-muted hover:text-fg transition-colors"
          aria-label="关闭"
        >
          ✕
        </button>
      </div>

      <div class="px-3 mb-3 flex gap-1.5">
        <button @click="openCreateModal" class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium
                transition-all cursor-pointer bg-primary/10 text-primary hover:bg-primary/20">
          + 创建
        </button>
        <button
          @click="handleDeleteSelected"
          :disabled="selectedTopicId == null || selectedTopicId === -1"
          class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer
                 bg-error/10 text-error hover:bg-error/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          - 删除
        </button>
      </div>

      <TopicTree
        :topics="topics"
        :selected-id="selectedTopicId"
        :uncategorized-count="uncategorizedCount"
        :expanded-ids="expandedIds"
        @select="selectTopic"
        @select-uncategorized="selectUncategorized"
        @toggle-expand="toggleExpand"
        @contextmenu="onContextMenu"
      />
    </div>

    <!-- 右侧内容 -->
    <div
      class="flex-1 flex flex-col overflow-hidden"
      :class="mobileTab === 'content' ? 'block mt-10 md:mt-0' : 'hidden md:block'"
    >
      <template v-if="view === 'browser'">
        <ClassifyBar
          v-if="selectedTopicId === -1"
          :uncategorized-count="uncategorizedCount"
          @auto-classify="handleAutoClassify"
        />
        <TutorialList
          :tutorials="tutorials"
          :topic-name="selectedTopicName"
          :is-loading="isLoading"
          :is-folder="selectedTopicId != null && selectedTopicId !== -1
            && topics.find(t => t.id === selectedTopicId)?.isFolder === true"
          @view="openReader"
          @delete="handleDeleteTutorial"
          @delete-folder="handleDeleteCurrentFolder"
        />
      </template>

      <template v-else>
        <PageReader
          :tutorial-id="readerTutorialId"
          :topic-name="readerTopicName"
          :is-uncategorized="isReaderUncategorized"
          @close="closeReader"
          @moved="handleReaderMoved"
        />
      </template>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      v-if="ctxVisible"
      :x="ctxX" :y="ctxY"
      :folders="getFolders()"
      @close="closeContextMenu"
      @create-folder="openCreateModal"
      @move-to-folder="handleMoveToFolder"
      @mark-classified="handleMarkClassified"
      @delete-topic="handleDeleteTopic"
    />

    <!-- 创建文件夹弹窗 -->
    <Teleport to="body">
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
        @click.self="closeCreateModal"
      >
        <div
          class="w-80 p-6 rounded-xl animate-fade-in-scale bg-bg-elevated shadow-md border border-border"
          @click.stop
        >
          <h4 class="text-sm font-bold mb-1 text-fg">📁 创建文件夹</h4>
          <p
            v-if="selectedTopicId != null && selectedTopicId !== -1"
            class="text-xs mb-4 text-fg-muted"
          >
            在「{{ topics.find(t => t.id === selectedTopicId)?.name }}」下创建
          </p>
          <p v-else class="text-xs mb-4 text-fg-muted">在根目录下创建</p>
          <input
            v-model="newFolderName"
            type="text"
            placeholder="输入文件夹名称..."
            class="w-full px-4 py-2.5 rounded-lg text-sm border mb-4 transition-all duration-200
                   bg-bg border-border text-fg placeholder:text-fg-subtle
                   focus:border-primary focus:ring-2 focus:ring-primary/20"
            @keydown.enter="confirmCreateFolder"
            autofocus
          />
          <div class="flex gap-2 justify-end">
            <button @click="closeCreateModal" class="btn-ghost text-sm">取消</button>
            <button
              @click="confirmCreateFolder"
              :disabled="!newFolderName.trim()"
              class="btn-primary text-sm"
            >
              创建
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>
