# Findings & Decisions — AI Explainer 统一集成版

## 项目融合发现

### 两个项目的互补性
- **壳 (jiaohu3)**: 美学优秀，教育内容完整，但无实际 AI 功能
- **核 (jiaohu)**: 功能强大（DeepSeek API + 流式生成 + 多种卡片类型 + 本地存储），但界面保守
- **融合策略**: 核为功能底座的 Vue 3 SPA + 壳的设计语言作为新增主题 + 壳的教育内容作为新增模式

### 技术关键发现
- Vue 3 + Tailwind v4 可以无缝承载壳的 CSS 变量体系
- GSAP ScrollTrigger 需要通过 gsap/ScrollTrigger 子路径导入
- tokens.css 中的 CSS 变量通过 Tailwind @theme 自动映射为 utility class
- 四主题系统比原三主题更具灵活性

## 架构决策
| Decision | Rationale |
|----------|-----------|
| 以 Vue 3 为基底 | 核的功能复杂度需要 SPA 框架 |
| 设计语言作为主题层 | 低耦合，不影响现有三种主题 |
| 教育内容作为 ExploreMode | 独立状态分支，不影响原有 CardRenderer |
| 双 Canvas 统一为 useFluidCanvas | 避免两个粒子系统竞争性能 |
| 概念卡片 → AI 生成桥接 | 教育内容与 AI 功能的有机连接 |
| IndexedDB (Dexie) 保留 | 强大的本地存储能力 |

## 技术栈
| 层级 | 技术 | 用途 |
|------|------|------|
| 框架 | Vue 3 + TypeScript | 组件化 UI |
| 构建 | Vite 8 + Rolldown | 快速 HMR + 生产构建 |
| 样式 | Tailwind CSS v4 + CSS Variables | 四主题设计系统 |
| 动画 | GSAP 3.15 + ScrollTrigger | 入场/过渡/滚动动画 |
| API | DeepSeek Chat API (SSE) | AI 流式教程生成 |
| 图表 | Mermaid 11 | 代码→图表渲染 |
| 存储 | Dexie (IndexedDB) | 本地教程存储 |
| 字体 | Orbitron + JetBrains Mono + Inter | 展示 + 正文 |

## 新增文件
| 文件 | 说明 |
|------|------|
| ExploreMode.vue | 教育浏览模式容器 (4章节 + DigitDemo) |
| DigitDemo.vue | 手写数字识别交互组件 |
| tokens.css (更新) | 增加 Neon 主题，四主题系统 |

## 修改文件
| 文件 | 变更 |
|------|------|
| App.vue | 增加 explore 状态分支 |
| HeroSection.vue | 双模式入口 (了解 AI / 开始学习) |
| ThemeToggle.vue | 四主题循环 |
| types/index.ts | Theme 类型扩展 |
| tutorialStore.ts | 默认主题改为 neon |
| index.html | 增加 Orbitron 字体 |
