# AI Explainer Pro — 教育平台重构设计

> 日期: 2026-05-31
> 状态: Draft
> 目标: 将 AI Explainer 从"AI 生成教程工具"重构为"数据驱动的 AI 学习平台"

## 1. 产品定位

**一句话**: AI 生成教程只是入口，学情数据才是护城河。

**目标用户**: 教育机构/学生，适配当代 AI 学习浪潮

**核心价值**:
- 学生: 个性化 AI 教程 + 知识图谱 + 薄弱点自动识别
- 教师: 班级管理 + 学情分析 + 可视化报告 + 自动预警

**壁垒逻辑**: 学习行为数据越积越厚 → 分析越精准 → 用户越离不开 → 竞品无法复制历史数据

## 2. 双角色体系

| 角色 | 能做什么 | 付费 |
|------|---------|------|
| 学生 | 浏览/搜索教程、AI 生成教程、做题、查看个人学习报告 | 免费（Pro ¥9/月） |
| 教师 | 创建班级、布置学习任务、查看班级学情分析、导出报告 | 免费试用 30 天 → Pro ¥49/月 |

## 3. 数据模型

### 3.1 Supabase Postgres 核心表

```sql
-- 用户档案
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users,
  role        text NOT NULL CHECK (role IN ('student', 'teacher')),
  display_name text,
  avatar_url  text,
  institution text,
  created_at  timestamptz DEFAULT now()
)

-- 班级
classrooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid REFERENCES profiles(id),
  name        text NOT NULL,
  invite_code text UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 6)),
  created_at  timestamptz DEFAULT now()
)

-- 班级成员
classroom_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  student_id  uuid REFERENCES profiles(id),
  joined_at   timestamptz DEFAULT now(),
  UNIQUE(classroom_id, student_id)
)

-- 学习任务
assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id uuid REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_id  uuid REFERENCES profiles(id),
  title       text NOT NULL,
  description text,
  concept     text,
  tutorial_id uuid,
  quiz_config jsonb,
  due_date    timestamptz,
  created_at  timestamptz DEFAULT now()
)

-- 学习行为记录（核心壁垒数据）
learning_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES profiles(id),
  tutorial_id uuid,
  assignment_id uuid REFERENCES assignments(id),
  page_index  int,
  time_spent  int DEFAULT 0,
  scroll_depth float DEFAULT 0,
  quiz_answers jsonb,
  difficulty_rating smallint CHECK (difficulty_rating BETWEEN 1 AND 5),
  understood  boolean,
  created_at  timestamptz DEFAULT now()
)

-- 知识节点
knowledge_nodes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text UNIQUE NOT NULL,
  parent_id   uuid REFERENCES knowledge_nodes(id),
  description text,
  created_at  timestamptz DEFAULT now()
)

-- 用户知识掌握度
user_knowledge (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES profiles(id),
  node_id     uuid REFERENCES knowledge_nodes(id),
  mastery     float DEFAULT 0 CHECK (mastery BETWEEN 0 AND 1),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(student_id, node_id)
)

-- 订阅
subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES profiles(id) UNIQUE,
  stripe_customer_id text,
  stripe_price_id    text,
  status      text DEFAULT 'free',
  current_period_end timestamptz,
  created_at  timestamptz DEFAULT now()
)
```

### 3.2 RLS 策略

- `profiles`: 用户只能读写自己的记录
- `learning_records`: 学生只能插入自己的记录；教师可查看自己班级内学生的记录
- `user_knowledge`: 学生只能读写自己的数据；教师可查看自己班级内学生的数据
- `classrooms`: 教师可 CRUD 自己的班级
- `classroom_members`: 教师可管理自己班级的成员；学生可加入班级
- `assignments`: 教师可 CRUD 自己的任务；学生可查看所属班级的任务

## 4. 学生端核心流程

### 4.1 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | 首页 | 学习入口 + API Key 配置 |
| `/explore` | AI 知识浏览 | 现有功能增强 |
| `/learn/:id` | 教程学习页 | 核心改动: 埋点采集 |
| `/quiz/:id` | 测验模式 | 独立强化 |
| `/profile` | 个人学习档案 | 学习统计 |
| `/knowledge-map` | 个人知识图谱 | 可视化薄弱点 |
| `/classroom/:code` | 加入班级 | 邀请码加入 |
| `/assignments` | 我的任务列表 | 教师布置的任务 |

### 4.2 学习行为采集

每页教程自动采集:
- `time_spent`: 页面停留时长（进入 → 离开）
- `scroll_depth`: 滚动深度百分比
- `quiz_result`: 测验题答对/答错/跳过

学生主动反馈:
- 每页底部 3 个按钮: 👍 理解了 / 🤔 还行 / 👎 没看懂
- 测验答错后弹出: "要不要 AI 再讲一遍这个知识点？"

采集时机:
- 页面切换时自动提交 `learning_record`
- 测验提交时记录完整答题数据
- 退出教程时冲刷最后一条记录

### 4.3 个人知识图谱

基于 `user_knowledge` 数据渲染:
- 节点 = 知识点，颜色深浅 = 掌握度（绿>0.7 / 黄0.4-0.7 / 红<0.4）
- 连线 = 知识点间的前置/后续关系
- 点击薄弱节点 → 一键生成针对性复习教程

### 4.4 任务系统

教师布置任务后学生端出现待完成列表:
- 显示任务名称、截止日期、完成状态
- 点击直接进入对应教程/测验
- 完成后自动标记，教师端实时更新

## 5. 教师端核心流程

