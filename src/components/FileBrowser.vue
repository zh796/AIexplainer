<script setup lang="ts">
import { ref, onMounted, computed } from "vue"
import type { Topic, SavedTutorial } from "../types"
import {
  getAllTopics,
  getUncategorizedTutorials, getUncategorizedCount,
  getTopicTutorials, getFolderTutorials, deleteTutorial, deleteTopic,
  createFolder, moveTutorial, markClassified,
} from "../services/db"
import TopicTree from "./TopicTree.vue"
import TutorialList from "./TutorialList.vue"
import PageReader from "./PageReader.vue"
import ContextMenu from "./ContextMenu.vue"
import ClassifyBar from "./ClassifyBar.vue"
import { autoClassify } from "../services/autoClassifier"
import { useToast } from "../composables/useToast"
import type { ApiConfig } from "../types"

const toast = useToast()

const searchQuery = ref("")
const filteredTutorials = computed(() => {
  if (!searchQuery.value.trim()) return tutorials.value
  const q = searchQuery.value.trim().toLowerCase()
  return tutorials.value.filter(t =>
    t.topicName.toLowerCase().includes(q) ||
    t.originalQuery.toLowerCase().includes(q)
  )
})

const emit = defineEmits<{ (e: "close"): void }>()

const view = ref<"browser" | "reader">("browser")
const mobileTab = ref<"tree" | "content">("tree")
const expandedIds = ref<Set<number>>(new Set())
const topics = ref<Topic[]>([])
const tutorials = ref<SavedTutorial[]>([])
const selectedTopicId = ref<number | null>(null)
const selectedTopicName = ref("")
const uncategorizedCount = ref(0)
const isLoading = ref(false)
const readerTutorialId = ref<number>(0)
const readerTopicName = ref("")
const readerTutorialTopicId = ref(0)
const isReaderUncategorized = ref(false)

const ctxVisible = ref(false)
const ctxX = ref(0)
const ctxY = ref(0)
const ctxTopic = ref<Topic | null>(null)
const showCreateModal = ref(false)
const newFolderName = ref("")

async function handleAutoClassify(): Promise<void> {
  const apiKey = localStorage.getItem("ai-explainer-api-key")
  if (!apiKey) { toast.warning("请先配置 API Key"); return }
  toast.info("正在智能分类...")
  try {
    const config: ApiConfig = { apiKey }
    const uncategorized = await getUncategorizedTutorials()
    const existingNames = topics.value.filter(t => !t.isFolder).map(t => t.name)
    const result = await autoClassify(config, uncategorized, existingNames)
    toast.success(`分类完成：${result.groupsCreated} 个分组，${result.tutorialsMoved} 个教程已归类`)
    await refreshTopics()
    if (selectedTopicId.value === -1) await selectUncategorized()
  } catch (err) {
    console.error("[智能分类] 失败:", err)
    toast.error(`智能分类失败：${(err as Error).message.slice(0, 30)}`)
  }
}

function openCreateModal(): void { showCreateModal.value = true; newFolderName.value = "" }
function closeCreateModal(): void { showCreateModal.value = false }

async function confirmCreateFolder(): Promise<void> {
  const name = newFolderName.value.trim()
  if (!name) return
  const parentId = (selectedTopicId.value != null && selectedTopicId.value !== -1) ? selectedTopicId.value : 0
  const siblings = topics.value.filter(t => t.parentId === parentId && t.isFolder)
  if (siblings.some(s => s.name === name)) { toast.warning(`文件夹「${name}」已存在`); return }
  try { await createFolder(name, parentId); closeCreateModal(); await refreshTopics(); toast.success(`文件夹「${name}」已创建`) }
  catch (err) { toast.error("创建文件夹失败") }
}

async function refreshTopics(): Promise<void> {
  topics.value = await getAllTopics()
  uncategorizedCount.value = await getUncategorizedCount()
}

async function selectTopic(id: number | null): Promise<void> {
  view.value = "browser"; selectedTopicId.value = id; mobileTab.value = "content"
  if (id != null) {
    const topic = topics.value.find(t => t.id === id)
    selectedTopicName.value = topic?.name || ""
    isLoading.value = true
    tutorials.value = topic?.isFolder ? await getFolderTutorials(id) : await getTopicTutorials(id)
    isLoading.value = false
  }
}

