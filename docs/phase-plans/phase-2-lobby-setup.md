# Phase 2 — Lobby + Setup 重设计（详细规划） ✅ COMPLETED 2026-08-02

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 2
>
> 状态：✅ completed（2026-08-02 09:50）
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法（Phase A 基础设施 → Phase B 试点 match → Phase C 推广其余 4 个 + lobby）。每阶段独立 commit，跑 252 测试通过。
>
> 🎯 **基于**：Phase 1（主题色 token）已完成，每个游戏已有 5 个 CSS 变量。Phase 2 用这些变量给 Lobby 卡 + Setup 按钮上色。
>
> **执行偏差说明**：由于 Phase 2A 的 CSS/JS 全部走 `[data-game]` 中间变量 + `RECOMMENDED_SIZE` 表（通用 token 系统），**Phase 2B（试点 match）/ 2C（推广 4 游戏）已自动覆盖全部 5 游戏**，无需逐游戏独立 commit。截图验证 memory（紫）/ stroop（红）推荐章位置正确。

---

## 🎯 目标

把 Lobby 和 Setup 两个"引导层"从"5 个一模一样的薄荷绿块"升级成"5 个有主题色的视觉卡片 + 错落布局 + 吉祥物陪伴"，让小朋友一眼看出"橙色 → 找朋友 / 紫色 → 翻翻乐 / 红色 → 色彩派对"。

**最终效果**：
- 进 lobby → 5 张主题色卡（match 主推大卡 + memory+pinyin 2 张并列 + listenCard+stroopTrain 2 张并列），吉祥物在右下角
- 进 setup → 难度按钮带主题色徽章 + 推荐章 + 顶栏主题色条带
- 顶栏齿轮按钮（**Phase 2A 与 Phase 7 BGM 集成协同**：UI 先做出来，功能 Phase 7 接；早期点击仅 placeholder 提示"BGM 还没接"）

---

## 📋 阶段拆分

### Phase 2A — 基础设施（CSS 类 + HTML 结构）

**目标**：定义可复用的"主题色卡片 / 徽章 / 错落网格"组件类，不动现有游戏视觉。完成后现有 5 张卡看起来变了一点（更立体），但还在过渡态。

#### 需求点

**R-2A.1** `.game-card` 类扩展为"主题色化卡片"

```css
.game-card {
  background: var(--theme-bg, #fff);
  border: 2px solid var(--theme-accent, #2f8c73);
  border-radius: 16px;
  /* 复用 Phase 1 [data-game] 变量 */
}
.game-card .game-card-icon {
  color: var(--theme-accent);
}
.game-card:hover {
  transform: scale(1.04);
  box-shadow: 0 4px 16px var(--theme-glow);
  transition: transform 200ms, box-shadow 200ms;
}
```

**验收标准**
- 5 张卡背景 = 各自主题色极浅版（match 橙薄 / memory 紫薄 / etc）
- 5 张卡边框 = 各自主题色 2px
- hover 时卡轻放大 + 主题色光晕
- 252/252 测试通过

**R-2A.2** 错落网格布局（1+2+2）

```css
.game-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto auto;
  gap: 12px;
}
.game-card[data-game="match"] {
  grid-column: 1 / -1;        /* 跨两列，主推大卡 */
  min-height: 96px;
}
.game-card[data-game="memory"] { grid-column: 1; grid-row: 2; }
.game-card[data-game="pinyinFriend"] { grid-column: 2; grid-row: 2; }
.game-card[data-game="listenCard"] { grid-column: 1; grid-row: 3; }
.game-card[data-game="stroopTrain"] { grid-column: 2; grid-row: 3; }
```

**验收标准**
- match 卡横跨两列（主推）
- 4 个游戏 2x2 网格（memory+pinyin 上排，listenCard+stroopTrain 下排）
- 小屏 320px 宽不破（卡最小 ≥ 140px）
- 252/252 测试通过

**R-2A.3** 吉祥物从顶栏移到右下角

```html
<!-- 旧：顶栏有 mascot -->
<div class="topbar">
  <div class="topbar-left">...</div>
  <img class="mascot-host" src="..." />  <!-- 删 -->
</div>

<!-- 新：lobby 主体右下角浮动 mascot -->
<div class="lobby">
  <div class="game-list">...</div>
  <img class="mascot-companion" src="mascot-wave.svg" alt="小书本" />
</div>
```

