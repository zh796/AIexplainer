<script setup lang="ts">
/**
 * 图表卡片组件 v2
 *
 * 特性：
 *   - 骨架屏加载态（模拟图表形状的脉冲占位）
 *   - 鼠标滚轮缩放 + 拖拽平移（大图表友好）
 *   - 全屏展开按钮
 *   - 浮动工具栏（缩放控制 / 全屏 / 复制源码）
 *   - 错误状态自动重试一次
 *   - 主题切换时从缓存读取，无闪烁
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import type { TutorialPage } from '../types'
import { renderDiagram } from '../services/mermaidRenderer'

const props = defineProps<{
  page: TutorialPage
  hideExplanation?: boolean
}>()

// ====== 渲染状态 ======
const svgContent = ref<string | null>(null)
const fallbackText = ref<string | null>(null)
const isError = ref(false)
const errorDetail = ref<string | null>(null)
const isLoading = ref(true)
const showRaw = ref(false)
const isFullscreen = ref(false)
const retryCount = ref(0)

// ====== 缩放 & 平移 ======
const svgWrapper = ref<HTMLDivElement | null>(null)
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
let isPanning = false
let panStartX = 0
let panStartY = 0
let panOriginX = 0
let panOriginY = 0

const MIN_SCALE = 0.3
const MAX_SCALE = 3.0
const ZOOM_STEP = 0.15

const transformStyle = computed(() =>
  `translate(${panX.value}px, ${panY.value}px) scale(${scale.value})`
)

// ====== 图表类型 ======
const diagramType = computed(() => {
  const def = props.page.content.trim()
  if (def.startsWith('flowchart') || def.startsWith('graph ')) return '流程图'
  if (def.startsWith('sequenceDiagram')) return '时序图'
  if (def.startsWith('classDiagram')) return '类图'
  if (def.startsWith('stateDiagram')) return '状态图'
  if (def.startsWith('gantt')) return '甘特图'
  if (def.startsWith('pie')) return '饼图'
  if (def.startsWith('erDiagram')) return 'ER 图'
  if (def.startsWith('mindmap')) return '思维导图'
  if (def.startsWith('timeline')) return '时间线'
  if (def.startsWith('gitGraph')) return 'Git 图'
  if (def.startsWith('block')) return '框图'
  if (def.startsWith('sankey')) return '桑基图'
  return '图表'
})

const typeIcon = computed(() => {
  const map: Record<string, string> = {
    '流程图': '🔀', '时序图': '⏱️', '类图': '🏗️', '状态图': '🔁',
    '甘特图': '📅', '饼图': '🥧', 'ER 图': '🗄️', '思维导图': '🧠',
    '时间线': '📋', 'Git 图': '🌿', '框图': '🧱', '桑基图': '🌊',
  }
  return map[diagramType.value] || '📊'
})

// ====== 主题监听 ======
const currentTheme = ref(
  document.documentElement.getAttribute('data-theme') || 'dark',
)
let themeObserver: MutationObserver | null = null

onMounted(() => {
  themeObserver = new MutationObserver(() => {
    const t = document.documentElement.getAttribute('data-theme') || 'dark'
    if (t !== currentTheme.value) {
      currentTheme.value = t
    }
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })
})
onUnmounted(() => themeObserver?.disconnect())

// 主题变化 → 从缓存重新拉取（mermaidRenderer 有按 theme 的缓存）
watch(currentTheme, () => {
  if (svgContent.value && !isError.value) {
    loadDiagram()
  }
})

// ====== 加载图表 ======
async function loadDiagram(): Promise<void> {
  isLoading.value = true
  isError.value = false
  svgContent.value = null
  errorDetail.value = null
  fallbackText.value = null
  // 重置缩放
  scale.value = 1
  panX.value = 0
  panY.value = 0

  const result = await renderDiagram(props.page.content, props.page.desc)
  isLoading.value = false

  if (result.type === 'success') {
    svgContent.value = result.svg || null
    fallbackText.value = result.fallback || null
    isError.value = false
    retryCount.value = 0
  } else {
    fallbackText.value = result.fallback || '（图表渲染失败）'
    errorDetail.value = result.errorDetail || null
    isError.value = true

    // 自动重试一次
    if (retryCount.value === 0) {
      retryCount.value++
      setTimeout(() => loadDiagram(), 800)
    }
  }
}

// ====== 缩放控制 ======
function zoomIn(): void {
  scale.value = Math.min(MAX_SCALE, +(scale.value + ZOOM_STEP).toFixed(2))
}
function zoomOut(): void {
  scale.value = Math.max(MIN_SCALE, +(scale.value - ZOOM_STEP).toFixed(2))
}
function zoomReset(): void {
  scale.value = 1
  panX.value = 0
  panY.value = 0
}

function onWheel(e: WheelEvent): void {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale.value + delta))

  // 以鼠标位置为中心缩放
  const rect = svgWrapper.value?.getBoundingClientRect()
  if (rect) {
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const ratio = newScale / scale.value
    panX.value = mx - ratio * (mx - panX.value)
    panY.value = my - ratio * (my - panY.value)
  }
  scale.value = newScale
}

function onPanStart(e: MouseEvent): void {
  if (scale.value <= 1) return
  isPanning = true
  panStartX = e.clientX
  panStartY = e.clientY
  panOriginX = panX.value
  panOriginY = panY.value
  e.preventDefault()
}

function onPanMove(e: MouseEvent): void {
  if (!isPanning) return
  panX.value = panOriginX + (e.clientX - panStartX)
  panY.value = panOriginY + (e.clientY - panStartY)
}

function onPanEnd(): void {
  isPanning = false
}

// ====== 全屏 ======
function toggleFullscreen(): void {
  isFullscreen.value = !isFullscreen.value
  if (!isFullscreen.value) {
    // 退出全屏时重置缩放
    nextTick(() => zoomReset())
  }
}

function onFullscreenKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    isFullscreen.value = false
  }
}

watch(isFullscreen, (val) => {
  if (val) {
    document.addEventListener('keydown', onFullscreenKeydown)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onFullscreenKeydown)
    document.body.style.overflow = ''
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onFullscreenKeydown)
  document.body.style.overflow = ''
})

// ====== 复制源码 ======


// ====== 生命周期 ======
onMounted(loadDiagram)
watch(() => props.page.content, loadDiagram)

// 全屏时阻止外层滚动
function preventScroll(e: Event): void {
  if (isFullscreen.value) e.preventDefault()
}
onMounted(() => window.addEventListener('wheel', preventScroll, { passive: false }))
onUnmounted(() => window.removeEventListener('wheel', preventScroll))
</script>

<template>
  <div class="flex flex-col gap-4 items-center">
    <!-- ================================================================
         骨架屏加载态
         ================================================================ -->
    <div
      v-if="isLoading"
      class="w-full animate-fade-in-up"
    >
      <div class="rounded-xl overflow-hidden border border-border bg-bg-elevated">
        <!-- 顶部色条（骨架） -->
        <div class="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/20 to-accent/30 animate-pulse" />
        <!-- 头部骨架 -->
        <div class="flex items-center gap-3 px-4 py-3 border-b border-border/50">
          <div class="h-5 w-16 rounded-full bg-primary/10 animate-pulse" />
          <div class="h-4 w-32 rounded bg-fg-subtle/20 animate-pulse" />
        </div>
        <!-- 图表骨架 — 模拟节点/连线 -->
        <div class="p-6 sm:p-8 flex items-center justify-center min-h-[220px]">
          <div class="flex flex-wrap items-center justify-center gap-5">
            <div
              v-for="i in 4"
              :key="i"
              class="flex items-center gap-5"
            >
              <div
                class="rounded-lg bg-primary/10 animate-pulse"
                :style="{
                  width: `${50 + Math.sin(i * 1.7) * 30}px`,
                  height: `${36 + Math.cos(i * 2.1) * 16}px`,
                  animationDelay: `${i * 120}ms`,
                }"
              />
              <div
                v-if="i < 4"
                class="w-10 sm:w-16 h-0.5 bg-border/60 animate-pulse rounded"
                :style="{ animationDelay: `${i * 120 + 60}ms` }"
              />
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs text-center mt-2 text-fg-subtle animate-pulse">
        正在渲染{{ diagramType }}...
      </p>
    </div>

    <!-- ================================================================
         图表本体
         ================================================================ -->
    <div
      v-else-if="svgContent && !isError"
      class="w-full animate-fade-in-scale"
    >
      <div
        class="relative rounded-xl overflow-hidden border border-border
                bg-bg-elevated shadow-sm group/diagram"
        :class="{ '!rounded-none !border-0 !shadow-none': isFullscreen }"
      >
        <!-- 顶部色条 -->
        <div class="h-1 w-full bg-gradient-to-r from-primary via-primary to-accent" />

        <!-- 图表头部 -->
        <div
          class="flex items-center justify-between px-4 py-2.5 border-b border-border/50"
          :class="{ 'px-6': isFullscreen }"
        >
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
              {{ typeIcon }} {{ diagramType }}
            </span>
            <span
              v-if="page.desc"
              class="text-xs text-fg-muted truncate"
            >
              {{ page.desc }}
            </span>
          </div>
          <div class="flex items-center gap-0.5 shrink-0">
            <!-- 缩放指示 -->
            <span
              v-if="scale !== 1"
              class="text-[10px] px-1.5 text-fg-subtle font-mono"
            >
              {{ Math.round(scale * 100) }}%
            </span>
            <!-- 源码切换 -->
            <button
              @click="showRaw = !showRaw"
              class="text-xs px-2 py-1 rounded transition-colors text-fg-muted hover:text-fg cursor-pointer"
              :title="showRaw ? '隐藏源码' : '查看源码'"
            >
              {{ showRaw ? '&lt;/&gt;' : '&lt;&gt;' }}
            </button>
            <!-- 全屏 -->
            <button
              @click="toggleFullscreen"
              class="text-xs px-2 py-1 rounded transition-colors text-fg-muted hover:text-fg cursor-pointer"
              :title="isFullscreen ? '退出全屏' : '全屏查看'"
            >
              {{ isFullscreen ? '↙' : '⤢' }}
            </button>
          </div>
        </div>

        <!-- SVG 图表区域 -->
        <div
          ref="svgWrapper"
          class="w-full overflow-hidden flex justify-center items-start
                 cursor-grab active:cursor-grabbing select-none
                 transition-[background] duration-200"
          :class="{
            'p-4 sm:p-6': !isFullscreen,
            'p-6 sm:p-10': isFullscreen,
            '!p-2': isFullscreen && scale > 1.5,
          }"
          :style="isFullscreen ? { minHeight: '60vh', maxHeight: 'calc(100vh - 100px)' } : {}"
          @wheel.prevent="onWheel"
          @mousedown="onPanStart"
          @mousemove="onPanMove"
          @mouseup="onPanEnd"
          @mouseleave="onPanEnd"
        >
          <div
            class="[&_svg]:max-w-full [&_svg]:h-auto origin-top-left"
            :style="{ transform: transformStyle, transition: isPanning ? 'none' : 'transform 0.3s ease' }"
            v-html="svgContent"
          />
        </div>

        <!-- 浮动缩放工具栏 -->
        <div
          class="absolute right-3 bottom-3 flex flex-col gap-1 opacity-0
                 group-hover/diagram:opacity-100 transition-opacity duration-200"
          :class="{
            'opacity-100': scale !== 1,
            'right-6 bottom-6': isFullscreen,
          }"
        >
          <button
            @click="zoomIn"
            :disabled="scale >= MAX_SCALE"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                   bg-bg-card border border-border text-fg-muted
                   hover:text-fg hover:border-fg-subtle disabled:opacity-30
                   transition-all cursor-pointer shadow-sm"
            title="放大"
          >+</button>
          <button
            @click="zoomReset"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-[10px]
                   bg-bg-card border border-border text-fg-subtle
                   hover:text-fg transition-all cursor-pointer shadow-sm"
            title="重置"
          >1:1</button>
          <button
            @click="zoomOut"
            :disabled="scale <= MIN_SCALE"
            class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold
                   bg-bg-card border border-border text-fg-muted
                   hover:text-fg hover:border-fg-subtle disabled:opacity-30
                   transition-all cursor-pointer shadow-sm"
            title="缩小"
          >−</button>
        </div>
      </div>

      <!-- 源码面板 -->
      <Transition name="raw-slide">
        <pre
          v-if="showRaw"
          class="mt-3 w-full p-4 rounded-lg text-xs leading-relaxed overflow-x-auto
                 bg-bg-elevated text-fg-muted border border-border"
        ><code>{{ page.content }}</code></pre>
      </Transition>
    </div>

    <!-- ================================================================
         错误状态
         ================================================================ -->
    <div
      v-else
      class="w-full text-center py-8 px-4 rounded-xl
             bg-error/5 border border-dashed border-error/30 animate-fade-in-up"
    >
      <span class="text-3xl block mb-3">⚠️</span>
      <p class="text-sm mb-1 text-error font-medium">图表渲染失败</p>

      <p v-if="fallbackText" class="text-sm mt-2 text-fg-muted leading-relaxed max-w-md mx-auto">
        {{ fallbackText }}
      </p>

      <!-- 如果正在自动重试 -->
      <p v-if="retryCount === 1" class="text-xs mt-2 text-fg-subtle animate-pulse">
        正在自动重试...
      </p>

      <details class="mt-3 text-left max-w-lg mx-auto">
        <summary class="text-xs cursor-pointer text-fg-muted hover:text-fg">
          查看错误详情
        </summary>
        <pre
          class="mt-2 p-3 rounded-lg text-xs text-left overflow-x-auto bg-bg-elevated text-error whitespace-pre-wrap"
        >{{ errorDetail || '无详细信息' }}</pre>
      </details>

      <div class="flex items-center justify-center gap-2 mt-4">
        <button @click="loadDiagram" class="btn-ghost text-sm">
          🔄 重新渲染
        </button>
        <button @click="showRaw = !showRaw" class="btn-ghost text-sm">
          {{ showRaw ? '隐藏' : '📋 查看源码' }}
        </button>
      </div>

      <pre
        v-if="showRaw"
        class="mt-3 mx-auto max-w-lg p-3 rounded-lg text-xs text-left overflow-x-auto
               bg-bg-elevated text-fg-muted border border-border"
      ><code>{{ page.content }}</code></pre>
    </div>

    <!-- ====== 补充解释 ====== -->
    <p
      v-if="page.explanation && !hideExplanation"
      class="text-sm px-4 py-3 rounded-lg leading-relaxed w-full bg-accent/10 text-accent"
    >
      📖 {{ page.explanation }}
    </p>
  </div>
</template>

<style scoped>
/* 骨架脉冲 */
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.8; }
}
.animate-pulse {
  animation: pulse 1.8s ease-in-out infinite;
}

/* 源码面板滑入 */
.raw-slide-enter-active {
  transition: all 0.25s ease;
}
.raw-slide-leave-active {
  transition: all 0.15s ease;
}
.raw-slide-enter-from {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
.raw-slide-leave-to {
  opacity: 0;
  max-height: 0;
}

/* Mermaid SVG 优化 */
:deep(svg) {
  border-radius: 8px;
}
:deep(svg text) {
  -webkit-font-smoothing: antialiased;
}
:deep(svg .node rect),
:deep(svg .node circle),
:deep(svg .node ellipse),
:deep(svg .node polygon),
:deep(svg .cluster rect) {
  rx: 8;
  ry: 8;
}
:deep(svg .edgeLabel rect) {
  rx: 4;
  ry: 4;
}
</style>
