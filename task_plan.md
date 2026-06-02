# Task Plan: AI Explainer — 统一集成版

## Goal
将 "Neon Abyss" 设计壳 (jiaohu3) 与 Vue 3 AI 教程引擎 (jiaohu) 有机统一，创建一个兼具炫酷视觉和实用 AI 教学功能的完整 Web 应用。

## Current Phase
Phase 8 — 完成

## Phases

### Phase 1: 项目基座迁移
- [x] 将 jiaohu Vue 3 项目复制到 jiaohu3
- [x] 安装依赖 (npm install)
- [x] 保留壳的规划文档
- **Status:** complete

### Phase 2: Neon 主题系统
- [x] 扩展 tokens.css 增加 Neon Abyss 主题
- [x] 更新 Theme 类型增加 'neon'
- [x] 设 Neon 为默认主题
- [x] 补充 Orbitron 字体
- **Status:** complete

### Phase 3: 教育浏览模式 (ExploreMode)
- [x] 创建 ExploreMode.vue (章节导航 + 教育内容)
- [x] 创建 DigitDemo.vue (手写数字识别)
- [x] What is AI / How it Works / Key Concepts / Demo 全部实现
- [x] ScrollTrigger 滚动入场动画
- **Status:** complete

### Phase 4: 双模式入口
- [x] HeroSection 增加双入口 (了解 AI / AI 教学)
- [x] "了解 AI" → ExploreMode
- [x] "开始学习" → CardRenderer (保持原有流程)
- **Status:** complete

### Phase 5: App.vue 状态机
- [x] 增加 showExplore 状态
- [x] ExploreMode 可触发 AI 生成 (onStartLearning)
- [x] 概念卡片快捷入口全部配置
- **Status:** complete

### Phase 6: ThemeToggle 四主题
- [x] 扩展为 Neon/Light/Dark/Sepia 四主题循环
- **Status:** complete

### Phase 7: 构建验证
- [x] TypeScript 类型检查通过
- [x] Vite 生产构建成功
- **Status:** complete

## Key Questions
1. 默认主题用哪个？→ Neon (更吸睛)
2. 概念卡片点击后的行为？→ 触发 AI 生成对应教程
3. API Key 未配置时能否浏览教育内容？→ 可以 (ExploreMode 不需要 API)

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Neon 为默认主题 | 壳的设计是项目亮点，应当首屏展示 |
| ExploreMode 零依赖 API | 降低新用户体验门槛 |
| 概念卡片作为快捷入口 | 桥接教育内容与 AI 生成功能 |
| 保留四种主题 | 尊重原有三种主题的用户，Neon 作为新选项 |
| Tailwind 为主体样式系统 | 与原有核项目一致，降低维护成本 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| tokens.css regex 转义问题 | 1 | 直接重写完整文件 |
| tutorialStore 转义字符 | 1 | 修复 `\)` → `)` |
| Orbitron font link 格式 | 1 | 合并为单个 Google Fonts link |
