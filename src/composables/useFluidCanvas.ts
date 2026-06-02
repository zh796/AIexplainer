/**
 * useFluidCanvas — 磁流体 Canvas 引擎
 *
 * 三层渲染：
 *   Layer 1: 透视网格（低频刷新，约15fps）
 *   Layer 2: 粒子/数据流（60fps，响应鼠标引力）
 *   Layer 3: 能量波特效（按需触发，衰减后自动移除）
 *
 * 鼠标交互：光标周围250px内粒子加速汇聚，网格节点拉伸形变
 *
 * v2 优化：
 *   - resize 时保留粒子/网格比例而非完全重建
 *   - 窗口 resize 监听器正确清理
 *   - 网格绘制性能优化（预缓存行/列分组）
 */
import { ref, onMounted, onUnmounted, type Ref } from 'vue'

export interface FluidOptions {
  particleCount?: number
  gridSpacing?: number
  attractRadius?: number
  gridColor?: string
  particleColor?: string
  gridAlpha?: number
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  baseX: number; baseY: number
  size: number
  alpha: number
  life: number
}

interface GridNode {
  x: number; y: number
  ox: number; oy: number
  vx: number; vy: number
}

interface EnergyWave {
  x: number; y: number
  radius: number
  maxRadius: number
  alpha: number
}

