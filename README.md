# AI Explainer 🤖

一个基于 DeepSeek API 的 AI 交互式教程生成器，帮助用户通过 AI 生成个性化学习内容。

## ✨ 特性

- 📚 **智能教程生成**：输入任意学习概念，AI 自动生成结构化教程
- 🎯 **多种卡片类型**：支持文本、代码、图表、测验等多种教学形式
- 🗂️ **智能分类**：自动将教程按主题分组整理
- 💾 **本地存储**：所有数据存储在浏览器本地 IndexedDB
- 🔒 **OAuth 认证**：支持 Google 账号登录同步（可选）
- 🎨 **霓虹主题**：现代化的 UI 设计

## 🛠️ 技术栈

- **框架**: Vue 3 + Composition API
- **构建**: Vite 6
- **路由**: Vue Router 4
- **状态管理**: Pinia
- **数据库**: Dexie.js (IndexedDB)
- **UI**: Tailwind CSS 3
- **图表**: Mermaid
- **动画**: GSAP

## 🚀 快速开始

### 前置条件

- Node.js >= 20.x
- DeepSeek API Key（免费获取：[platform.deepseek.com](https://platform.deepseek.com/api_keys)）
- Supabase 账号（可选，用于 OAuth 登录）

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/ai-explainer.git
cd ai-explainer

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env
```

### 配置

编辑 `.env` 文件：

```env
# DeepSeek API 配置（必需）
VITE_DEEPSEEK_API_KEY=your-deepseek-api-key

# Supabase 配置（可选，用于 OAuth）
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 运行

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # UI 组件
│   ├── CardRenderer.vue # 卡片渲染器
│   ├── HeroSection.vue  # 首页英雄区
│   ├── FileBrowser.vue  # 文件浏览器
│   └── ...
├── views/               # 页面视图
│   ├── HomeView.vue     # 首页
│   ├── LearnView.vue    # 学习页面
│   ├── ExploreView.vue  # 探索页面
│   └── ...
├── stores/              # Pinia 状态管理
│   ├── authStore.ts     # 认证状态
│   └── tutorialStore.ts # 教程状态
├── services/            # 服务层
│   ├── deepseekApi.ts   # DeepSeek API 封装
│   ├── db.ts            # 数据库操作
│   └── supabase.ts      # Supabase 客户端
└── types/               # TypeScript 类型定义
```

## 📖 使用说明

1. **生成教程**：在首页输入学习概念（如"JavaScript 闭包"），点击开始学习
2. **浏览内容**：使用底部导航浏览不同类型的学习卡片
3. **保存教程**：点击"保存"按钮将教程存入本地数据库
4. **智能分类**：在文件管理中使用智能分类功能整理教程

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)