function toggleExpand(id: number): void {
  const next = new Set(expandedIds.value)
  if (next.has(id)) { next.delete(id) }
  else {
    const node = topics.value.find(t => t.id === id)
    if (node) {
      for (const t of topics.value) {
        if (t.parentId === node.parentId && t.isFolder && t.id != null && next.has(t.id)) next.delete(t.id)
      }
    }
    next.add(id)
  }
  expandedIds.value = next
}

async function selectUncategorized(): Promise<void> {
  view.value = "browser"; selectedTopicId.value = -1; selectedTopicName.value = "未分类"; mobileTab.value = "content"
  isLoading.value = true
  tutorials.value = await getUncategorizedTutorials()
  isLoading.value = false
}

function openReader(tutorialId: number): void {
  view.value = "reader"; readerTutorialId.value = tutorialId; const tut = tutorials.value.find(t => t.id === tutorialId); readerTopicName.value = tut?.topicName || ""; readerTutorialTopicId.value = tut?.topicId || 0; isReaderUncategorized.value = selectedTopicId.value === -1
}

function closeReader(): void { view.value = "browser" }

function handleReaderMoved(): void { refreshTopics(); if (selectedTopicId.value === -1) selectUncategorized() }

async function handleDeleteTutorial(tutorialId: number): Promise<void> {
  try { await deleteTutorial(tutorialId); await refreshTopics(); selectTopic(selectedTopicId.value) }
  catch { toast.error("删除失败") }
}

async function handleDeleteCurrentFolder(): Promise<void> {
  if (selectedTopicId.value == null || selectedTopicId.value === -1) return
  const t = topics.value.find(t => t.id === selectedTopicId.value)
  if (!t?.isFolder) { toast.warning("只能删除空文件夹"); return }
  try {
    const tuts = await getFolderTutorials(selectedTopicId.value)
    if (tuts.length > 0) { toast.warning("请先移动或删除文件夹中的教程"); return }
    await deleteTopic(selectedTopicId.value); await refreshTopics(); selectedTopicId.value = null; tutorials.value = []
  } catch { toast.error("删除文件夹失败") }
}

async function handleDeleteSelected(): Promise<void> {
  if (selectedTopicId.value == null || selectedTopicId.value === -1) return
  try { await handleDeleteCurrentFolder() } catch { toast.error("删除失败") }
}

function onContextMenu(event: MouseEvent, topic: Topic): void {
  event.preventDefault(); ctxVisible.value = true; ctxX.value = event.clientX; ctxY.value = event.clientY; ctxTopic.value = topic
}

function closeContextMenu(): void { ctxVisible.value = false }

function getFolders(): Topic[] { return topics.value.filter(t => t.isFolder) }

async function handleMoveToFolder(folderId: number): Promise<void> {
  if (!ctxTopic.value?.id) return
  try { await moveTutorial(ctxTopic.value.id, folderId); closeContextMenu(); await refreshTopics() }
  catch { toast.error("移动失败") }
}

async function handleMarkClassified(): Promise<void> {
  if (!ctxTopic.value?.id) return
  try { await markClassified(ctxTopic.value.id); closeContextMenu(); await refreshTopics(); if (selectedTopicId.value === -1) await selectUncategorized() }
  catch { toast.error("标记失败") }
}

async function handleDeleteTopic(): Promise<void> {
  if (!ctxTopic.value?.id) return
  try { await deleteTopic(ctxTopic.value.id); closeContextMenu(); await refreshTopics() }
  catch { toast.error("删除失败") }
}

onMounted(refreshTopics)
</script>

