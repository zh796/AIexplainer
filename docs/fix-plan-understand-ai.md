# "了解AI" 功能 — 问题诊断与修复方案

**日期:** 2026-05-31
**范围:** 与"了解AI"教育浏览功能相关的所有组件
**目标:** 系统性修复所有已发现的问题，提升用户体验和代码质量

---

## 一、功能概述

"了解AI"是 AI Explainer 应用的教育浏览模式，入口在 HeroSection 的左侧卡片（🔍 了解 AI）。点击后进入 ExploreMode 组件，展示4个章节的结构化 AI 科普内容：

| 章节 | ID | 内容 |
|------|-----|------|
| 第一章 | ch-what-is-ai | 什么是AI：核心定义、发展简史、三种层级、AI vs 人类、常见误解 |
| 第二章 | ch-how-works | 工作原理：数据→训练→推理流水线、神经网络层结构 |
| 第三章 | ch-concepts | 四大核心概念：ML、DL、NLP、CV（卡片翻转效果） |
| 第四章 | ch-demo | 互动演示：手写数字识别 DigitDemo |

双层导航栏实时反映滚动位置，每章末尾有"让 AI 深入讲解"按钮桥接到 DeepSeek API 教程生成。

---

## 二、已发现问题清单

### P0 — 阻断性问题

#### 2.1 Theme 类型重复定义
**文件:** `src/types/index.ts:30`
```typescript
// 当前（错误）：
export type Theme = 'light' | 'dark' | 'sepia' | 'neon' | 'dark' | 'sepia'
// 'dark' 和 'sepia' 各出现了两次
```
**影响:** TypeScript 联合类型中重复成员虽然不报错，但表明代码经过了多次不完整的编辑，是代码质量的危险信号。

**修复:**
```typescript
export type Theme = 'light' | 'dark' | 'sepia' | 'neon'
```

#### 2.2 HeroSection "AI 教学" 卡片点击无响应
**文件:** `src/components/HeroSection.vue:140`
```html
<!-- 当前（无操作）： -->
<button @click="() => {}" ...>
  <h3>AI 教学</h3>
  <p>输入任何概念，AI 即时生成结构化教程...</p>
  <span>下方输入 →</span>
</button>
```
**影响:** 用户点击右侧"AI 教学"卡片完全没有任何反应。虽然下方有输入框，但卡片自身作为 CTA 区域却无法交互，用户体验断裂。

**修复:** 点击该卡片时，聚焦到下方的 concept 输入框，提升可发现性。

---

### P1 — 功能缺陷

#### 2.3 ExploreMode ScrollTrigger 导航高亮状态问题
**文件:** `src/components/ExploreMode.vue:78-98`

当前实现给每个 chapter 和 sub 创建了 ScrollTrigger：
```typescript
// 当前代码（第78-87行）：
chapters.forEach((ch) => {
  const st = ScrollTrigger.create({
    trigger: el, start: 'top 20%', end: 'bottom 20%',
    onEnter: () => { activeChapter.value = ch.id },
    onEnterBack: () => { activeChapter.value = ch.id },
  })
})
```

**问题:**
1. 未设置 `toggleActions`，默认行为是 `onEnter` 只在进入时触发一次，离开后再进入不会重新触发。
2. 当页面初次加载并滚动到非第一章位置时，初始状态 `activeChapter = 'ch-what-is-ai'` 但实际滚动位置可能已在第三章，导致导航栏高亮与实际内容不一致。
3. 子章节的 ScrollTrigger（第88-98行）同样存在 toggleActions 缺失问题。
4. 未适配 `prefers-reduced-motion`，与其他组件不一致。

**修复:**
1. 添加 `toggleActions: 'play none none reverse'`
2. 在 `onMounted` 末尾添加初始滚动位置检测，手动设置正确的 activeChapter 和 activeSub
3. 合并两个 forEach 循环为一个，减少 DOM 遍历

#### 2.4 ExploreMode 无 API Key 时的按钮行为
**文件:** `src/components/ExploreMode.vue`（多处"开始学习"按钮）

页面中有 ~8 个 "让 AI 深入讲解" 按钮：
- 导航栏右上角 "🚀 开始学习"
- 每章末尾的 "🔍 让 AI 深入讲解更多细节"
- 第四章底部 "🔍 AI 深入讲解神经网络"
- 页面底部 "🚀 开始 AI 学习之旅"

