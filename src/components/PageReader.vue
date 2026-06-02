<script setup lang="ts">
/**
 * 页面阅读视图 — 查看已保存教程的逐页内容
 */
import { ref, onMounted, watch, computed } from 'vue'
import type { SavedPage, Topic } from '../types'
import { getTutorialPages, getRootTopics, getChildTopics, moveTutorial } from '../services/db'

const props = defineProps<{
  tutorialId: number
  topicName: string
  isUncategorized: boolean
  tutorialTopicId?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'moved'): void
}>()

const pages = ref<SavedPage[]>([])
const currentIndex = ref(0)
const isLoading = ref(true)
const currentPage = ref<SavedPage | null>(null)

const showMoveMenu = ref(false)
const moveMsg = ref('')
const moveLevel = ref(0)
const moveParentId = ref(0)
const moveParentName = ref('')
const topFolders = ref<Topic[]>([])
const subFolders = ref<Topic[]>([])

const isQuiz = computed(() => currentPage.value?.pageType === 'quiz')

async function loadPages(): Promise<void> {
  isLoading.value = true
  pages.value = await getTutorialPages(props.tutorialId)
  currentIndex.value = 0
  currentPage.value = pages.value[0] || null
  isLoading.value = false
}

function goTo(index: number): void {
  if (index >= 0 && index < pages.value.length) {
    currentIndex.value = index
    currentPage.value = pages.value[index]
  }
}

async function loadTopFolders(): Promise<void> {
  const roots = await getRootTopics()
  topFolders.value = roots.filter(t => t.isFolder)
}

async function drillInto(folder: Topic): Promise<void> {
  if (folder.id == null) return
  moveLevel.value = 1
  moveParentId.value = folder.id
  moveParentName.value = folder.name
  const children = await getChildTopics(folder.id)
  subFolders.value = children.filter(t => t.isFolder)
}

function backToTop(): void {
  moveLevel.value = 0
  subFolders.value = []
}

function toggleMoveMenu(): void {
  showMoveMenu.value = !showMoveMenu.value
  if (showMoveMenu.value) {
    moveLevel.value = 0
    loadTopFolders()
  }
}

async function handleMove(folderId: number): Promise<void> {
  if (props.tutorialId == null) return
  try {
    await moveTutorial(props.tutorialId, folderId)
    moveMsg.value = '已移动 ✓'
    showMoveMenu.value = false
    setTimeout(() => {
      moveMsg.value = ''
      emit('moved')
    }, 1000)
  } catch {
    moveMsg.value = '移动失败'
  }
}

function getOptionStyle(opt: string, answer: string): Record<string, string> {
  const base: Record<string, string> = {}
  if (opt.startsWith(answer || '')) {
    return { ...base, backgroundColor: 'var(--color-success)', color: '#fff', borderColor: 'var(--color-success)', fontWeight: '600' }
  }
  return { ...base, color: 'var(--color-fg-muted)' }
}

watch(() => props.tutorialId, loadPages)
onMounted(loadPages)
</script>