export function useFluidCanvas(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: FluidOptions = {},
) {
  const {
    particleCount = 60,
    gridSpacing = 50,
    attractRadius = 250,
    gridColor = 'rgba(0,240,255,0.06)',
    particleColor = '#00F0FF',
    gridAlpha = 0.06,
  } = options

  const mouseX = ref(-1000)
  const mouseY = ref(-1000)
  const isHovering = ref(false)

  let ctx: CanvasRenderingContext2D | null = null
  let particles: Particle[] = []
  let gridNodes: GridNode[] = []
  let waves: EnergyWave[] = []
  let animId: number | null = null
  let gridTick = 0
  let w = 0, h = 0

  // 预缓存的网格行/列分组（resize 时重建）
  let rowGroups: GridNode[][] = []
  let colGroups: GridNode[][] = []

  // ====== 初始化 ======

  function initParticles(): void {
    if (w === 0 || h === 0) {
      particles = []
      return
    }

    // 保留已有粒子，按比例缩放位置
    if (particles.length > 0) {
      const oldW = w; const oldH = h
      // 这些值在 resize 后会更新，但 initParticles 在 resize 前调用时还是旧值
      // 需要先 resize 再 init
      for (const p of particles) {
        p.x = (p.x / oldW) * w
        p.y = (p.y / oldH) * h
        p.baseX = p.x
        p.baseY = p.y
      }
      // 补齐或减少粒子
      while (particles.length < particleCount) {
        const x = Math.random() * w
        const y = Math.random() * h
        particles.push({
          x, y, vx: (Math.random() - 0.5) * 0.3,
          vy: -(Math.random() * 0.4 + 0.1),
          baseX: x, baseY: y,
          size: 1 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.3,
          life: 1,
        })
      }
      particles.length = particleCount
      return
    }

    // 首次初始化
    particles = []
    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      particles.push({
        x, y, vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        baseX: x, baseY: y,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.3,
        life: 1,
      })
    }
  }

  function initGrid(): void {
    gridNodes = []
    rowGroups = []
    colGroups = []

    const cols = Math.floor(w / gridSpacing) + 2
    const rows = Math.floor(h / gridSpacing) + 2

    // 按行分组的临时 map
    const rowMap = new Map<number, GridNode[]>()
    const colMap = new Map<number, GridNode[]>()

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * gridSpacing
        const y = j * gridSpacing
        const node: GridNode = { x, y, ox: x, oy: y, vx: 0, vy: 0 }
        gridNodes.push(node)

        // 按行分组
        if (!rowMap.has(j)) rowMap.set(j, [])
        rowMap.get(j)!.push(node)

        // 按列分组
        if (!colMap.has(i)) colMap.set(i, [])
        colMap.get(i)!.push(node)
      }
    }

    // 转为数组（预排序，绘制时直接用）
    rowGroups = Array.from(rowMap.values())
    colGroups = Array.from(colMap.values())
  }

  // ====== 鼠标事件 ======

  function onMouseMove(e: MouseEvent): void {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect) return
    mouseX.value = e.clientX - rect.left
    mouseY.value = e.clientY - rect.top
    isHovering.value = true
  }

  function onMouseLeave(): void {
    isHovering.value = false
  }

  /** 触发能量波 */
  function triggerWave(x: number, y: number): void {
    waves.push({ x, y, radius: 0, maxRadius: 400, alpha: 0.6 })
  }

  function onClick(e: MouseEvent): void {
    const rect = canvasRef.value?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    triggerWave(x, y)
  }

  // ====== 渲染循环 ======

  let resizeHandler: (() => void) | null = null

  function resize(): void {
    const canvas = canvasRef.value
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    w = canvas.clientWidth
    h = canvas.clientHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx = canvas.getContext('2d')
    if (ctx) ctx.scale(dpr, dpr)
  }

  function drawGrid(): void {
    if (!ctx || gridNodes.length === 0) return

    const mx = mouseX.value
    const my = mouseY.value
    const hover = isHovering.value

    ctx.strokeStyle = gridColor
    ctx.lineWidth = 0.5

    // 更新节点位置（弹簧物理）
    for (const node of gridNodes) {
      const dx = mx - node.ox
      const dy = my - node.oy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (hover && dist < attractRadius) {
        const force = (1 - dist / attractRadius) * 0.15
        node.vx += dx * force * 0.01
        node.vy += dy * force * 0.01
      }

      // 弹簧回弹
      node.vx += (node.ox - node.x) * 0.08
      node.vy += (node.oy - node.y) * 0.08

      // 阻尼
      node.vx *= 0.85
      node.vy *= 0.85

      node.x += node.vx
      node.y += node.vy

      const breatheAlpha = gridAlpha + Math.sin(Date.now() * 0.0005 + node.ox * 0.01) * 0.02
      ctx.globalAlpha = Math.max(0.01, breatheAlpha)
    }

    // 使用预缓存的行/列分组绘制（避免每帧 sort/filter）
    for (const row of rowGroups) {
      ctx.beginPath()
      ctx.moveTo(row[0].x, row[0].y)
      for (let i = 1; i < row.length; i++) {
        ctx.lineTo(row[i].x, row[i].y)
      }
      ctx.stroke()
    }

    for (const col of colGroups) {
      ctx.beginPath()
      ctx.moveTo(col[0].x, col[0].y)
      for (let i = 1; i < col.length; i++) {
        ctx.lineTo(col[i].x, col[i].y)
      }
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }

  function drawParticles(): void {
    if (!ctx) return

    const mx = mouseX.value
    const my = mouseY.value
    const hover = isHovering.value

    for (const p of particles) {
      if (hover) {
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < attractRadius) {
          const force = (1 - dist / attractRadius) * 0.04
          p.vx += dx * force
          p.vy += dy * force
        }
      }

      p.vx += (p.baseX - p.x) * 0.001
      p.vy += -(0.08 + Math.random() * 0.04)

      p.vx *= 0.98
      p.vy *= 0.98

      p.x += p.vx
      p.y += p.vy

      // 边界环绕
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w }
      if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w }
      if (p.x < -10) p.x = w + 10
      if (p.x > w + 10) p.x = -10

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = particleColor
      ctx.globalAlpha = p.alpha
      ctx.fill()

      // 拖尾光晕
      if (hover) {
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < attractRadius * 0.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = particleColor
          ctx.globalAlpha = p.alpha * 0.15
          ctx.fill()
        }
      }
    }
    ctx.globalAlpha = 1
  }

  function drawWaves(): void {
    if (!ctx) return
    for (let i = waves.length - 1; i >= 0; i--) {
      const wave = waves[i]
      wave.radius += 6
      wave.alpha -= 0.015
      if (wave.alpha <= 0) {
        waves.splice(i, 1)
        continue
      }
      ctx.beginPath()
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(0,240,255,${wave.alpha})`
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(wave.x, wave.y, wave.radius * 0.7, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(168,85,247,${wave.alpha * 0.5})`
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  function tick(): void {
    if (!ctx || !canvasRef.value) return
    ctx.clearRect(0, 0, w, h)

    gridTick++
    if (gridTick % 4 === 0) drawGrid()

    drawParticles()
    drawWaves()

    animId = requestAnimationFrame(tick)
  }

  // ====== 生命周期 ======

  resizeHandler = () => {
    resize()
    initParticles()
    initGrid()
  }

  onMounted(() => {
    resize()
    initParticles()
    initGrid()
    animId = requestAnimationFrame(tick)

    const canvas = canvasRef.value
    if (canvas) {
      canvas.addEventListener('mousemove', onMouseMove)
      canvas.addEventListener('mouseleave', onMouseLeave)
      canvas.addEventListener('click', onClick)
    }
    if (resizeHandler) {
      window.addEventListener('resize', resizeHandler)
    }
  })

  onUnmounted(() => {
    if (animId) cancelAnimationFrame(animId)
    const canvas = canvasRef.value
    if (canvas) {
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      canvas.removeEventListener('click', onClick)
    }
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    resizeHandler = null
  })

  return {
    mouseX,
    mouseY,
    isHovering,
    triggerWave,
  }
}