所有这些按钮都直接调用 `emit('start-learning', concept)`，最终在 App.vue 中触发 `store.startGeneration()`。但 **`startGeneration()` 在 `apiKey` 为空时直接 return**（`tutorialStore.ts:55`），用户点击后毫无反应。

**影响:** 未配置 API Key 的用户（这是 ExploreMode 的主要受众——零门槛浏览）点击这些按钮后会感到困惑——什么都没发生。

**修复方案:**
在 ExploreMode 中接收 `apiKey` 状态，当未配置时点击按钮弹出 Toast 提示引导用户先配置 API Key，或直接跳转到 API Key 输入页面。

#### 2.5 HeroSection 表单提交前缺少校验
**文件:** `src/components/HeroSection.vue:59-64`

```typescript
function handleSubmitClick(): void {
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  triggerWave(rect.width / 2, rect.height / 2)
  store.startGeneration()
}
```

`store.startGeneration()` 在 `conceptInput` 为空或 `apiKey` 为空时直接 return，用户得不到任何反馈。

**修复:** 提交前检查这两个条件，通过 Toast 给出明确提示。

---

### P2 — 体验优化

#### 2.6 DigitDemo 手写数字识别太过随机
**文件:** `src/components/DigitDemo.vue:106-140`

```typescript
const scores = digits.map((d) => {
  let score = Math.random() * 0.3  // 基础分完全随机！
  // 只对 0、1、8 有简单的启发式判断
  ...
})
```

**问题:**
1. `Math.random() * 0.3` 作为基础分的随机性过高，即使画出完美的"1"，也可能因随机波动被识别成其他数字。
2. 只对数字 0、1、8 有启发式规则，其他 7 个数字（2、3、4、5、6、7、9）完全靠随机。
3. Softmax 归一化使结果看起来"合理"但实际不准确。

**影响:** 教育演示的核心功能失去了可信度，用户会发现无论画什么都不准，削弱了对 AI 的信任感。

**修复:**
1. 降低随机噪声从 `0.3` 到 `0.08`
2. 为更多数字添加启发式规则：
   - 数字 7：上方水平分布高 + 垂直方向集中在上半部
   - 数字 3：双弧线结构（像素中心密度高 + 中段密度高）
   - 数字 4：垂直交叉结构（左右分布）
   - 数字 2/5：曲线结构
   - 数字 6/9：闭环结构（与 0 类似但有方向性）
3. 对未画内容的情况给出更友好的占位提示

#### 2.7 DigitDemo Canvas resize 导致像素错位
**文件:** `src/components/DigitDemo.vue:24-32`

```typescript
function setupCanvas() {
  const size = Math.min(canvas.parentElement!.clientWidth - 16, 400)
  canvas.width = size
  canvas.height = size
  canvasW = size
  drawGrid()
}
```

**问题:** 窗口 resize 后 `setupCanvas` 重新计算画布大小并调用 `drawGrid()`。但 `pixelData` 数组保持不变（28×28 固定），只是每个像素的渲染尺寸改变了。这本身是正确的——但 `setupCanvas` 重置了 `canvas.width/height`，这会清空画布，然后 `drawGrid()` 重新从 `pixelData` 渲染。然而，`canvas.width = size` (line 29) **会清空画布**，但 `pixelData` 保留，所以重绘应该能正确还原。

实际检查：代码逻辑是正确的。resize 时 pixelData 保持不变（固定28×28），drawGrid 重新按新尺寸渲染。这不是 bug。

但有一个边缘问题：`setupCanvas` 中 `ctx = canvas.getContext('2d')!` 在每次 resize 时重新获取 context，这是多余的（canvas resize 不会使 context 失效）。

**修复:** 移除重复的 `getContext` 调用，在 `onMounted` 中只获取一次。

#### 2.8 TextCard Markdown 渲染器代码块与粗体冲突
**文件:** `src/components/TextCard.vue:22-34`

