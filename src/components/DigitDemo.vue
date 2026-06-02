<script setup lang="ts">
/**
 * DigitDemo — 手写数字识别交互演示
 * 28×28 Canvas 绘制 + 启发式分类
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from '../composables/useGsap'

const emit = defineEmits<{
  (e: 'start-learning', concept: string): void
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
const prediction = ref('?')
const confidencePct = ref(0)
const confidenceLabel = ref('')
const GRID_SIZE = 28

let ctx: CanvasRenderingContext2D | null = null
let pixelData: number[] = new Array(GRID_SIZE * GRID_SIZE).fill(0)
let drawing = false

function setupCanvas() {
  const canvas = canvasRef.value
  if (!canvas) return
  const size = Math.min(canvas.parentElement!.clientWidth - 16, 400)
  canvas.width = size
  canvas.height = size
  // ctx 在首次 onMounted 时已获取，resize 不会使其失效
  drawGrid()
}

function drawGrid() {
  if (!ctx || !canvasRef.value) return
  const cw = canvasRef.value.width
  const cellW = cw / GRID_SIZE
  const cellH = cw / GRID_SIZE

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() || '#0a0a0f'
  ctx.fillRect(0, 0, cw, cw)

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const val = pixelData[y * GRID_SIZE + x]
      if (val > 0) {
        ctx.fillStyle = `rgba(0, 240, 255, ${val})`
        ctx.fillRect(x * cellW, y * cellH, cellW, cellH)
      }
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath(); ctx.moveTo(i * cellW, 0); ctx.lineTo(i * cellW, cw); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, i * cellH); ctx.lineTo(cw, i * cellH); ctx.stroke()
  }
}

function getPos(e: MouseEvent | Touch) {
  const rect = canvasRef.value!.getBoundingClientRect()
  const scaleX = canvasRef.value!.width / rect.width
  const scaleY = canvasRef.value!.height / rect.height
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  }
}

function drawBrush(cx: number, cy: number) {
  const cw = canvasRef.value!.width
  const cellW = cw / GRID_SIZE
  const cellH = cw / GRID_SIZE
  const brushSize = 2

  for (let dy = -brushSize; dy <= brushSize; dy++) {
    for (let dx = -brushSize; dx <= brushSize; dx++) {
      const gx = Math.floor(cx / cellW) + dx
      const gy = Math.floor(cy / cellH) + dy
      if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        const strength = Math.max(0, 1 - dist / (brushSize + 0.5))
        pixelData[gy * GRID_SIZE + gx] = Math.min(1, pixelData[gy * GRID_SIZE + gx] + strength * 0.7)
      }
    }
  }
}

function onMouseDown(e: MouseEvent) { drawing = true; const pos = getPos(e); drawBrush(pos.x, pos.y); drawGrid() }
function onMouseMove(e: MouseEvent) { if (!drawing) return; const pos = getPos(e); drawBrush(pos.x, pos.y); drawGrid() }
function onMouseUp() { drawing = false }
function onTouchStart(e: TouchEvent) { e.preventDefault(); drawing = true; const pos = getPos(e.touches[0]); drawBrush(pos.x, pos.y); drawGrid() }
function onTouchMove(e: TouchEvent) { e.preventDefault(); if (!drawing) return; const pos = getPos(e.touches[0]); drawBrush(pos.x, pos.y); drawGrid() }
function onTouchEnd() { drawing = false }

function clearCanvas() {
  pixelData.fill(0)
  drawGrid()
  prediction.value = '?'
  confidencePct.value = 0
  confidenceLabel.value = ''
}

/**
 * 启发式数字分类器
 * 提取 7 维特征向量，为每个数字模板打分，选出最佳匹配。
 *
 * 特征维度:
 *   - centerWeight: 中心区域像素密度（低→0/环状，中→普遍，高→实心）
 *   - verticalSpread: 水平方向分布宽度（窄→1/竖线，宽→宽数字）
 *   - horizontalSpread: 垂直方向分布范围
 *   - topRatio: 上半部像素占比
 *   - bottomRatio: 下半部像素占比
 *   - leftRatio: 左半部像素占比
 *   - aspectRatio: 宽高比（通过 vSpread/hSpread 近似）
 *
 * 启发式规则覆盖所有 0-9 数字，随机噪声降至 0.06 以保持适度不确定性。
 */
