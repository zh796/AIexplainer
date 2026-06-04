<script setup lang="ts">
/**
 * ExploreMode v2 — 结构化 AI 教育浏览模式
 * 二级导航：章节 → 子章节，导航栏实时反映阅读位置
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { gsap } from '../composables/useGsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useTutorialStore } from '../stores/tutorialStore'
import { useToast } from '../composables/useToast'
import DigitDemo from './DigitDemo.vue'
import ChartEmbed from './ChartEmbed.vue'

gsap.registerPlugin(ScrollTrigger)

const emit = defineEmits<{
  (e: 'start-learning', concept: string): void
  (e: 'back-home'): void
}>()

const store = useTutorialStore()
const toast = useToast()

interface SubSection { id: string; label: string }
interface Chapter { id: string; label: string; icon: string; subs: SubSection[] }

const chapters: Chapter[] = [
  {
    id: 'ch-what-is-ai', label: '什么是 AI', icon: '🧠',
    subs: [
      { id: 'sub-definition', label: '核心定义' },
      { id: 'sub-history', label: '发展简史' },
      { id: 'sub-levels', label: '三种层级' },
      { id: 'sub-vs-human', label: 'AI vs 人类' },
      { id: 'sub-myths', label: '常见误解' },
    ],
  },
  {
    id: 'ch-how-works', label: '工作原理', icon: '⚙️',
    subs: [
      { id: 'sub-pipeline', label: '数据→训练→推理' },
      { id: 'sub-neuron', label: '神经网络的秘密' },
    ],
  },
  {
    id: 'ch-concepts', label: '核心概念', icon: '📚',
    subs: [
      { id: 'sub-ml', label: '机器学习' },
      { id: 'sub-dl', label: '深度学习' },
      { id: 'sub-nlp', label: '自然语言处理' },
      { id: 'sub-cv', label: '计算机视觉' },
    ],
  },
  { id: 'ch-demo', label: '互动演示', icon: '🎮', subs: [] },
]

const activeChapter = ref('ch-what-is-ai')
const activeSub = ref('sub-definition')
const exploreRef = ref<HTMLElement | null>(null)
let scrollTriggers: ScrollTrigger[] = []

const currentSubs = computed(() => {
  const ch = chapters.find(c => c.id === activeChapter.value)
  return ch?.subs ?? []
})

function scrollTo(id: string) {
  const target = document.getElementById(id)
  const scroller = exploreRef.value
  if (!target || !scroller) return
  // GSAP 驱动平滑滚动 — 比原生 scrollIntoView 更流畅可控
  gsap.to(scroller, {
    scrollTop: target.offsetTop - 100,
    duration: 0.7,
    ease: 'power2.inOut',
  })
}
function scrollToChapter(id: string) {
  activeChapter.value = id
  const target = document.getElementById(id)
  const scroller = exploreRef.value
  if (!target || !scroller) return
  gsap.to(scroller, {
    scrollTop: target.offsetTop - 80,
    duration: 0.7,
    ease: 'power2.inOut',
  })
}

onMounted(() => {
  const scroller = exploreRef.value
  if (!scroller) return

  // ====== 入场动画（关键修复：scroller 必须指向实际滚动容器） ======
  const revealEls = scroller.querySelectorAll('.reveal')
  revealEls.forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      scroller,
      onEnter: () => gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.55,
        ease: 'power3.out',
        overwrite: 'auto',
      }),
      onEnterBack: () => gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.35,
        ease: 'power2.out',
        overwrite: 'auto',
      }),
    })
    scrollTriggers.push(st)
  })

  // ====== 章节过渡顿挫动画 ======
  // 每个章节标题在进入视口中心时缩放弹入，产生"到位"的节奏感
  scroller.querySelectorAll('.chapter-header').forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 60%',
      scroller,
      onEnter: () => gsap.fromTo(el, {
        scale: 0.92, opacity: 0.6,
      }, {
        scale: 1, opacity: 1,
        duration: 0.7,
        ease: 'elastic.out(1, 0.7)',
        overwrite: 'auto',
      }),
      onEnterBack: () => gsap.fromTo(el, {
        scale: 0.92, opacity: 0.6,
      }, {
        scale: 1, opacity: 1,
        duration: 0.5,
        ease: 'back.out(1.2)',
        overwrite: 'auto',
      }),
    })
    scrollTriggers.push(st)
  })

  // ====== 章节分隔线发光脉冲 ======
  scroller.querySelectorAll('.section-divider').forEach((el) => {
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top 70%',
      scroller,
      onEnter: () => gsap.fromTo(el, {
        opacity: 0.2, scaleX: 0.3,
      }, {
        opacity: 1, scaleX: 1,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto',
      }),
    })
    scrollTriggers.push(st)
  })

  // ====== 章节 + 子章节滚动跟踪 ======
  for (const ch of chapters) {
    const chEl = document.getElementById(ch.id)
    if (chEl) {
      const st = ScrollTrigger.create({
        trigger: chEl,
        start: 'top 18%',
        end: 'bottom 20%',
        scroller,
        onEnter: () => { activeChapter.value = ch.id },
        onEnterBack: () => { activeChapter.value = ch.id },
      })
      scrollTriggers.push(st)
    }

    for (const sub of ch.subs) {
      const subEl = document.getElementById(sub.id)
      if (!subEl) continue
      const st = ScrollTrigger.create({
        trigger: subEl,
        start: 'top 30%',
        end: 'bottom 30%',
        scroller,
        onEnter: () => { activeSub.value = sub.id },
        onEnterBack: () => { activeSub.value = sub.id },
      })
      scrollTriggers.push(st)
    }
  }

  // ====== 初始滚动位置检测 ======
  nextTick(() => {
    const scrollY = scroller.scrollTop
    if (scrollY > 50) {
      for (let i = chapters.length - 1; i >= 0; i--) {
        const el = document.getElementById(chapters[i].id)
        if (!el) continue
        const containerRect = scroller.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        // 相对于滚动容器的位置
        const relativeTop = elRect.top - containerRect.top
        if (relativeTop < containerRect.height * 0.5) {
          activeChapter.value = chapters[i].id
          for (let j = chapters[i].subs.length - 1; j >= 0; j--) {
            const subEl = document.getElementById(chapters[i].subs[j].id)
            if (!subEl) continue
            const subRelativeTop = subEl.getBoundingClientRect().top - containerRect.top
            if (subRelativeTop < containerRect.height * 0.5) {
              activeSub.value = chapters[i].subs[j].id
              break
            }
          }
          break
        }
      }
    }
  })
})

onUnmounted(() => { scrollTriggers.forEach(st => st.kill()) })
function onStartLearning(concept: string) {
  if (!store.state.apiKey) {
    toast.warning('请先在首页配置 DeepSeek API Key，然后即可让 AI 为你生成互动教程')
    return
  }
  emit('start-learning', concept)
}
</script>
<template>
  <div ref="exploreRef" class="flex-1 overflow-y-auto relative z-10">

    <!-- ====== 双层导航栏（分层设计） ====== -->
    <nav class="sticky top-0 z-20 bg-bg/95 backdrop-blur-lg border-b border-border shadow-sm">
      <!-- 一级：章节导航 — 四按钮均分铺满 -->
      <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5">
        <button @click="emit('back-home')" class="btn-ghost text-xs py-1.5 px-2.5 shrink-0">← 首页</button>
        <div class="flex-1 grid grid-cols-4 gap-2">
          <button v-for="ch in chapters" :key="ch.id" @click="scrollToChapter(ch.id)"
            :class="[ 'text-xs sm:text-[13px] whitespace-nowrap px-2 py-1.5 rounded-lg transition-all duration-300 font-medium text-center',
              activeChapter === ch.id
                ? 'bg-primary/15 text-primary shadow-[0_0_8px_rgba(0,240,255,0.12)]'
                : 'text-fg-subtle hover:text-fg hover:bg-bg-elevated' ]"
          ><span class="mr-1">{{ ch.icon }}</span>{{ ch.label }}</button>
        </div>
        <button @click="onStartLearning('')" class="btn-primary text-xs py-1.5 px-3.5 shrink-0 rounded-lg hidden sm:inline-flex">🚀 开始学习</button>
      </div>
      <!-- 二级：子章节导航 — 均分铺满 -->
      <div
        v-if="currentSubs.length > 0"
        class="flex justify-around gap-1 px-3 sm:px-6 py-2 border-t-2 border-primary/10 overflow-x-auto bg-bg-elevated/40 backdrop-blur-sm"
      >
        <button v-for="sub in currentSubs" :key="sub.id" @click="scrollTo(sub.id)"
          :class="[ 'text-[11px] sm:text-xs whitespace-nowrap px-3 py-1.5 rounded-full transition-all duration-300 flex-1 text-center',
            activeSub === sub.id
              ? 'bg-primary text-primary-fg font-semibold shadow-[0_2px_8px_rgba(0,240,255,0.25)] scale-105'
              : 'text-fg-muted hover:text-fg hover:bg-bg-card/80' ]"
        >{{ sub.label }}</button>
      </div>
    </nav>

    <main class="w-full max-w-2xl mx-auto px-6 sm:px-10 pt-8 pb-16 sm:pt-12 sm:pb-20">

      <!-- ================================================================ -->
      <!-- 第一章：什么是人工智能 -->
      <!-- ================================================================ -->
      <section :id="chapters[0].id" class="pb-32">
        <div class="text-center mb-10 reveal chapter-header" style="opacity:0;transform:translateY(30px)">
          <span class="text-xs tracking-[0.3em] text-accent font-semibold uppercase">第一章</span>
          <h2 class="text-3xl sm:text-4xl font-bold mt-2 text-fg" style="font-family:var(--font-display,inherit)">什么是<span class="text-primary">人工智能</span>？</h2>
          <p class="text-fg-muted text-sm mt-3 leading-relaxed">从核心概念到发展历程，系统理解 AI 的全貌</p>
        </div>

        <!-- 1.1 核心定义 -->
        <div :id="chapters[0].subs[0].id" class="mb-20 scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">人工智能的核心定义</h3>
          </div>
          <div class="space-y-4">
            <p class="reveal text-fg-muted leading-relaxed text-sm sm:text-base text-center" style="opacity:0;transform:translateY(15px)">人工智能（Artificial Intelligence，简称 AI）是计算机科学的一个分支，致力于创造能够<strong class="text-primary">模拟人类智能</strong>的系统。这些系统能够感知环境、理解语言、学习知识、进行推理，并据此做出决策。</p>
            <p class="reveal text-fg-muted leading-relaxed text-sm sm:text-base text-center" style="opacity:0;transform:translateY(15px)">用一句话概括：<span class="text-accent font-semibold">AI = 让机器做人需要智力才能做的事情。</span>这里的智能涵盖多个维度——逻辑推理、知识表示、规划、自然语言理解、感知以及物体操控等。</p>
            <p class="reveal text-fg-muted leading-relaxed text-sm sm:text-base text-center" style="opacity:0;transform:translateY(15px)">现代 AI 的核心驱动力量是<span class="text-warning font-semibold">数据 + 算法 + 算力</span>。海量数据提供学习素材，精巧算法定义学习方式，强大算力支撑计算规模——三者缺一不可。</p>
          </div>
          <div class="reveal flex items-center justify-center mt-6" style="opacity:0;transform:translateY(20px)">
            <svg viewBox="0 0 320 260" class="w-full max-w-[300px] h-auto">
              <g stroke="currentColor" stroke-width="0.6" class="text-primary/20">
                <line x1="30" y1="50" x2="130" y2="30"/><line x1="30" y1="50" x2="130" y2="80"/><line x1="30" y1="50" x2="130" y2="130"/>
                <line x1="30" y1="130" x2="130" y2="30"/><line x1="30" y1="130" x2="130" y2="80"/><line x1="30" y1="130" x2="130" y2="130"/><line x1="30" y1="130" x2="130" y2="180"/>
                <line x1="30" y1="210" x2="130" y2="80"/><line x1="30" y1="210" x2="130" y2="130"/><line x1="30" y1="210" x2="130" y2="180"/>
                <line x1="130" y1="30" x2="240" y2="80"/><line x1="130" y1="30" x2="240" y2="160"/>
                <line x1="130" y1="80" x2="240" y2="80"/><line x1="130" y1="80" x2="240" y2="160"/>
                <line x1="130" y1="130" x2="240" y2="80"/><line x1="130" y1="130" x2="240" y2="160"/>
                <line x1="130" y1="180" x2="240" y2="80"/><line x1="130" y1="180" x2="240" y2="160"/>
              </g>
              <g fill="currentColor">
                <circle cx="30" cy="50" r="7" class="text-primary" opacity="0.9"/><text x="12" y="54" fill="currentColor" class="text-fg-muted" font-size="9">输入</text>
                <circle cx="30" cy="130" r="7" class="text-primary" opacity="0.9"/>
                <circle cx="30" cy="210" r="7" class="text-primary" opacity="0.9"/>
                <circle cx="130" cy="30" r="7" class="text-accent" opacity="0.9"/><text x="100" y="23" fill="currentColor" class="text-fg-subtle" font-size="8">隐藏层</text>
                <circle cx="130" cy="80" r="7" class="text-accent" opacity="0.9"/>
                <circle cx="130" cy="130" r="7" class="text-accent" opacity="0.9"/>
                <circle cx="130" cy="180" r="7" class="text-accent" opacity="0.9"/>
                <circle cx="240" cy="80" r="7" class="text-warning" opacity="0.9"/><text x="250" y="83" fill="currentColor" class="text-fg-muted" font-size="9">输出</text>
                <circle cx="240" cy="160" r="7" class="text-warning" opacity="0.9"/>
              </g>
            </svg>
          </div>
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12 section-divider" />

        <!-- 1.2 发展简史 -->
        <div :id="chapters[0].subs[1].id" class="mb-20 scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">人工智能发展简史</h3>
          </div>
          <div class="relative pl-6 border-l-2 border-primary/20 space-y-6 reveal" style="opacity:0;transform:translateY(20px)">
            <div class="relative"><div class="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-bg"/><span class="text-xs text-primary font-semibold tracking-wider">1950 年代</span><h4 class="text-sm font-bold text-fg mt-1">图灵测试与达特茅斯会议</h4><p class="text-xs text-fg-muted mt-1 leading-relaxed">艾伦·图灵发表《计算机器与智能》，提出机器能思考吗的著名问题。1956 年达特茅斯会议正式确立人工智能这一学科名称。</p></div>
            <div class="relative"><div class="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg"/><span class="text-xs text-accent font-semibold tracking-wider">1960-70 年代</span><h4 class="text-sm font-bold text-fg mt-1">专家系统与第一次 AI 寒冬</h4><p class="text-xs text-fg-muted mt-1 leading-relaxed">基于规则的专家系统在特定领域取得成功，但由于算力不足和期望过高，在 70 年代中期遭遇第一次 AI 寒冬——研究经费大幅削减。</p></div>
            <div class="relative"><div class="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-warning border-2 border-bg"/><span class="text-xs text-warning font-semibold tracking-wider">1980-90 年代</span><h4 class="text-sm font-bold text-fg mt-1">机器学习崛起与第二次寒冬</h4><p class="text-xs text-fg-muted mt-1 leading-relaxed">反向传播算法使神经网络重新成为研究热点。统计学习方法（SVM、贝叶斯等）开始崭露头角。但 LISP 机器市场崩溃再次导致行业低谷。</p></div>
            <div class="relative"><div class="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-bg"/><span class="text-xs text-primary font-semibold tracking-wider">2010 年代</span><h4 class="text-sm font-bold text-fg mt-1">深度学习革命</h4><p class="text-xs text-fg-muted mt-1 leading-relaxed">GPU 算力 + 大数据 + 深度神经网络 = 爆发式突破。2012 年 AlexNet 在图像识别比赛中大胜。AlphaGo 在 2016 年击败围棋世界冠军李世石。</p></div>
            <div class="relative"><div class="absolute -left-[29px] top-1 w-3.5 h-3.5 rounded-full bg-accent border-2 border-bg"/><span class="text-xs text-accent font-semibold tracking-wider">2020 年代</span><h4 class="text-sm font-bold text-fg mt-1">大模型时代</h4><p class="text-xs text-fg-muted mt-1 leading-relaxed">GPT 系列、Claude、Gemini 等大语言模型实现质的飞跃。AI 不仅能识别分类，还能生成文本、图像、代码和音乐。生成式 AI 走向大众。</p></div>
          </div>
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12 section-divider" />

        <!-- 1.3 三种层级 -->
        <div :id="chapters[0].subs[2].id" class="mb-20 scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">AI 的三种层级</h3>
          </div>
          <div class="grid sm:grid-cols-3 gap-4 justify-items-center">
            <div class="reveal rounded-xl p-5 bg-bg-card border border-border hover:border-primary/50 transition-colors" style="opacity:0;transform:translateY(25px)">
              <div class="text-2xl mb-2">🎯</div><h4 class="text-sm font-bold text-primary mb-2">弱人工智能 (ANI)</h4>
              <p class="text-xs text-fg-muted leading-relaxed mb-2">Artificial Narrow Intelligence</p>
              <div class="inline-block px-2 py-0.5 rounded text-[10px] bg-success/15 text-success font-medium mb-2">已实现 ✓</div>
              <p class="text-xs text-fg-muted leading-relaxed">在特定任务上超越人类的 AI。如语音助手、推荐算法、围棋 AI。它们在一个领域表现出色，但无法将能力迁移到其他领域。</p>
              <p class="text-xs text-fg-subtle mt-2 italic">示例：Siri、AlphaGo、ChatGPT</p>
            </div>
            <div class="reveal rounded-xl p-5 bg-bg-card border border-accent/20 hover:border-accent/50 transition-colors" style="opacity:0;transform:translateY(25px)">
              <div class="text-2xl mb-2">🌟</div><h4 class="text-sm font-bold text-accent mb-2">强人工智能 (AGI)</h4>
              <p class="text-xs text-fg-muted leading-relaxed mb-2">Artificial General Intelligence</p>
              <div class="inline-block px-2 py-0.5 rounded text-[10px] bg-warning/15 text-warning font-medium mb-2">研发中 🔬</div>
              <p class="text-xs text-fg-muted leading-relaxed">具备与人类同等水平的通用智能。能理解、学习和应用知识解决任何问题，像人类一样灵活适应各种新任务。</p>
              <p class="text-xs text-fg-subtle mt-2 italic">这是当前 AI 研究的圣杯</p>
            </div>
            <div class="reveal rounded-xl p-5 bg-bg-card border border-border hover:border-warning/50 transition-colors" style="opacity:0;transform:translateY(25px)">
              <div class="text-2xl mb-2">🚀</div><h4 class="text-sm font-bold text-warning mb-2">超人工智能 (ASI)</h4>
              <p class="text-xs text-fg-muted leading-relaxed mb-2">Artificial Superintelligence</p>
              <div class="inline-block px-2 py-0.5 rounded text-[10px] bg-fg-subtle/15 text-fg-subtle font-medium mb-2">理论阶段 💭</div>
              <p class="text-xs text-fg-muted leading-relaxed">在所有领域远超人类最聪明大脑的智能。一旦实现，可能引发技术奇点——人类文明将发生不可逆转的根本性改变。</p>
              <p class="text-xs text-fg-subtle mt-2 italic">科幻作品中常见的超级 AI</p>
            </div>
          </div>
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12 section-divider" />

        <!-- 1.4 AI vs 人类智能 -->
        <div :id="chapters[0].subs[3].id" class="mb-20 scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">AI 智能 vs 人类智能</h3>
          </div>
          <div class="reveal overflow-x-auto" style="opacity:0;transform:translateY(20px)">
            <table class="w-full text-xs sm:text-sm">
              <thead><tr class="border-b border-border"><th class="text-left py-3 pr-4 text-fg-muted font-medium">对比维度</th><th class="text-left py-3 px-4 text-primary font-semibold">🤖 人工智能</th><th class="text-left py-3 pl-4 text-warning font-semibold">🧑 人类智能</th></tr></thead>
              <tbody class="text-fg-muted">
                <tr class="border-b border-border/50"><td class="py-2.5 pr-4 font-medium text-fg">处理速度</td><td class="py-2.5 px-4">毫秒级，可并行处理海量数据</td><td class="py-2.5 pl-4">受生物神经元速度限制</td></tr>
                <tr class="border-b border-border/50"><td class="py-2.5 pr-4 font-medium text-fg">学习方式</td><td class="py-2.5 px-4">需要海量标注数据，统计模式匹配</td><td class="py-2.5 pl-4">少量样本即可泛化，理解因果关系</td></tr>
                <tr class="border-b border-border/50"><td class="py-2.5 pr-4 font-medium text-fg">创造力</td><td class="py-2.5 px-4">基于已有数据重组，非真正原创</td><td class="py-2.5 pl-4">可凭空创造全新概念与艺术</td></tr>
                <tr class="border-b border-border/50"><td class="py-2.5 pr-4 font-medium text-fg">情感与意识</td><td class="py-2.5 px-4">无真实情感，仅模拟情绪表达</td><td class="py-2.5 pl-4">拥有自我意识和丰富情感体验</td></tr>
                <tr class="border-b border-border/50"><td class="py-2.5 pr-4 font-medium text-fg">常识推理</td><td class="py-2.5 px-4">缺乏对物理世界的直觉理解</td><td class="py-2.5 pl-4">天然具备常识和直觉判断力</td></tr>
                <tr><td class="py-2.5 pr-4 font-medium text-fg">能耗</td><td class="py-2.5 px-4">训练大模型需兆瓦级电力</td><td class="py-2.5 pl-4">大脑仅约 20 瓦，极度高效</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12 section-divider" />

        <!-- 1.5 常见误解 -->
        <div :id="chapters[0].subs[4].id" class="scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold shrink-0">5</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">关于 AI 的常见误解</h3>
          </div>
          <div class="grid sm:grid-cols-2 gap-4 justify-items-center">
            <div class="reveal rounded-xl p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><div class="flex gap-3"><span class="text-error text-lg shrink-0">✕</span><div><p class="text-sm font-semibold text-fg">AI 会拥有自我意识</p><p class="text-xs text-fg-muted mt-1 leading-relaxed">目前的 AI 完全不具备意识。它们是基于统计的<strong class="text-primary">模式匹配系统</strong>，既不理解自己在做什么，也没有主观感受。</p></div></div></div>
            <div class="reveal rounded-xl p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><div class="flex gap-3"><span class="text-error text-lg shrink-0">✕</span><div><p class="text-sm font-semibold text-fg">AI 将取代所有人类工作</p><p class="text-xs text-fg-muted mt-1 leading-relaxed">AI 擅长<strong class="text-accent">自动化重复性任务</strong>，但难以替代需要创造力、同理心和复杂决策的工作。更可能的是人机协作。</p></div></div></div>
            <div class="reveal rounded-xl p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><div class="flex gap-3"><span class="text-error text-lg shrink-0">✕</span><div><p class="text-sm font-semibold text-fg">AI 总是客观公正的</p><p class="text-xs text-fg-muted mt-1 leading-relaxed">AI 模型会<strong class="text-warning">继承训练数据中的偏见</strong>。如果数据包含种族、性别等偏见，模型输出也会反映这些偏见。</p></div></div></div>
            <div class="reveal rounded-xl p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><div class="flex gap-3"><span class="text-error text-lg shrink-0">✕</span><div><p class="text-sm font-semibold text-fg">数据越多 AI 就越强</p><p class="text-xs text-fg-muted mt-1 leading-relaxed">数据的<strong class="text-primary">质量</strong>远比数量重要。噪声大、标注错误的数据只会让模型学到错误模式。垃圾进，垃圾出。</p></div></div></div>
          </div>
          <div class="reveal pt-6 text-center" style="opacity:0;transform:translateY(15px)"><button @click="onStartLearning('什么是人工智能')" class="btn-primary text-sm px-6 py-2.5">🔍 让 AI 深入讲解更多细节</button></div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 第二章：工作原理 -->
      <!-- ================================================================ -->
      <section :id="chapters[1].id" class="pb-32 scroll-mt-32">
        <div class="text-center mb-10 reveal chapter-header" style="opacity:0;transform:translateY(30px)">
          <span class="text-xs tracking-[0.3em] text-accent font-semibold uppercase">第二章</span>
          <h2 class="text-3xl sm:text-4xl font-bold mt-2 text-fg" style="font-family:var(--font-display,inherit)">AI 的<span class="text-accent">工作原理</span></h2>
        </div>

        <!-- 2.1 -->
        <div :id="chapters[1].subs[0].id" class="mb-20 scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">数据 → 训练 → 推理：AI 的三步流水线</h3>
          </div>
          <div class="grid sm:grid-cols-3 gap-4 sm:gap-5 justify-items-center">
            <div class="reveal rounded-xl p-5 bg-bg-card border border-border hover:border-primary/50 transition-colors" style="opacity:0;transform:translateY(30px)">
              <div class="text-3xl font-bold text-primary/15 mb-3" style="font-family:var(--font-display,inherit)">01</div>
              <h4 class="font-semibold text-primary mb-2 text-sm">数据收集与预处理</h4>
              <p class="text-xs text-fg-muted leading-relaxed">收集百万级样本，清洗噪声、标注类别、归一化数值。数据的多样性和质量是模型性能的天花板。</p>
              <div class="mt-3 flex gap-2 flex-wrap"><span class="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">清洗</span><span class="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">标注</span><span class="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary">归一化</span></div>
            </div>
            <div class="reveal rounded-xl p-5 bg-bg-card border border-border hover:border-accent/50 transition-colors" style="opacity:0;transform:translateY(30px)">
              <div class="text-3xl font-bold text-accent/15 mb-3" style="font-family:var(--font-display,inherit)">02</div>
              <h4 class="font-semibold text-accent mb-2 text-sm">模型训练</h4>
              <p class="text-xs text-fg-muted leading-relaxed">反复迭代：前向传播做预测 → 计算损失（误差）→ 反向传播更新参数。每次迭代让模型更接近正确答案。大型模型可能训练数周甚至数月。</p>
              <div class="mt-3 flex gap-2 flex-wrap"><span class="px-2 py-0.5 rounded text-[10px] bg-accent/10 text-accent">前向传播</span><span class="px-2 py-0.5 rounded text-[10px] bg-accent/10 text-accent">损失函数</span><span class="px-2 py-0.5 rounded text-[10px] bg-accent/10 text-accent">梯度下降</span></div>
            </div>
            <div class="reveal rounded-xl p-5 bg-bg-card border border-border hover:border-warning/50 transition-colors" style="opacity:0;transform:translateY(30px)">
              <div class="text-3xl font-bold text-warning/15 mb-3" style="font-family:var(--font-display,inherit)">03</div>
              <h4 class="font-semibold text-warning mb-2 text-sm">推理与应用</h4>
              <p class="text-xs text-fg-muted leading-relaxed">训练好的模型接收新输入，快速输出预测结果。这一阶段算力需求远低于训练。从 ChatGPT 对话到医学影像诊断，都属于推理阶段。</p>
              <div class="mt-3 flex gap-2 flex-wrap"><span class="px-2 py-0.5 rounded text-[10px] bg-warning/10 text-warning">实时响应</span><span class="px-2 py-0.5 rounded text-[10px] bg-warning/10 text-warning">泛化能力</span></div>
            </div>
          </div>

          <!-- 训练流水线 Mermaid 图（LR 横向全景，清晰展示全流程） -->
          <ChartEmbed
            type="mermaid"
            caption="AI 训练流水线全景"
            :scroller="exploreRef"
            :definition="`flowchart LR
  A[📦 原始数据] --> B[🔧 清洗预处理]
  B --> C[🏷️ 数据标注]
  C --> D[📊 特征工程]
  D --> E[🧠 模型训练]
  E -->|损失收敛| F[✅ 模型评估]
  F -->|精度达标| G[🚀 部署上线]
  G --> H[📈 在线监控]
  E -.->|未收敛,继续训练| E
  F -.->|未达标,调整特征| D`"
          />

          <!-- 训练 vs 推理对比柱状图 -->
          <ChartEmbed
            type="bar"
            caption="模型训练 vs 推理阶段资源对比"
            :scroller="exploreRef"
            :barData="[
              { label: '训练-GPU显存', value: 80, color: '#00f0ff' },
              { label: '推理-GPU显存', value: 8, color: '#ff00e5' },
              { label: '训练-耗时(时)', value: 168, color: '#00f0ff' },
              { label: '推理-耗时(毫秒)', value: 50, color: '#ff00e5' },
              { label: '训练-能耗(kWh)', value: 1500, color: '#ffb800' },
              { label: '推理-能耗(Wh)', value: 0.5, color: '#a855f7' },
            ]"
          />
        </div>

        <div class="h-px bg-gradient-to-r from-transparent via-border to-transparent my-12 section-divider" />

        <!-- 2.2 神经网络的秘密 -->
        <div :id="chapters[1].subs[1].id" class="scroll-mt-32 w-full">
          <div class="reveal flex items-center justify-center gap-3 mb-5" style="opacity:0;transform:translateY(20px)">
            <span class="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <h3 class="text-lg sm:text-xl font-bold text-fg">神经网络的秘密：层、权重与激活</h3>
          </div>
          <div class="grid md:grid-cols-2 gap-8 items-center justify-items-center">
            <div class="space-y-3">
              <div class="reveal rounded-lg p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><h4 class="text-sm font-semibold text-primary mb-1">🔹 输入层</h4><p class="text-xs text-fg-muted leading-relaxed">接收原始数据。对于图像，每个像素是一个输入节点；对于文本，每个词或字符是一个输入。</p></div>
              <div class="reveal rounded-lg p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><h4 class="text-sm font-semibold text-accent mb-1">🔹 隐藏层</h4><p class="text-xs text-fg-muted leading-relaxed">网络的核心——每一层学习越来越抽象的特征：第一层学边缘，第二层学形状，第三层学物体部件……层数越多，能学到的概念越复杂。</p></div>
              <div class="reveal rounded-lg p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><h4 class="text-sm font-semibold text-warning mb-1">🔹 输出层</h4><p class="text-xs text-fg-muted leading-relaxed">产生最终结果。分类任务输出各类别概率，回归任务输出连续数值，生成任务输出序列。</p></div>
              <div class="reveal rounded-lg p-4 bg-bg-card border border-border" style="opacity:0;transform:translateY(15px)"><h4 class="text-sm font-semibold text-fg mb-1">🔹 权重与激活函数</h4><p class="text-xs text-fg-muted leading-relaxed"><strong class="text-primary">权重</strong>决定每个连接的强度——模型学习的就是这些权重值。<strong class="text-accent">激活函数</strong>（如 ReLU）引入非线性，让网络能学习复杂模式而不仅仅是线性组合。</p></div>
            </div>
            <div class="reveal flex items-center justify-center" style="opacity:0;transform:translateY(20px)">
              <svg viewBox="0 0 280 280" class="w-full max-w-[240px] h-auto">
                <rect x="10" y="130" width="60" height="70" rx="8" fill="none" stroke="currentColor" class="text-primary/30" stroke-width="1" stroke-dasharray="4"/><text x="40" y="170" text-anchor="middle" fill="currentColor" class="text-fg-subtle" font-size="8">输入层</text>
                <rect x="100" y="130" width="60" height="70" rx="8" fill="none" stroke="currentColor" class="text-accent/30" stroke-width="1" stroke-dasharray="4"/><text x="130" y="170" text-anchor="middle" fill="currentColor" class="text-fg-subtle" font-size="8">隐藏层</text>
                <rect x="210" y="130" width="60" height="70" rx="8" fill="none" stroke="currentColor" class="text-warning/30" stroke-width="1" stroke-dasharray="4"/><text x="240" y="170" text-anchor="middle" fill="currentColor" class="text-fg-subtle" font-size="8">输出层</text>
                <g fill="currentColor"><circle cx="35" cy="45" r="5" class="text-primary"/><circle cx="35" cy="85" r="5" class="text-primary"/><circle cx="35" cy="120" r="5" class="text-primary"/><circle cx="140" cy="35" r="5" class="text-accent"/><circle cx="140" cy="75" r="5" class="text-accent"/><circle cx="140" cy="105" r="5" class="text-accent"/><circle cx="140" cy="135" r="5" class="text-accent"/><circle cx="245" cy="75" r="5" class="text-warning"/><circle cx="245" cy="105" r="5" class="text-warning"/></g>
                <g stroke="currentColor" stroke-width="0.3" class="text-primary/12"><line x1="40" y1="45" x2="135" y2="35"/><line x1="40" y1="45" x2="135" y2="75"/><line x1="40" y1="45" x2="135" y2="105"/><line x1="40" y1="85" x2="135" y2="35"/><line x1="40" y1="85" x2="135" y2="75"/><line x1="40" y1="85" x2="135" y2="105"/><line x1="40" y1="85" x2="135" y2="135"/><line x1="40" y1="120" x2="135" y2="75"/><line x1="40" y1="120" x2="135" y2="105"/><line x1="40" y1="120" x2="135" y2="135"/></g>
                <g stroke="currentColor" stroke-width="0.3" class="text-accent/12"><line x1="145" y1="35" x2="240" y2="75"/><line x1="145" y1="35" x2="240" y2="105"/><line x1="145" y1="75" x2="240" y2="75"/><line x1="145" y1="75" x2="240" y2="105"/><line x1="145" y1="105" x2="240" y2="75"/><line x1="145" y1="105" x2="240" y2="105"/><line x1="145" y1="135" x2="240" y2="75"/><line x1="145" y1="135" x2="240" y2="105"/></g>
              </svg>
            </div>
          </div>
          <!-- 神经网络架构 Mermaid 图 -->
          <ChartEmbed
            type="mermaid"
            caption="典型深度神经网络架构"
            :scroller="exploreRef"
            :definition="`graph TD
  subgraph 输入层
    I1[像素1] --- H1
    I2[像素2] --- H1
    I3[像素...] --- H1
    I4[像素784] --- H4
  end
  subgraph 隐藏层1-边缘检测
    H1[神经元1]
    H2[神经元2]
    H3[神经元...]
    H4[神经元128]
  end
  subgraph 隐藏层2-形状识别
    H1 --- G1[神经元1]
    H2 --- G2[神经元2]
    H3 --- G3[神经元...]
    H4 --- G4[神经元64]
  end
  subgraph 隐藏层3-部件组装
    G1 --- F1[神经元1]
    G2 --- F2[神经元2]
    G3 --- F3[神经元...]
    G4 --- F4[神经元32]
  end
  subgraph 输出层
    F1 --- O1[0]
    F2 --- O2[1]
    F3 --- O3[...]
    F4 --- O4[9]
  end`"
          />

          <div class="reveal pt-6 text-center" style="opacity:0;transform:translateY(15px)"><button @click="onStartLearning('神经网络工作原理')" class="btn-primary text-sm px-6 py-2.5">🔍 让 AI 深入讲解神经网络</button></div>
        </div>
      </section>

      <!-- ================================================================ -->
      <!-- 第三章：核心概念 -->
      <!-- ================================================================ -->
      <section :id="chapters[2].id" class="pb-32 scroll-mt-32 w-full">
        <div class="text-center mb-10 reveal chapter-header" style="opacity:0;transform:translateY(30px)">
          <span class="text-xs tracking-[0.3em] text-accent font-semibold uppercase">第三章</span>
          <h2 class="text-3xl sm:text-4xl font-bold mt-2 text-fg" style="font-family:var(--font-display,inherit)">四大<span class="text-warning">核心概念</span></h2>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 justify-items-center">
          <div :id="chapters[2].subs[0].id" class="scroll-mt-32"><div class="reveal group perspective-800 h-56" style="opacity:0;transform:translateY(30px)"><div class="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"><div class="absolute inset-0 rounded-xl bg-bg-card border border-border flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden]"><span class="text-3xl mb-2">🧠</span><h3 class="text-sm font-semibold text-primary">机器学习</h3><p class="text-xs text-fg-subtle mt-1">Machine Learning</p></div><div class="absolute inset-0 rounded-xl bg-bg-elevated border border-primary flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md"><p class="text-xs text-fg-muted leading-relaxed">算法通过经验自动改进——从数据中学习规律，无需为每种情况显式编程。</p><p class="text-[10px] text-fg-subtle mt-2 italic">监督学习 · 无监督学习 · 强化学习</p></div></div></div></div>
          <div :id="chapters[2].subs[1].id" class="scroll-mt-32"><div class="reveal group perspective-800 h-56" style="opacity:0;transform:translateY(30px)"><div class="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"><div class="absolute inset-0 rounded-xl bg-bg-card border border-border flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden]"><span class="text-3xl mb-2">🔗</span><h3 class="text-sm font-semibold text-primary">深度学习</h3><p class="text-xs text-fg-subtle mt-1">Deep Learning</p></div><div class="absolute inset-0 rounded-xl bg-bg-elevated border border-primary flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md"><p class="text-xs text-fg-muted leading-relaxed">多层神经网络逐层提取特征——从边缘到形状再到完整物体，层层抽象。</p><p class="text-[10px] text-fg-subtle mt-2 italic">CNN · RNN · Transformer</p></div></div></div></div>
          <div :id="chapters[2].subs[2].id" class="scroll-mt-32"><div class="reveal group perspective-800 h-56" style="opacity:0;transform:translateY(30px)"><div class="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"><div class="absolute inset-0 rounded-xl bg-bg-card border border-border flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden]"><span class="text-3xl mb-2">💬</span><h3 class="text-sm font-semibold text-primary">自然语言处理</h3><p class="text-xs text-fg-subtle mt-1">NLP</p></div><div class="absolute inset-0 rounded-xl bg-bg-elevated border border-primary flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md"><p class="text-xs text-fg-muted leading-relaxed">让机器理解并生成人类语言——支撑着聊天机器人、翻译和文本分析。</p><p class="text-[10px] text-fg-subtle mt-2 italic">LLM · 情感分析 · 机器翻译</p></div></div></div></div>
          <div :id="chapters[2].subs[3].id" class="scroll-mt-32"><div class="reveal group perspective-800 h-56" style="opacity:0;transform:translateY(30px)"><div class="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]"><div class="absolute inset-0 rounded-xl bg-bg-card border border-border flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden]"><span class="text-3xl mb-2">👁</span><h3 class="text-sm font-semibold text-primary">计算机视觉</h3><p class="text-xs text-fg-subtle mt-1">Computer Vision</p></div><div class="absolute inset-0 rounded-xl bg-bg-elevated border border-primary flex flex-col items-center justify-center p-4 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-md"><p class="text-xs text-fg-muted leading-relaxed">让机器看见并理解图像——应用于人脸识别、医学影像和自动驾驶。</p><p class="text-[10px] text-fg-subtle mt-2 italic">目标检测 · 图像分割 · GAN</p></div></div></div></div>
        </div>
        <div class="flex flex-wrap justify-center gap-2 mt-8 reveal" style="opacity:0;transform:translateY(15px)">
          <button @click="onStartLearning('机器学习入门教程')" class="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">机器学习入门 →</button>
          <button @click="onStartLearning('深度学习原理详解')" class="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">深度学习原理 →</button>
          <button @click="onStartLearning('自然语言处理详解')" class="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">NLP 详解 →</button>
          <button @click="onStartLearning('计算机视觉入门')" class="px-3 py-1.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors">计算机视觉 →</button>
        </div>

        <!-- AI 模型参数规模对比柱状图 -->
        <ChartEmbed
          type="bar"
          caption="代表性 AI 模型参数规模对比（单位：亿参数）"
          :scroller="exploreRef"
          :barData="[
            { label: 'AlexNet\n(2012)', value: 0.6, color: '#00f0ff' },
            { label: 'ResNet-50\n(2015)', value: 0.25, color: '#ff00e5' },
            { label: 'BERT\n(2018)', value: 3.4, color: '#ffb800' },
            { label: 'GPT-3\n(2020)', value: 1750, color: '#a855f7' },
            { label: 'GPT-4\n(2023)', value: 18000, color: '#00f0ff' },
            { label: 'Claude 4\n(2026)', value: 27000, color: '#ff00e5' },
          ]"
          :barMax="30000"
        />
      </section>

      <!-- ================================================================ -->
      <!-- 第四章：互动演示 -->
      <!-- ================================================================ -->
      <section :id="chapters[3].id" class="pb-20 scroll-mt-32 w-full">
        <div class="text-center mb-8 reveal" style="opacity:0;transform:translateY(30px)">
          <span class="text-xs tracking-[0.3em] text-accent font-semibold uppercase">第四章</span>
          <h2 class="text-3xl sm:text-4xl font-bold mt-2 text-fg" style="font-family:var(--font-display,inherit)">互动<span class="text-primary">演示</span></h2>
          <p class="text-fg-muted text-sm mt-2">亲自体验：手写数字识别——神经网络最经典的入门案例</p>
        </div>
        <DigitDemo @start-learning="onStartLearning" />
      </section>

      <!-- 底部引导 -->
      <div class="text-center pt-16 pb-8 reveal w-full" style="opacity:0;transform:translateY(20px)">
        <p class="text-fg-muted text-sm mb-4">准备好深入学习了吗？输入 DeepSeek API Key，让 AI 为你生成任何概念的互动教程。</p>
        <button @click="onStartLearning('')" class="btn-primary text-base px-8 py-3 rounded-xl">🚀 开始 AI 学习之旅</button>
      </div>

    </main>
  </div>
</template>

<style scoped>
.perspective-800 { perspective: 800px; }
</style>