```typescript
function renderContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    // ... 
    .replace(/`([^`]+)`/g, '<code>...$1...</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // ...
}
```

**问题:** 替换顺序是 `code` 在 `bold` 之前，这是正确的（code 中的 `**` 不会被替换）。但正则 `/\*\*(.+?)\*\*/g` 使用非贪婪匹配，当一行中有多个粗体段落时，`.+?` 仍然会在第一个 `**` 和接下来的 `**` 之间匹配过多内容——特别是当内容包含 `*` 字符或嵌套模式时。

更严重的问题：`renderContent` 函数中的 HTML 转义先执行（`&amp;`, `&lt;`, `&gt;`），但后续的 markdown 替换会用 HTML 标签替换——这本身没问题。真正的问题是：
- `\n\n+` 段落分割在 `paragraphs` computed 中进行，但 `renderContent` 处理的是单个段落
- 代码块没有保护机制：如果 AI 在普通文本中输出 `**粗体` 中间有代码 `` `code` ``，backtick 内的内容会被渲染为 `<code>` 标签，然后 `**` 不会被匹配（因为在标签内）。这部分逻辑实际上没问题。

深入检查后发现潜在问题：`\*\*(.+?)\*\*` 在 content 包含未转义的 `*` 字面量时会出问题。但 AI 被 prompt 训练过只输出 `**` 作为粗体标记，所以这个风险较低。

**修复:** 增加代码块保护（在替换其他标记前先提取并保护 code span），确保代码块中的内容完全不被后续正则修改。

---

### P3 — 代码质量

#### 2.9 useFluidCanvas composable 生命周期反模式
**文件:** `src/composables/useFluidCanvas.ts`

这个 composable 在内部直接调用了 `onMounted` 和 `onUnmounted`：
```typescript
export function useFluidCanvas(canvasRef, options) {
  // ...
  onMounted(() => {
    resize()
    initParticles()
    // ...
  })
  onUnmounted(() => { /* cleanup */ })
  return { mouseX, mouseY, isHovering, triggerWave }
}
```

**问题:** 按照 Vue 3 约定，composable 中的 `onMounted` 会绑定到**调用该 composable 的组件**的生命周期。这在当前场景下能正常工作（HeroSection 调用了 `useFluidCanvas`），但如果：
1. 在 `setup()` 外部调用
2. 在条件分支中调用（如 `if (someCondition) useFluidCanvas(...)`）
3. 在异步回调中调用

就会导致生命周期错乱或内存泄漏。

**修复:** 将 `onMounted`/`onUnmounted` 的调用移到组件层面，composable 只返回 `init()` 和 `destroy()` 函数。

---

## 三、修复执行计划

### 第一步：修复类型定义（P0）
- [ ] `src/types/index.ts` — 移除 Theme 重复成员

### 第二步：修复 HeroSection（P0 + P1）
- [ ] `src/components/HeroSection.vue` — AI 教学卡片聚焦输入框
- [ ] `src/components/HeroSection.vue` — 表单提交前校验 + Toast 提示

### 第三步：修复 ExploreMode（P1）
- [ ] `src/components/ExploreMode.vue` — ScrollTrigger toggleActions
- [ ] `src/components/ExploreMode.vue` — 无 API Key 时的按钮行为
- [ ] `src/components/ExploreMode.vue` — 初始滚动位置检测

### 第四步：修复 DigitDemo（P2）
- [ ] `src/components/DigitDemo.vue` — 改进启发式分类算法
- [ ] `src/components/DigitDemo.vue` — 优化 Canvas resize

### 第五步：修复 TextCard（P2 + P3）
- [ ] `src/components/TextCard.vue` — 代码块保护

### 第六步：修复 useFluidCanvas（P3）
- [ ] `src/composables/useFluidCanvas.ts` — 生命周期重构

### 第七步：验证
- [ ] `npm run build` — TypeScript 类型检查 + Vite 生产构建
- [ ] 手动测试完整流程

---

## 四、预期效果

修复完成后，"了解AI"功能应当：
1. ✅ 类型定义干净无重复
2. ✅ Hero 双模式卡片均可交互
3. ✅ 导航栏高亮始终与阅读位置一致
4. ✅ 未配置 API Key 时点击"开始学习"有友好提示
5. ✅ 表单提交有输入校验和反馈
6. ✅ 手写数字识别更准确、更有教育意义
7. ✅ Canvas resize 不产生视觉闪烁
8. ✅ Markdown 渲染在边界情况下正确
9. ✅ Composable 生命周期管理清晰