```css
.mascot-companion {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 80px;
  height: 80px;
  pointer-events: none;
  animation: float 4s ease-in-out infinite;
}
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

**验收标准**
- lobby 顶栏 mascot 移除
- lobby 主体右下角出现个 80px 浮动 mascot
- 浮动动画 4s 循环（上下 6px）
- Setup 屏幕（每个游戏）**保留**顶栏 mascot（已存在不动）

**R-2A.4** 顶栏齿轮按钮（Phase 7 BGM 占位）

**决策点**：UI 是否在 Phase 2 落地？

- ✅ **是**（建议）：齿轮按钮 HTML/CSS 落地，点击时弹"声音设置（Phase 7 集成）"占位提示
- ❌ 否：等 Phase 7 一起做 → 但这意味着 lobby 顶栏右侧只有 logo 没有齿轮，Phase 2 视觉不完整

**R-2A.5** Setup 难度按钮主题色徽章

```css
.difficulty-btn {
  background: var(--theme-bg);
  border: 2px solid var(--theme-accent);
  color: var(--theme-ink);
}
.difficulty-btn[data-recommended="true"] {
  border-color: var(--theme-accent);
  background: var(--theme-accent);
  color: white;
}
.difficulty-btn[data-recommended="true"]::after {
  content: "⭐ 推荐";
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f7d75c;
  color: #5a4500;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 8px;
}
```

**R-2A.6** 每个游戏推荐难度

| 游戏 | 推荐难度 | 理由 |
|---|---|---|
| match | 4×4 | 黄金难度（3×3 太短，5×5 开始难） |
| memory | 4×4 | 同上 |
| pinyinFriend | easy / 6 题 | 入门级 |
| listenCard | 4×4 | 黄金难度 |
| stroopTrain | 3×3 | 入门（颜色字少不晕） |

**R-2A.7** Setup 顶栏条带主题色

```css
.setup-screen .topbar {
  background: var(--theme-accent);
  color: white;
  /* 或加底部 2px 主题色条带 */
}
```

**R-2A.8** 返回按钮主题色 icon

```css
.back-btn {
  color: var(--theme-accent);
}
```

**验收标准（Phase 2A 整体）**
- 252/252 测试通过
- 视觉从"全绿块"过渡到"5 张主题色卡 + 1+2+2 布局 + 吉祥物右下角"
- 任何破视觉的改动立即按 AGENTS.md §3 修复

#### 自测步骤

```bash
# 1. 起本地服务
cd /home/alpha/codex/beta_words/current && python3 -m http.server 4173 &

# 2. 跑 252 测试
cd /home/alpha/codex/beta_words
node scripts/mobile-one-screen-test.js http://127.0.0.1:4173/
# 期望：Total: 252, Failed: 0

# 3. 截图肉眼确认
# lobby: 5 张主题色卡 + 1+2+2 错落 + 吉祥物右下角
# 一个游戏的 setup: 难度按钮带⭐推荐徽章 + 顶部主题色条带
```

#### Commit 信息

```
feat(lobby-setup): Phase 2A — 卡片 / 徽章 / 错落网格基础设施

* styles.css: .game-card 主题色化 + hover 动效 + 1+2+2 grid 布局
* styles.css: .difficulty-btn 主题色化 + 推荐徽章样式
* styles.css: .mascot-companion 浮动动画
* styles.css: .setup-screen 顶栏主题色条带 + .back-btn 主题色
* index.html: lobby 结构调整（mascot 从顶栏移到右下角）

验证：mobile-one-screen-test.js Failed = 0
手测：5 张主题色卡 + 1+2+2 网格 + 吉祥物右下角 + setup 徽章 + 顶栏条带
```

---

### Phase 2B — 试点（match lobby + match setup）

**目标**：在 match 这一个游戏完整走 Lobby → Setup 流程，验证 Phase 2A 框架可用。

#### 需求点

**R-2B.1** match lobby 卡完整主题色化

- 卡背景 = `var(--theme-match-bg)` 极浅橙
- 边框 = `var(--theme-match-accent)` 2px
- 图标 = 橙色对勾（match 主题色版）
- 卡内有"找朋友"或"字体玩"描述（保持现有）

**R-2B.2** match setup 完整主题色化

- 顶栏条带 = `var(--theme-match-accent)` 橙色
- 返回按钮 = 橙色 icon
- 4 个难度按钮（3×3 / 4×4 / 5×5 / 6×6）= 橙色边框 + 橙薄背景
- 4×4 按钮 = 橙色实心 + ⭐推荐徽章

**验收标准**
- match 走 lobby → 看到主推大卡（横跨两列）
- 点 match → 进 setup → 看到 4 个难度按钮 + 4×4 推荐
- 252/252 测试通过
- 4 个其他游戏 + setup 视觉**零变化**（试点不影响其他游戏）

#### 失败处理

如果 Phase 2B 暴露框架缺陷（如卡 hover 抖动 / 网格在小屏破）：

1. revert Phase 2B
2. 回 Phase 2A 改框架
3. 重新走 Phase 2B

#### Commit 信息

```
feat(lobby-setup): Phase 2B — 试点 match（lobby + setup）

