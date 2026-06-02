<script setup lang="ts">
/**
 * ChartEmbed — ExploreMode 内嵌图表渲染组件
 *
 * 支持类型:
 *   - mermaid: Mermaid.js 实时渲染（流程图/时序图/饼图等）
 *   - bar:      柱状对比图（Canvas）
 *   - timeline: CSS 时间线
 *   - svg:      动画 SVG
 *
 * 用法: <ChartEmbed type="mermaid" :definition="graph TD; A-->B" caption="训练流程" />
 */
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { renderDiagram } from '../services/mermaidRenderer'
import { gsap } from '../composables/useGsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const props = defineProps<{
  type: 'mermaid' | 'bar' | 'timeline' | 'svg'
  definition?: string
  caption?: string
  /** bar 类型专用 */
  barData?: { label: string; value: number; color?: string }[]
  barMax?: number
  /** svg 类型专用 */
  svgHtml?: string
  /** 滚动容器引用（ScrollTrigger 需要知道实际滚动元素） */
  scroller?: HTMLElement | null
}>()

// ====== Mermaid 渲染 ======
const mermaidSvg = ref('')
const mermaidLoading = ref(false)
const mermaidError = ref('')

onMounted(async () => {
  if (props.type === 'mermaid' && props.definition) {
    mermaidLoading.value = true
    const result = await renderDiagram(props.definition, props.caption)
    mermaidLoading.value = false
    if (result.type === 'success') {
      mermaidSvg.value = result.svg || ''
    } else {
      mermaidError.value = result.fallback || '图表渲染失败'
    }
  }
})

watch(() => props.definition, async (newDef) => {
  if (props.type === 'mermaid' && newDef) {
    mermaidLoading.value = true
    mermaidError.value = ''
    const result = await renderDiagram(newDef, props.caption)
    mermaidLoading.value = false
    if (result.type === 'success') {
      mermaidSvg.value = result.svg || ''
    } else {
      mermaidError.value = result.fallback || '图表渲染失败'
    }
  }
})

// ====== Bar 柱状图 Canvas ======
const barCanvasRef = ref<HTMLCanvasElement | null>(null)
let barCtx: CanvasRenderingContext2D | null = null

function drawBarChart() {
  const canvas = barCanvasRef.value
  if (!canvas || !props.barData) return
  barCtx = canvas.getContext('2d')!
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  barCtx.scale(dpr, dpr)
  const w = rect.width
  const h = rect.height
  const data = props.barData
  const maxVal = props.barMax ?? Math.max(...data.map(d => d.value)) * 1.15
  const barW = (w - 60) / data.length - 16
  const baseY = h - 35

  barCtx.clearRect(0, 0, w, h)

  // 网格线
  barCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() || 'rgba(0,240,255,0.1)'
  barCtx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = 20 + (baseY - 20) * (i / 4)
    barCtx.beginPath(); barCtx.moveTo(40, y); barCtx.lineTo(w - 10, y); barCtx.stroke()
    barCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-fg-subtle').trim() || '#555568'
    barCtx.font = '10px Inter, sans-serif'
    barCtx.fillText(Math.round(maxVal * (1 - i / 4)).toString(), 2, y + 4)
  }

  // 柱状条（带动画）
  data.forEach((d, i) => {
    const x = 48 + i * (barW + 16)
    const targetH = (d.value / maxVal) * (baseY - 20)
    const color = d.color || getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#00f0ff'

    // GSAP 高度动画
    const barObj = { h: 0 }
    gsap.to(barObj, {
      h: targetH,
      duration: 0.8,
      delay: i * 0.1,
      ease: 'back.out(1.2)',
      onUpdate: () => {
        barCtx!.clearRect(x - 1, 18, barW + 2, baseY - 18)
        // 渐变
        const grad = barCtx!.createLinearGradient(x, baseY - barObj.h, x, baseY)
        grad.addColorStop(0, color)
        grad.addColorStop(1, color.replace('1)', '0.15)').replace(')', ',0.15)'))
        barCtx!.fillStyle = grad
        barCtx!.beginPath()
        const r = Math.min(4, barW / 4)
        roundRect(barCtx!, x, baseY - barObj.h, barW, barObj.h, r)
        barCtx!.fill()

        // 数值标签
        barCtx!.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#e8e8ed'
        barCtx!.font = 'bold 11px Inter, sans-serif'
        barCtx!.textAlign = 'center'
        barCtx!.fillText(d.value.toString(), x + barW / 2, baseY - barObj.h - 6)
      },
    })

    // 标签
    barCtx!.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-fg-muted').trim() || '#8888a0'
    barCtx!.font = '10px Inter, sans-serif'
    barCtx!.textAlign = 'center'
    barCtx!.fillText(d.label, x + barW / 2, baseY + 14)
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h)
  ctx.lineTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x, y + r)
  ctx.closePath()
}

