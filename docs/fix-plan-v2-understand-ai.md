# "了解AI" 功能 — 第二版深度修复方案

**日期:** 2026-05-31
**范围:** ExploreMode 滚动动画、Mermaid 图表渲染、教育内容可视化多样化

---

## 一、三大核心问题的根因分析

### 问题 1: 滚动加载内容不连续 ⭐ 核心根因

**症状:** 用户向下滚动时，内容（带 `.reveal` class 的元素）不会在进入视口时动画显示，部分内容始终不可见。

**根因:** `ScrollTrigger` 的 `scroller` 参数缺失！

```typescript
// src/components/ExploreMode.vue 当前代码
const st = ScrollTrigger.create({
  trigger: el,
  start: 'top 85%',        // ← 相对于哪个滚动容器？
  onEnter: () => gsap.to(el, { opacity: 1, y: 0, ... }),
})
```

**技术细节:**
- ExploreMode 的内容在 `<div ref="exploreRef" class="overflow-y-auto">` 内滚动
- 页面的 `body` 设置了 `overflow: hidden`（见 `base.css:12`）
- GSAP ScrollTrigger **默认监听 `window`/`document` 的滚动**
- 但在这个应用中，**window 从不滚动**！滚动发生在 `exploreRef` 这个 div 内部
- 因此 ScrollTrigger 的 `onEnter` 回调永远不会触发
- 所有 `.reveal` 元素保持 `opacity:0; transform:translateY(...)` 的初始状态

**修复:**
```typescript
const st = ScrollTrigger.create({
  trigger: el,
  start: 'top 85%',
  scroller: exploreRef.value,  // ← 关键！指定实际的滚动容器
  onEnter: () => gsap.to(el, { opacity: 1, y: 0, ... }),
})
```

对所有 ScrollTrigger 实例（入场动画 + 章节/子章节跟踪）都需要添加 `scroller`。

---

### 问题 2: Mermaid 图表文字渲染问题

**根因分析 — 三个层面:**

#### 2a. Neon 主题没有 Mermaid 颜色方案
```typescript
// mermaidThemes.ts — resolveVars()
export function resolveVars(): MermaidVars {
  const t = document.documentElement.getAttribute('data-theme') || 'dark'
  switch (t) {
    case 'light': return lightVars     // ✅ 有
    case 'sepia': return sepiaVars     // ✅ 有
    default:      return darkVars      // ← neon 回落到了 dark！
  }
}
```

Neon 是**默认主题**，但 Mermaid 渲染时使用的是 darkVars（深色主题色板），与 Neon 的 cyan/magenta/amber 设计语言完全不匹配。

#### 2b. Mermaid SVG 文字颜色由 `themeVariables` 控制
当主题为 `neon` 但 Mermaid 用 `darkVars` 时：
- `textColor: '#E5E7EB'` — 浅灰，在 neon 的 #0a0a0f 背景上可见
- `lineColor: '#475569'` — 灰蓝，在 neon 的 cyan 边框/连线下显得暗淡
- `primaryColor: '#3B82F6'` — 蓝色，而非 neon 的 cyan #00f0ff
- `nodeBorder: '#334155'` — 深灰，在 neon 主题下缺乏发光感

#### 2c. Mermaid 的 `htmlLabels: true` 配置问题
当 `htmlLabels: true` 时，Mermaid 节点文字会继承页面 CSS 变量（如 `color: var(--color-fg)`），这在 light 主题下可能导致深色文字显示在浅色背景上时出现问题。

**修复策略:**
1. 添加完整的 `neonVars` Mermaid 主题
2. 在 `resolveVars()` 中添加 `neon` case
3. 将 `htmlLabels` 切换到 `false`（以避免页面 CSS 变量干涉 SVG 内文字），或确保节点背景色和文字色始终配对

---

### 问题 3: 图表功能和形式单一

**现状:** ExploreMode 中的可视化内容只有:
- 2 个手写 SVG（神经网络节点图 + 层结构图）
- 1 个 CSS 时间线
- 3D CSS flip 卡片（核心概念）
- DigitDemo Canvas

**缺失的能力:**
- 没有 Mermaid 实时渲染的流程图/时序图
- 没有数据可视化（训练曲线、参数对比等）
- 没有交互动画图表
- 没有 GSAP 动画驱动的 SVG 演示

**补充方案:**
1. 在教学内容中嵌入 Mermaid 渲染图表（利用已有 `renderDiagram` 基础设施）
2. 添加 GSAP 动画驱动的教学 SVG（如用 DrawSVGPlugin 绘制神经网络连线动画）
3. 添加简单的数据可视化组件（柱状图、折线图用于对比模型性能）
4. 用 ScrollTrigger 驱动 SVG 动画（如神经元信号传播动画）

---

## 二、修复方案 — 分步实施

### Step 1: 修复 ScrollTrigger scroller (P0)
**文件:** `src/components/ExploreMode.vue`
**改动:**
- 所有 `ScrollTrigger.create()` 调用添加 `scroller: exploreRef.value`
- 章节/子章节跟踪器的 `start`/`end` 调整以适配容器内滚动

### Step 2: 添加 Neon Mermaid 主题 (P1)
**文件:** `src/services/mermaidThemes.ts`
**改动:**
- 添加 `neonVars` 完整主题变量（cyan #00f0ff / magenta #ff00e5 / amber #ffb800）
- 在 `resolveVars()` 中匹配 `neon` 到 `neonVars`

### Step 3: 丰富图表内容 (P1)
**文件:** `src/components/ExploreMode.vue`（或新建 `src/components/ChartEmbed.vue`）
**改动:**
- 添加可复用的 Mermaid 图表嵌入组件
- 在"工作原理"章节嵌入训练流程 Mermaid 图
- 在"神经网络"章节用 GSAP DrawSVG 动画展示信号传播
- 添加模型对比柱状图组件

### Step 4: 集成 GSAP ScrollSmoother (P2)
**文件:** `src/composables/useGsap.ts` + `src/components/ExploreMode.vue`
**改动:**
- 创建 `useScrollSmoother` composable
- 在 ExploreMode 中启用平滑滚动
- 添加 parallax 视差效果到章节标题

### Step 5: 构建验证
- TypeScript 类型检查 + Vite 生产构建

---

## 三、预期效果

| 问题 | 修复前 | 修复后 |
|------|--------|--------|
| 滚动动画 | 内容不可见，动画不触发 | 丝滑入场动画，章节导航实时跟踪 |
| Mermaid 图表文字 | Neon 主题下图表颜色错乱 | Neon 专用色板，cyan/magenta/amber 配色 |
| 图表多样性 | 仅2个手写SVG + CSS时间线 | Mermaid实时渲染 + GSAP动画SVG + 数据可视化 |
| 滚动体验 | 原生滚动，无平滑过渡 | ScrollSmoother 平滑滚动 + 视差效果 |