<template>
  <div class="flex flex-col h-full">
    <header class="flex items-center justify-between px-4 py-3 shrink-0 border-b border-border">
      <button
        @click="emit('close')"
        class="text-sm cursor-pointer text-fg-muted hover:text-fg transition-colors"
        aria-label="返回教程列表"
      >
        ← 返回
      </button>
      <span class="text-sm font-medium truncate mx-2 text-fg">
        {{ topicName }}
      </span>
      <span class="text-xs text-fg-muted">
        {{ currentIndex + 1 }} / {{ pages.length }}
      </span>
    </header>

    <!-- 页面指示器 -->
    <div v-if="pages.length > 1" class="flex items-center justify-center gap-1 py-2 shrink-0">
      <button
        v-for="(_, i) in pages"
        :key="i"
        @click="goTo(i)"
        class="w-2 rounded-full transition-all duration-300 cursor-pointer"
        :class="i === currentIndex ? 'h-5 bg-primary' : 'h-2 hover:h-3 bg-border'"
        :aria-label="'第' + (i + 1) + '页'"
      />
    </div>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto p-4">
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-16 text-fg-muted"
      >
        <div class="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin border-primary" />
      </div>

      <div
        v-else-if="currentPage"
        class="rounded-lg p-5 animate-fade-in-up bg-bg border border-border"
      >
        <div class="text-xs px-2 py-0.5 rounded-full w-fit mb-3 bg-primary/10 text-primary">
          {{ currentPage.pageType === 'text' ? '📖 讲解' :
             currentPage.pageType === 'code' ? '💻 代码' :
             currentPage.pageType === 'diagram' ? '📊 图表' :
             currentPage.pageType === 'quiz' ? '❓ 测验' : currentPage.pageType }}
        </div>
        <h3 class="text-lg font-semibold mb-3 text-fg">
          {{ currentPage.summary }}
        </h3>

        <!-- 非测验 -->
        <pre
          v-if="!isQuiz"
          class="text-sm leading-relaxed whitespace-pre-wrap max-w-[65ch] text-fg-muted"
          style="font-family: inherit;"
        >{{ currentPage.content }}</pre>

        <!-- 测验 -->
        <template v-else>
          <p class="text-sm leading-relaxed mb-4 text-fg-muted">
            {{ currentPage.content }}
          </p>
          <div v-if="currentPage.options && currentPage.options.length > 0" class="flex flex-col gap-2 mb-4">
            <div
              v-for="opt in currentPage.options"
              :key="opt"
              class="px-4 py-2.5 rounded-lg text-sm border"
              :style="getOptionStyle(opt, currentPage.answer || '')"
            >
              {{ opt }}
            </div>
          </div>
          <div
            v-if="currentPage.answer"
            class="px-4 py-3 rounded-lg text-sm bg-success/15 text-success font-medium"
          >
            ✅ 正确答案：{{ currentPage.answer }}
          </div>
        </template>
      </div>
    </div>

    <!-- 底部导航 -->
    <footer class="shrink-0 px-4 py-3 border-t border-border">
      <div v-if="moveMsg" class="text-center text-xs mb-2 text-success animate-fade-in-up">
        {{ moveMsg }}
      </div>

      <!-- 移动菜单 -->
      <div v-if="showMoveMenu" class="mb-2">
        <template v-if="moveLevel === 0">
          <p class="text-xs mb-2 text-fg-muted">选择目标文件夹：</p>
          <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            <button
              v-for="folder in topFolders"
              :key="folder.id"
              @click="folder.id != null && drillInto(folder)"
              class="px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer hover:scale-105
                     flex items-center gap-1 bg-primary/10 text-primary"
            >
              📁 {{ folder.name }}
              <span class="text-[10px] opacity-60">▶</span>
            </button>
            <span v-if="topFolders.length === 0" class="text-xs text-fg-muted">
              暂无文件夹，请先在左侧目录创建
            </span>
          </div>
        </template>

        <template v-else>
          <div class="flex items-center gap-2 mb-2">
            <button
              @click="backToTop"
              class="text-xs cursor-pointer text-fg-muted hover:text-fg transition-colors"
            >
              ← 返回上级
            </button>
            <span class="text-xs font-medium text-fg">{{ moveParentName }}</span>
          </div>

          <button
            @click="handleMove(moveParentId)"
            class="w-full text-left px-3 py-2 rounded-lg text-xs mb-2 transition-all cursor-pointer
                   hover:scale-[1.01] bg-success/10 text-success border border-success/50"
          >
            📂 放入「{{ moveParentName }}」（不进入子目录）
          </button>

          <div v-if="subFolders.length > 0" class="flex flex-wrap gap-1.5">
            <button
              v-for="sub in subFolders"
              :key="sub.id"
              @click="sub.id != null && handleMove(sub.id)"
              class="px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer hover:scale-105
                     bg-accent/10 text-accent"
            >
              📁 {{ sub.name }}
            </button>
          </div>
          <p v-else class="text-xs text-fg-muted">此文件夹下暂无子目录</p>
        </template>
      </div>

      <div class="flex items-center justify-between gap-2">
        <button
          @click="goTo(currentIndex - 1)"
          :disabled="currentIndex === 0"
          class="btn-ghost"
          aria-label="上一页"
        >
          ← 上一页
        </button>

        <button
          @click="toggleMoveMenu"
          class="btn-ghost"
          :class="{ 'bg-accent/10 text-accent border-accent/40': showMoveMenu }"
          aria-label="移动到文件夹"
        >
          📂 移动到...
        </button>

        <button
          @click="goTo(currentIndex + 1)"
          :disabled="currentIndex >= pages.length - 1"
          class="btn-primary"
          aria-label="下一页"
        >
          下一页 →
        </button>
      </div>
    </footer>
  </div>
</template>