function classify() {
  const totalPixels = pixelData.reduce((a, b) => a + b, 0)
  if (totalPixels < 5) {
    prediction.value = '?'
    confidenceLabel.value = '请先在画布上绘制数字！'
    return
  }

  // 提取特征
  const cw = calcCenterWeight()
  const vw = calcVerticalWeight()
  const hw = calcHorizontalWeight()
  const topR = calcTopRatio()
  const botR = calcBottomRatio()
  const leftR = calcLeftRatio()

  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const scores = digits.map((d) => {
    // 极小的基础噪声（模拟真实 ML 的不确定性）
    let score = Math.random() * 0.06

    switch (d) {
      case 0:
        // 环状结构：中心空 + 四周均匀分布
        if (cw < 0.35) score += 0.55
        if (vw > 0.4 && hw > 0.35) score += 0.2
        if (topR > 0.25 && botR > 0.25) score += 0.1
        break
      case 1:
        // 竖线：水平窄 + 垂直拉伸 + 集中在中间
        if (vw > 0.55) score += 0.45
        if (hw < 0.35) score += 0.3
        if (leftR > 0.3 && leftR < 0.65) score += 0.1
        break
      case 2:
        // 顶部弧线 + 中间 + 底部横线：顶部有像素、中间偏下也有
        if (topR > 0.3 && botR > 0.25) score += 0.3
        if (hw > 0.35 && hw < 0.6) score += 0.2
        if (cw < 0.55) score += 0.15
        break
      case 3:
        // 双弧线：类似两个横向凸起，中间密度高
        if (cw > 0.4 && hw > 0.4) score += 0.3
        if (topR > 0.25 && botR > 0.2) score += 0.2
        if (vw > 0.35 && vw < 0.6) score += 0.15
        break
      case 4:
        // 十字交叉：左边竖线 + 右边横线
        if (leftR > 0.4 && leftR < 0.6) score += 0.25
        if (hw > 0.4 && vw > 0.35) score += 0.2
        if (topR < 0.55) score += 0.15  // 重心偏下
        break
      case 5:
        // 顶部横线 + 中间转折 + 底部弧线
        if (topR > 0.3 && botR > 0.2) score += 0.3
        if (cw > 0.35 && cw < 0.6) score += 0.2
        if (leftR > 0.25 && leftR < 0.55) score += 0.1
        break
      case 6:
        // 底部闭环 + 顶部弯曲：像素集中在左下和底部
        if (botR > 0.35 && cw < 0.5) score += 0.35
        if (leftR > 0.35) score += 0.15
        if (topR < 0.45) score += 0.15
        break
      case 7:
        // 顶部横线 + 右上斜线
        if (topR > 0.4 && botR < 0.35) score += 0.4
        if (vw > 0.4 && hw > 0.35) score += 0.2
        if (leftR < 0.45) score += 0.1  // 偏右
        break
      case 8:
        // 双环：中心实心 + 宽分布
        if (cw > 0.45 && vw > 0.35) score += 0.4
        if (topR > 0.25 && botR > 0.25) score += 0.2
        if (hw > 0.38) score += 0.15
        break
      case 9:
        // 顶部闭环 + 右下尾巴：类似8但重心偏上
        if (topR > 0.35 && cw > 0.35) score += 0.35
        if (botR > 0.2 && leftR < 0.55) score += 0.2
        if (hw > 0.38) score += 0.1
        break
    }
    return score
  })

  // Softmax 归一化
  const maxScore = Math.max(...scores)
  const expScores = scores.map(s => Math.exp(s - maxScore))
  const sum = expScores.reduce((a, b) => a + b, 0)
  const probs = expScores.map(s => s / sum)
  const bestIdx = probs.indexOf(Math.max(...probs))
  const conf = Math.round(probs[bestIdx] * 100)

  gsap.to({ v: 0 }, {
    v: 1, duration: 0.6, ease: 'power3.out',
    onUpdate: function () {
      const v = (this as any).targets()[0].v
      prediction.value = String(digits[bestIdx])
      confidencePct.value = Math.round(conf * v)
      confidenceLabel.value = '置信度：' + Math.round(conf * v) + '%'
    },
  })
}