<template>
  <aside class="absolute inset-0 z-50 flex flex-col md:flex-row bg-bg shadow-2xl md:shadow-xl">
    <!-- 移动端标签切换 -->
    <div class="md:hidden absolute top-0 left-0 right-0 z-10 flex bg-bg/90 backdrop-blur-sm border-b border-border">
      <button @click="mobileTab = 'tree'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'tree' ? 'text-primary border-b-2 border-primary' : 'text-fg-muted'">目录</button>
      <button @click="mobileTab = 'content'"
        class="flex-1 py-2.5 text-sm font-medium text-center transition-colors"
        :class="mobileTab === 'content' ? 'text-primary border-b-2 border-primary' : 'text-fg-muted'">内容</button>
    </div>

    <!-- 左侧目录树 -->
    <div class="w-64 shrink-0 overflow-y-auto py-4 flex flex-col border-r border-border md:block"
      :class="mobileTab === 'tree' ? 'block mt-10' : 'hidden mt-10 md:mt-0'">
      <div class="px-3 mb-3 flex items-center justify-between">
        <h3 class="text-sm font-bold text-fg">📂 文件管理</h3>
        <button @click="emit('close')" class="text-sm cursor-pointer text-fg-muted hover:text-fg transition-colors" aria-label="关闭">✕</button>
      </div>
      <div class="px-3 mb-3 flex gap-1.5">
        <button @click="openCreateModal" class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer bg-primary/10 text-primary hover:bg-primary/20">+ 创建</button>
        <button @click="handleDeleteSelected" :disabled="selectedTopicId == null || selectedTopicId === -1"
          class="flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer bg-error/10 text-error hover:bg-error/20 disabled:opacity-30 disabled:cursor-not-allowed">- 删除</button>
      </div>
      <TopicTree :topics="topics" :selected-id="selectedTopicId" :uncategorized-count="uncategorizedCount"
        :expanded-ids="expandedIds" @select="selectTopic" @select-uncategorized="selectUncategorized"
        @toggle-expand="toggleExpand" @contextmenu="onContextMenu" />
    </div>

    <!-- 右侧内容 -->
    <div class="flex-1 flex flex-col overflow-hidden" :class="mobileTab === 'content' ? 'block mt-10 md:mt-0' : 'hidden md:block'">
      <template v-if="view === 'browser'">
        <div class="px-3 pt-3">
          <input v-model="searchQuery" type="text" placeholder="搜索教程..."
            class="w-full px-4 py-2 rounded-lg text-xs bg-bg border border-border text-fg placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <ClassifyBar v-if="selectedTopicId === -1" :uncategorized-count="uncategorizedCount" @auto-classify="handleAutoClassify" />
        <TutorialList :tutorials="filteredTutorials" :topic-name="selectedTopicName" :is-loading="isLoading"
          :is-folder="selectedTopicId != null && selectedTopicId !== -1 && topics.find(t => t.id === selectedTopicId)?.isFolder === true"
          @view="openReader" @delete="handleDeleteTutorial" @delete-folder="handleDeleteCurrentFolder" />
      </template>
      <template v-else>
        <PageReader :tutorial-id="readerTutorialId" :topic-name="readerTopicName" :is-uncategorized="isReaderUncategorized" :tutorial-topic-id="readerTutorialTopicId"
          @close="closeReader" @moved="handleReaderMoved" />
      </template>
    </div>

    <ContextMenu v-if="ctxVisible" :x="ctxX" :y="ctxY" :folders="getFolders()" @close="closeContextMenu"
      @create-folder="openCreateModal" @move-to-folder="handleMoveToFolder" @mark-classified="handleMarkClassified"
      @delete-topic="handleDeleteTopic" />

    <Teleport to="body">
      <div v-if="showCreateModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" @click.self="closeCreateModal">
        <div class="w-80 p-6 rounded-xl animate-fade-in-scale bg-bg-elevated shadow-md border border-border" @click.stop>
          <h4 class="text-sm font-bold mb-1 text-fg">📁 创建文件夹</h4>
          <p v-if="selectedTopicId != null && selectedTopicId !== -1" class="text-xs mb-4 text-fg-muted">在「{{ topics.find(t => t.id === selectedTopicId)?.name }}」下创建</p>
          <p v-else class="text-xs mb-4 text-fg-muted">在根目录下创建</p>
          <input v-model="newFolderName" type="text" placeholder="输入文件夹名称..." autofocus
            class="w-full px-4 py-2.5 rounded-lg text-sm border mb-4 transition-all duration-200 bg-bg border-border text-fg placeholder:text-fg-subtle focus:border-primary focus:ring-2 focus:ring-primary/20"
            @keydown.enter="confirmCreateFolder" />
          <div class="flex gap-2 justify-end">
            <button @click="closeCreateModal" class="btn-ghost text-sm">取消</button>
            <button @click="confirmCreateFolder" :disabled="!newFolderName.trim()" class="btn-primary text-sm">创建</button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>