// 入场动画触发
const chartRoot = ref<HTMLElement | null>(null)
let barDrawn = false
let stCleanup: ScrollTrigger | null = null

function setupBarTrigger() {
  stCleanup?.kill()
  stCleanup = null
  if (!chartRoot.value || !props.barData) return
  const s = props.scroller || undefined
  stCleanup = ScrollTrigger.create({
    trigger: chartRoot.value,
    start: 'top 85%',
    scroller: s,
    onEnter: () => {
      if (!barDrawn) {
        barDrawn = true
        requestAnimationFrame(() => drawBarChart())
      }
    },
    onEnterBack: () => {
      if (!barDrawn) {
        barDrawn = true
        requestAnimationFrame(() => drawBarChart())
      }
    },
  })
}

// 监听 scroller 变化——首次渲染时 ref 可能还未赋值
watch(() => props.scroller, (newScroller) => {
  if (newScroller && props.type === 'bar' && !barDrawn) {
    setupBarTrigger()
  }
})

onMounted(() => {
  if (props.type === 'bar') {
    // 如果 scroller 已可用则立即创建；否则等 watch 触发
    if (props.scroller) {
      setupBarTrigger()
    }
  }
})

onUnmounted(() => { stCleanup?.kill() })

// resize
if (props.type === 'bar') {
  onMounted(() => { window.addEventListener('resize', drawBarChart) })
  onUnmounted(() => { window.removeEventListener('resize', drawBarChart) })
}
</script>

<template>
  <div ref="chartRoot" class="my-6 reveal" style="opacity:0;transform:translateY(20px)">
    <!-- ====== Mermaid 图 ====== -->
    <template v-if="type === 'mermaid'">
      <div
        class="rounded-xl border border-border overflow-hidden bg-bg-card shadow-sm
               hover:border-primary/40 transition-colors duration-300"
      >
        <div v-if="caption" class="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">📊 图表</span>
          <span class="text-xs text-fg-muted">{{ caption }}</span>
        </div>
        <!-- 加载态 -->
        <div v-if="mermaidLoading" class="flex items-center justify-center p-10">
          <div class="flex items-center gap-2 text-fg-subtle text-sm animate-pulse">⏳ 渲染图表中...</div>
        </div>
        <!-- 错误态 -->
        <div v-else-if="mermaidError" class="p-6 text-center text-sm text-fg-muted">
          {{ mermaidError }}
        </div>
        <!-- SVG 输出 -->
        <div
          v-else-if="mermaidSvg"
          class="p-4 sm:p-6 flex justify-center overflow-x-auto mermaid-container"
          v-html="mermaidSvg"
        />
      </div>
    </template>

    <!-- ====== 柱状图 ====== -->
    <template v-else-if="type === 'bar' && barData">
      <div class="rounded-xl border border-border overflow-hidden bg-bg-card shadow-sm">
        <div v-if="caption" class="px-4 py-2.5 border-b border-border/50 flex items-center gap-2">
          <span class="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">📊 数据</span>
          <span class="text-xs text-fg-muted">{{ caption }}</span>
        </div>
        <canvas
          ref="barCanvasRef"
          class="w-full h-52 sm:h-64"
          style="width:100%"
        />
      </div>
    </template>

    <!-- ====== 动画 SVG ====== -->
    <template v-else-if="type === 'svg' && svgHtml">
      <div
        class="rounded-xl border border-border overflow-hidden bg-bg-card shadow-sm p-4 sm:p-6 flex justify-center"
        v-html="svgHtml"
      />
    </template>

    <!-- ====== 时间线 ====== -->
    <template v-else-if="type === 'timeline'">
      <div class="text-xs text-fg-subtle text-center">（时间线组件使用内置 ExploreMode 实现）</div>
    </template>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}
.animate-pulse {
  animation: pulse 1.8s ease-in-out infinite;
}
/* Mermaid SVG — 确保图表文字始终可读 */
.mermaid-container {
  min-height: 200px;
}
/* 强制 SVG 使用足够大的渲染尺寸，而非缩到看不清 */
.mermaid-container :deep(svg) {
  max-width: none;
  width: 100%;
  height: auto;
  min-width: 600px;
}
/* 放大节点文字和连线标签 */
.mermaid-container :deep(svg .nodeLabel),
.mermaid-container :deep(svg .edgeLabel text),
.mermaid-container :deep(svg .edgeLabel span) {
  font-size: 13px !important;
}
.mermaid-container :deep(svg .node text) {
  font-size: 12px !important;
}
/* 节点最小尺寸确保内容不拥挤 */
.mermaid-container :deep(svg .node rect) {
  min-width: 70px;
  min-height: 36px;
}
</style>
