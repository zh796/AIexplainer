/**
 * useGsap — GSAP 动画工具集
 *
 * 统一管理项目中所有 GSAP 动画模式：
 *   - 入场动画（staggered entrance）
 *   - 页面过渡（card spring flip）
 *   - 弹性弹入/弹出（toast, panel）
 *   - 粒子庆祝（confetti burst）
 */
import gsap from 'gsap'

// ====== 全局 GSAP 配置 ======
gsap.defaults({
  overwrite: 'auto',
  duration: 0.4,
})

/** 检查 reduced-motion 偏好 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ====== Staggered 入场 ======

/** 子元素依次弹入 */
export function staggerEnter(
  container: HTMLElement | string,
  options?: {
    stagger?: number
    from?: gsap.TweenVars
    to?: gsap.TweenVars
  },
): gsap.core.Timeline {
  if (prefersReducedMotion()) {
    return gsap.timeline().set(container, { opacity: 1 })
  }

  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container
  if (!el) return gsap.timeline()

  const children = el.children
  if (children.length === 0) return gsap.timeline()

  const tl = gsap.timeline()

  tl.fromTo(children, {
    opacity: 0,
    y: 24,
    scale: 0.96,
    ...options?.from,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.5,
    stagger: options?.stagger ?? 0.08,
    ease: 'back.out(1.4)',
    ...options?.to,
  })

  return tl
}

// ====== 卡片翻页 ======

/** 卡片弹性进入 / 弹性退出 */
export function cardSpringIn(el: HTMLElement): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.set(el, { opacity: 1, x: 0, scale: 1 })
  }
  return gsap.fromTo(el, {
    opacity: 0,
    x: 80,
    scale: 0.88,
    rotateY: 8,
  }, {
    opacity: 1,
    x: 0,
    scale: 1,
    rotateY: 0,
    duration: 0.55,
    ease: 'elastic.out(1, 0.65)',
  })
}

export function cardSpringOut(el: HTMLElement): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.set(el, { opacity: 0 })
  }
  return gsap.to(el, {
    opacity: 0,
    x: -50,
    scale: 0.92,
    rotateY: -4,
    duration: 0.25,
    ease: 'power2.in',
  })
}

// ====== 弹性弹入/弹出 ======

/** 从右侧弹入（面板、侧栏） */
export function slideInRight(el: HTMLElement): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.set(el, { x: 0, opacity: 1 })
  }
  return gsap.fromTo(el, {
    x: '100%',
    opacity: 0,
  }, {
    x: '0%',
    opacity: 1,
    duration: 0.45,
    ease: 'power3.out',
  })
}

/** 向右滑出 */
export function slideOutRight(el: HTMLElement): gsap.core.Tween {
  return gsap.to(el, {
    x: '100%',
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
  })
}

/** 从底部弹入（Toast） */
export function bounceInUp(el: HTMLElement, index = 0): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.set(el, { opacity: 1, y: 0 })
  }
  return gsap.fromTo(el, {
    opacity: 0,
    y: 30,
    scale: 0.9,
  }, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration: 0.4,
    delay: index * 0.06,
    ease: 'back.out(2)',
  })
}

/** 淡入 */
export function fadeIn(el: HTMLElement, duration = 0.3): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.set(el, { opacity: 1 })
  }
  return gsap.fromTo(el, { opacity: 0 }, {
    opacity: 1,
    duration,
    ease: 'power2.out',
  })
}

// ====== 庆祝粒子 ======

/** 创建撒花粒子动画（返回清理函数） */
export function confettiBurst(
  container: HTMLElement,
  options?: { count?: number },
): () => void {
  if (prefersReducedMotion()) return () => {}

  const count = options?.count ?? 50
  const colors = ['#6366f1', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#a855f7', '#ef4444', '#f97316']
  const rect = container.getBoundingClientRect()
  const cx = rect.width / 2
  const cy = rect.height / 2
  const particles: HTMLDivElement[] = []

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div')
    const size = 4 + Math.random() * 8
    const color = colors[Math.floor(Math.random() * colors.length)]
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
    const velocity = 80 + Math.random() * 160

    Object.assign(particle.style, {
      position: 'absolute',
      width: `${size}px`,
      height: Math.random() > 0.5 ? `${size}px` : `${size * 0.4}px`,
      backgroundColor: color,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      left: `${cx}px`,
      top: `${cy}px`,
      pointerEvents: 'none',
      zIndex: '99',
      opacity: '0',
    })

    container.appendChild(particle)
    particles.push(particle)

    gsap.to(particle, {
      x: Math.cos(angle) * velocity,
      y: Math.sin(angle) * velocity - 30,
      opacity: 1,
      rotation: Math.random() * 720 - 360,
      duration: 0.3 + Math.random() * 0.2,
      ease: 'power2.out',
    })

    gsap.to(particle, {
      y: `+=${60 + Math.random() * 120}`,
      opacity: 0,
      scale: 0.3,
      duration: 0.8 + Math.random() * 0.4,
      delay: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        particle.remove()
      },
    })
  }

  // 清理函数
  return () => {
    for (const p of particles) {
      gsap.killTweensOf(p)
      p.remove()
    }
  }
}

// ====== 进度条 ======

/** 弹性进度条动画 */
export function elasticProgress(
  el: HTMLElement,
  progress: number, // 0-1
): gsap.core.Tween {
  return gsap.to(el, {
    scaleX: progress,
    duration: 0.6,
    ease: 'elastic.out(1, 0.6)',
    overwrite: 'auto',
  })
}

// ====== 数字弹跳 ======

/** 数字弹跳变化 */
export function bounceNumber(
  el: HTMLElement,
  _value: number,
): gsap.core.Tween {
  return gsap.fromTo(el, {
    scale: 0.5,
    opacity: 0,
  }, {
    scale: 1,
    opacity: 1,
    duration: 0.35,
    ease: 'back.out(2)',
  })
}

export { gsap }