function calcCenterWeight(): number {
  let center = 0, total = 0
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++) {
      const dx = (x - 14) / 14; const dy = (y - 14) / 14
      const dist = Math.sqrt(dx * dx + dy * dy)
      center += pixelData[y * GRID_SIZE + x] * (1 - Math.min(1, dist))
      total += pixelData[y * GRID_SIZE + x]
    }
  return total > 0 ? center / total : 0
}
function calcVerticalWeight(): number {
  let v = 0, total = 0
  for (let x = 0; x < GRID_SIZE; x++) {
    let colSum = 0
    for (let y = 0; y < GRID_SIZE; y++) colSum += pixelData[y * GRID_SIZE + x]
    v += colSum * (1 - Math.abs(x - 14) / 14)
  }
  for (let i = 0; i < pixelData.length; i++) total += pixelData[i]
  return total > 0 ? v / total : 0
}
function calcHorizontalWeight(): number {
  let h = 0, total = 0
  for (let y = 0; y < GRID_SIZE; y++) {
    let rowSum = 0
    for (let x = 0; x < GRID_SIZE; x++) rowSum += pixelData[y * GRID_SIZE + x]
    h += rowSum * (1 - Math.abs(y - 14) / 14)
  }
  for (let i = 0; i < pixelData.length; i++) total += pixelData[i]
  return total > 0 ? h / total : 0
}
/** 上半部 (行0-13) 像素占比 */
function calcTopRatio(): number {
  let top = 0, total = 0
  for (let y = 0; y < 14; y++)
    for (let x = 0; x < GRID_SIZE; x++)
      top += pixelData[y * GRID_SIZE + x]
  for (let i = 0; i < pixelData.length; i++) total += pixelData[i]
  return total > 0 ? top / total : 0
}
/** 下半部 (行14-27) 像素占比 */
function calcBottomRatio(): number {
  let bot = 0, total = 0
  for (let y = 14; y < GRID_SIZE; y++)
    for (let x = 0; x < GRID_SIZE; x++)
      bot += pixelData[y * GRID_SIZE + x]
  for (let i = 0; i < pixelData.length; i++) total += pixelData[i]
  return total > 0 ? bot / total : 0
}
/** 左半部 (列0-13) 像素占比 */
function calcLeftRatio(): number {
  let left = 0, total = 0
  for (let y = 0; y < GRID_SIZE; y++)
    for (let x = 0; x < 14; x++)
      left += pixelData[y * GRID_SIZE + x]
  for (let i = 0; i < pixelData.length; i++) total += pixelData[i]
  return total > 0 ? left / total : 0
}

onMounted(() => {
  nextTick(() => {
    const canvas = canvasRef.value
    if (canvas) ctx = canvas.getContext('2d')!
    setupCanvas()
  })
  window.addEventListener('resize', setupCanvas)
})
onUnmounted(() => { window.removeEventListener('resize', setupCanvas) })
</script>

<template>
  <div class="grid md:grid-cols-2 gap-6 items-start">
    <div class="rounded-xl overflow-hidden border border-border bg-bg-card">
      <canvas ref="canvasRef" class="w-full aspect-square cursor-crosshair bg-bg"
        @mousedown="onMouseDown" @mousemove="onMouseMove" @mouseup="onMouseUp" @mouseleave="onMouseUp"
        @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd"
      />
      <div class="flex gap-2 p-2 border-t border-border">
        <button @click="clearCanvas" class="flex-1 py-2 rounded-lg text-xs font-medium bg-bg-elevated text-fg-muted hover:text-fg border border-border transition-colors">清除</button>
        <button @click="classify" class="flex-1 py-2 rounded-lg text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors">识别</button>
      </div>
      <div class="text-center py-3">
        <div class="text-4xl font-bold text-primary" style="font-family:var(--font-display,inherit)">{{ prediction }}</div>
        <div class="mt-1">
          <div class="w-32 mx-auto h-1.5 rounded-full bg-border overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all duration-300" :style="{ width: confidencePct + '%' }" />
          </div>
          <p class="text-xs text-fg-muted mt-1">{{ confidenceLabel }}</p>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <h3 class="font-semibold text-primary">手写数字识别</h3>
      <p class="text-sm text-fg-muted leading-relaxed">
        在左侧画布上绘制一个数字（0-9），然后点击<strong class="text-primary">识别</strong>按钮。本演示模拟了在 MNIST 数据集上训练的神经网络如何识别手写数字。
      </p>
      <p class="text-sm text-fg-muted leading-relaxed">
        模型通过分析像素分布、边缘密度和空间布局来预测数字。类似的实际系统广泛应用于银行支票扫描和全球邮政编码识别。
      </p>
      <button @click="emit('start-learning', '神经网络如何识别手写数字')" class="btn-primary text-sm">
        🔍 AI 深入讲解神经网络
      </button>
    </div>
  </div>
</template>