### 5.1 页面路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/teacher` | 教师仪表盘 | 总览 |
| `/teacher/classrooms` | 班级管理 | 创建/管理班级 |
| `/teacher/classroom/:id` | 班级详情 | 成员、任务、学情 |
| `/teacher/assignment/new` | 创建学习任务 | 布置任务 |
| `/teacher/analytics/:classId` | 学情分析 | 核心付费功能 |
| `/teacher/reports` | 报告导出 | PDF 报告 |

### 5.2 教师仪表盘

登录后首页:
- 活跃班级数、学生总数
- 今日学习活跃度趋势线
- 待处理任务提醒
- 需要关注的学生预警

### 5.3 班级管理

- 创建班级 → 自动生成 6 位邀请码
- 学生通过邀请码加入
- 查看班级成员列表、在线状态

### 5.4 创建学习任务

教师选择:
1. 指定概念（如"闭包"）→ AI 自动生成教程
2. 指定已有教程（从教程库中选择）
3. 自定义测验（教师出题或 AI 生成）
4. 设置截止日期、是否强制完成

### 5.5 学情分析（核心付费功能）

层级 1 — 班级概览（免费教师可见）:
- 班级整体完成率
- 平均掌握度分数
- 任务完成进度

层级 2 — 知识点热力图（付费）:
- 每个知识点的班级平均掌握度
- 颜色编码: 绿>0.7 / 黄0.4-0.7 / 红<0.4
- 点击知识点 → 查看具体哪些学生掌握不足

层级 3 — 个体学情报告（付费）:
- 单个学生的知识图谱
- 学习时长趋势
- 薄弱点自动标记 + AI 建议干预措施
- 一键导出 PDF 报告

### 5.6 自动预警机制

- 连续 3 天未学习 → 标记"不活跃"
- 某知识点掌握度 < 0.3 → 标记"严重薄弱"
- 测验正确率 < 40% → 标记"需要帮助"
- 教师仪表盘红点提示

## 6. 盈利与付费机制

### 6.1 定价

| 层级 | 价格 | 包含功能 |
|------|------|---------|
| 学生（免费） | ¥0 | 无限浏览、AI 生成每日 5 次、做题、个人知识图谱 |
| 学生 Pro | ¥9/月 | 无限 AI 生成、导出报告、优先高级模型 |
| 教师（免费试用） | ¥0 × 30天 | 1 个班级、最多 30 学生、基础学情概览 |
| 教师 Pro | ¥49/月 | 无限班级、无限学生、完整学情分析、报告导出、预警 |
| 教师团队 | ¥199/月 | 5 教师账号 + 共享班级 + 团队数据面板 |

### 6.2 付费触发点

学生端:
- 每日 AI 生成第 6 次时弹出升级提示
- 导出报告按钮点击后提示 Pro
- 知识图谱中"AI 推荐复习"高级功能提示 Pro

教师端:
- 创建第 2 个班级时提示升级
- 点击"知识点热力图"时提示升级
- 导出 PDF 报告时提示升级
- 试用到期前 3 天倒计时提醒

### 6.3 支付集成

- Stripe Checkout: 处理订阅和一次性付款
- Stripe Customer Portal: 用户自助管理订阅
- Webhook: 监听支付事件，更新 Supabase 订阅状态

## 7. 技术架构

### 7.1 整体架构

```
Vue 3 + Vite 前端
├── 学生端 (学习/测验/知识图谱)
├── 教师端 (仪表盘/学情分析/报告)
└── 共享组件 (认证/主题/通知)
    │
    └── Supabase JS Client
        │
Supabase 后端
├── Auth (邮箱/GitHub/Google)
├── Postgres (数据存储 + RLS)
├── Edge Functions (学情计算/报告生成)
├── Realtime (实时通知)
└── Storage (文件存储)
    │
外部服务
├── DeepSeek API (教程生成)
└── Stripe (支付)
```

### 7.2 前端目录结构

```
src/
├── views/
│   ├── auth/              # 登录、注册、回调
│   ├── student/           # 学生端页面
│   └── teacher/           # 教师端页面
├── components/
│   ├── shared/            # 共享组件
│   ├── student/           # 学生专用组件
│   └── teacher/           # 教师专用组件
├── composables/
│   ├── useAuth.ts
│   ├── useLearningTracker.ts  # 学习行为采集
│   ├── useKnowledgeGraph.ts   # 知识图谱计算
│   └── useSubscription.ts     # 付费状态
├── stores/
│   ├── authStore.ts
│   ├── tutorialStore.ts
│   └── subscriptionStore.ts
├── services/
│   ├── supabase.ts
│   ├── db.ts              # Supabase DB 操作
│   ├── deepseekApi.ts
│   └── stripe.ts          # Stripe 集成
├── router/
│   └── index.ts           # 含角色路由守卫
├── types/
│   └── index.ts
└── styles/
```

### 7.3 Edge Functions

- `compute-knowledge`: 学生完成教程后触发，重新计算知识点掌握度
- `generate-report`: 教师请求报告时触发，聚合班级数据生成 PDF
- `check-alerts`: 定时任务，检测预警条件并通知教师

### 7.4 实时功能

- 教师仪表盘实时更新学生在线状态
- 任务完成时教师端即时通知
- 班级内学习进度实时同步

## 8. 分阶段交付

### Phase 1: 基础平台（2 周）
- Supabase 数据库 + RLS
- 双角色注册/登录
- 学生端: 教程学习 + 行为采集
- 教师端: 班级管理 + 基础仪表盘

### Phase 2: 学情系统（2 周）
- 知识掌握度计算
- 学生知识图谱
- 教师学情分析（热力图 + 个体报告）
- 自动预警

### Phase 3: 商业化（1 周）
- Stripe 集成
- 付费墙 + 触发点
- 订阅管理

### Phase 4: 增强（持续）
- 任务系统
- PDF 报告导出
- 高级 AI 模型选项
- 教师团队协作
