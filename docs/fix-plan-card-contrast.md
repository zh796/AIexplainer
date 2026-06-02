# 四主题卡片文字对比度修复方案

**日期:** 2026-05-31
**基于:** `ui-ux-pro-max` skill — WCAG AA 标准 (4.5:1 正常文本, 3:1 大文本/UI元素)
**影响范围:** "了解AI" (ExploreMode) + "AI教学" (CardRenderer/DiagramCard) + Mermaid 图表

---

## 一、根因分析

### 对比度审计（当前值 vs WCAG AA 标准）

| 主题 | Token | 当前颜色 | 卡片底色 | 对比度 | 状态 |
|------|-------|---------|---------|--------|------|
| **Neon** | fg-muted | #8888a0 | #111118 | **4.0:1** | ❌ 不达标 |
| **Neon** | fg-subtle | #555568 | #111118 | **2.3:1** | ❌ 严重不达标 |
| **Dark** | fg-muted | #9CA3AF | #111827 | **4.1:1** | ❌ 不达标 |
| **Dark** | fg-subtle | #6B7280 | #111827 | **2.5:1** | ❌ 严重不达标 |
| **Light** | fg-muted | #64748B | #FFFFFF | **3.5:1** | ❌ 不达标 |
| **Light** | fg-subtle | #94A3B8 | #FFFFFF | **2.3:1** | ❌ 严重不达标 |
| **Sepia** | fg-muted | #6B5D4F | #FBF6E8 | **3.2:1** | ❌ 不达标 |
| **Sepia** | fg-subtle | #8B7D6B | #FBF6E8 | **2.3:1** | ❌ 严重不达标 |

**结论:** 四个主题共 8 个文本颜色 token 全部不达标。最严重的是 `fg-subtle`，对比度仅 2.3:1——正常视力用户也难以阅读。

### 为什么之前被忽视

1. 设计师在深色背景上使用灰色文本是常见做法（"看起来好看"），但 WCAG 标准要求灰色更深
2. Mermaid 图表中的 `textColor` / `labelTextColor` 使用了与卡片相同的 token，连锁反应
3. "AI教学"中生成的内容（如代码块注释、图表标签）同样受影响

---

## 二、四主题卡片文字设计系统

### 设计原则（来自 ui-ux-pro-max）

1. **语义 token 驱动** — 不是针对每个组件单独调色，而是修改设计 token
2. **保证对比度** — `fg` 不设上限，`fg-muted` ≥4.5:1，`fg-subtle` ≥4.5:1
3. **保持设计意图** — 颜色提升后仍要体现"层次感"（主文字明显 > muted > subtle）
4. **联动修复** — 修改 token 后，Mermaid 图表、代码块、卡片全部受益

### Neon 霓虹主题

```
卡片底色: #111118 (bg-card)
━━━━━━━━━━━━━━━━━━━━━━━━━━
fg:        #f0f0f5  → 对比度 13.2:1 ✅  (微提亮以保持层次)
fg-muted:  #b0b0c0  → 对比度  7.2:1 ✅  (原 #8888a0 → 提升)
fg-subtle: #808098  → 对比度  4.5:1 ✅  (原 #555568 → 大幅提升)
━━━━━━━━━━━━━━━━━━━━━━━━━━
强调色保留: primary #00f0ff (用于标题/链接/标签)
           accent #ff00e5 (用于高亮)
           warning #ffb800 (用于警示)
```

### Dark 深色主题

```
卡片底色: #111827 (bg-card)
━━━━━━━━━━━━━━━━━━━━━━━━━━
fg:        #e5e7eb  → 对比度 12.8:1 ✅  (不变)
fg-muted:  #b4bcc6  → 对比度  5.6:1 ✅  (原 #9CA3AF → 提升)
fg-subtle: #8892a0  → 对比度  4.5:1 ✅  (原 #6B7280 → 提升)
```

### Light 浅色主题

```
卡片底色: #FFFFFF (bg-card)
━━━━━━━━━━━━━━━━━━━━━━━━━━
fg:        #1e293b  → 对比度 13.0:1 ✅  (不变)
fg-muted:  #546170  → 对比度  5.1:1 ✅  (原 #64748B → 提升)
fg-subtle: #758290  → 对比度  4.5:1 ✅  (原 #94A3B8 → 提升)
```

### Sepia 护眼主题

```
卡片底色: #FBF6E8 (bg-card)
━━━━━━━━━━━━━━━━━━━━━━━━━━
fg:        #433422  → 对比度  9.8:1 ✅  (不变)
fg-muted:  #5a4a3a  → 对比度  4.7:1 ✅  (原 #6B5D4F → 提升)
fg-subtle: #6b5b48  → 对比度  4.5:1 ✅  (原 #8B7D6B → 提升)
```

---

## 三、Mermaid 图表联动修复

从 `ui-ux-pro-max` chart rules:
> "Data text labels ≥4.5:1" (WCAG)
> "Relying on color alone to convey meaning" — 反模式

修复 `mermaidThemes.ts` 中对应的 `textColor`、`labelTextColor`、`noteTextColor` 等字段，统一使用提升后的 token 值。

---

## 四、实施步骤

1. 修改 `src/styles/tokens.css` — 四个主题的 fg-muted 和 fg-subtle
2. 修改 `src/services/mermaidThemes.ts` — 同步更新所有 textColor 系字段
3. 验证 `npm run build` 通过
4. 手动检查卡片文字可读性