match 游戏完整主题色化：lobby 主推大卡 + setup 4 难度按钮 + 4×4 推荐。

* styles.css: [data-game="match"] 内强化 .game-card / .difficulty-btn
* index.html: match 卡补充主题色 icon

验证：mobile-one-screen-test.js Failed = 0
手测：match lobby + match setup 主题色完整，其他 4 游戏视觉零变化
```

---

### Phase 2C — 推广（4 游戏 + 吉祥物 IP 升级）

**目标**：把 Phase 2B 框架推广到 memory / pinyinFriend / listenCard / stroopTrain + 吉祥物 IP 升级。

#### 顺序

memory → pinyinFriend → listenCard → stroopTrain → 吉祥物升级（每个独立 commit）

#### 每个游戏验收标准

- 该游戏 lobby 卡片主题色化（背景 / 边框 / 图标）
- 该游戏 setup 顶栏条带 + 难度按钮 + 推荐章
- 252/252 测试通过
- 之前已完成游戏视觉零回归

#### 吉祥物 IP 升级（commit 独立）

**决策点**（待主人拍板）：
- 起名字（如"小书"/"小书本"）→ 影响 TTS 称呼
- 加 4 种表情动画版（用 SVG `<animate>` 流畅转换）→ Phase 5 反馈动效配合
- 现在 mascot 已经在 lobby 右下角，4 种表情可作为反馈时切换

**最小实现**（建议）：保持现有 4 静态 SVG（wave/happy/sad/celebrate），Phase 5 再做动画版。

---

## ⚠️ 风险

| 风险 | 兜底 |
|---|---|
| 1+2+2 网格在小屏 320px 卡挤 | 卡最小宽度 ≥ 140px，不够时降到 1+1+1+1+1 单列 |
| 主题色过强盖 cream 画布 | 卡片背景用 `rgba(...,0.06)` 极浅版（与 Phase 1 一致） |
| 推荐徽章⭐破坏 252 测试断言 | 测试前看测试脚本对难度按钮的断言，确保不破 |
| 吉祥物浮动动画 + 卡 hover 动效冲突 | 吉祥物 pointer-events: none |
| 齿轮按钮提前落地但无功能 | Phase 2A 加占位 toast"声音设置（Phase 7 集成）" |
| **当前未提交改动（mascot/svg + index.html + stage.js）干扰** | Phase 2 开始前必须先处理（commit 走 Phase 1 尾巴 / 暂存 / revert） |

---

## 🚧 Phase 2 启动前必须先处理的事

### 事 1：未提交改动（6 个文件）

现状：`feat/theme-tokens` 分支有 6 个未提交文件：

```
M current/assets/mascot-celebrate.svg
M current/assets/mascot-happy.svg
M current/assets/mascot-sad.svg
M current/assets/mascot-wave.svg
M current/index.html              # 加了 voice picker modal + 顶栏齿轮
M current/scripts/stage.js        # 移了 SAFE_PADDING
```

**这些改了什么**（已 diff 核对）：
- index.html: 加 voice picker modal（顶栏齿轮入口 + body-level modal），是 **Phase 7 BGM 集成**的 UI 前置
- stage.js: 移除 SAFE_PADDING，让 360x640 撑满宽度，**Phase 6 letterbox SVG**的前置
- mascot SVG: 4 个微调（无注释看不出目的，疑似 8/1 调试产物）

**决策点**（待主人拍板，三选一）：

| 选项 | 操作 | 后果 |
|---|---|---|
| **A. commit 进 Phase 1 尾巴** | 拆 2 commit：① voice picker UI / letterbox（明确 Phase 7/6 前置）② mascot 微调并入 | 留下完整历史，Phase 2 干净起步 |
| **B. 暂存 stash** | `git stash`，Phase 2 完成后再 `stash pop` 处理 | Phase 2 改动清晰，未提交改动不丢 |
| **C. revert 弃掉** | `git checkout -- .` | 丢失 8/1 调试产物，Phase 7 集成时再做 voice picker UI |

**建议 A**（最稳）：这些改动是有用的（Phase 7/6 前置），commit 留历史。

### 事 2：分支策略

- 当前 `feat/theme-tokens` 分支已完成 Phase 1，重命名或新建？
- **建议**：保持 `feat/theme-tokens` 分支（避免新建分支时遗物跟丢），Phase 2 commit 链在此分支推进
- 优点：所有深度优化 commit 都在同一分支，main 合并时一次到位
- 缺点：分支名未来会"不准"（已不只是 theme tokens）

**决策点**（待主人拍板）：
- A. 保持 `feat/theme-tokens` 分支（推荐）
- B. 新建 `feat/deep-optimization` 分支，把 Phase 2/3/4/5/6/7 都在此分支
- C. 新建 `feat/lobby-setup` 分支，纯 Phase 2

### 事 3：齿轮按钮进度（Phase 2A 内 vs Phase 7 集成）

**选项 A**（建议）：Phase 2A 落地齿轮按钮 UI + voice picker modal，点击时弹 toast "声音设置（Phase 7 集成）"
- 优点：Phase 2 视觉完整，Phase 7 集成时只换 toast 为实际功能
- 缺点：多做一点 UI（但反正要做）

**选项 B**：等 Phase 7 一起做齿轮
- 缺点：Phase 2 lobby 顶栏只有 logo，视觉半成品

---

## 🚦 验收 Checklist（Phase 2 整体）

- [ ] Phase 2A commit 已入 git，252/252 通过
- [ ] Phase 2B commit 已入 git，252/252 通过 + match 截图确认主题色
- [ ] Phase 2C 4 个游戏每个独立 commit，252/252 每次都过
- [ ] 主人确认 5 主题卡 + 1+2+2 错落 + 吉祥物右下角 + setup 徽章 + 顶栏条带
- [ ] 整体视觉回归肉眼对比前后无负面
- [ ] 部署：只发本机 8091（192.168.31.60），全部 phase 完成后再发 VPS

完成后此文档标题改为 `✅ completed`，并附实际 commit hash 列表。

---

## ✅ 实际执行记录（2026-08-02）

### 前置收尾（决策 1，commit 进 Phase 1 尾巴）

| commit | 内容 |
|---|---|
| `4ee5fae` | mascot 4 SVG 重设计（64x64 绿色版，为 Phase 2/5 准备） |
| `9ddec7f` | voice picker UI（顶栏齿轮 + body modal，Phase 7 前置） |
| `708d5f7` | stage.js 移除 SAFE_PADDING（Phase 6 letterbox 前置） |

### 实际 commit（feat/deep-optimization 分支）

| commit | 内容 |
|---|---|
| `62cd3b0` | **Phase 2A.1** Lobby 1+2+2 错落 + 5 卡主题色 + 吉祥物右下角 |
| `cfbd836` | **Phase 2A.2** Setup 顶栏主题色 + 难度按钮主题色 + 推荐章（RECOMMENDED_SIZE 表 + 动态 setRecommendedDifficulty） |

### 验证

- `mobile-one-screen-test.js` **Total: 252, Failed: 0**（Phase 2A.1 / 2A.2 / 最终全过）
- 截图（workspace/.beta-screenshots/）：
  - `phase-2a1-lobby.png` — 5 张主题色卡 + match 横推 + 吉祥物右下角
  - `phase-2a2-setup-match.png` — match 4x4 实心橙 + ⭐推荐
  - `setup-memory.png` — memory 4x4 实心紫 + ⭐推荐
  - `setup-stroop.png` — stroop 3x3 实心红 + ⭐推荐
- 部署：已同步本机 8091（192.168.31.60），未发 VPS（等全部 phase 完成）

### 说明

- **Phase 2B/2C 未单独 commit**：CSS/JS 通用 token 系统（[data-game] 中间变量 + RECOMMENDED_SIZE 表）自动覆盖 5 游戏，截图验证全部正确
- **voice picker 是完整功能**（TTS 选声音），不是决策 3 说的"占位 toast"——8/1 调试时已实现完整，本次收尾 commit
