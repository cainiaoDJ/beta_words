# Phase 3 — 各游戏棋盘 + 选项装饰（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 3
>
> 状态：🔵 planning
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法（Phase A 基础设施 → Phase B 试点 match → Phase C 推广其余 4 个 + memory 专属 + quiz 专属 + stroop 专属）。每阶段独立 commit，跑 252 测试通过。
>
> 🎯 **基于**：Phase 1 主题色已覆盖棋盘/题目卡/选项按钮/HUD/完成面板，Phase 2 顶栏+卡+setup 都已升级。**Phase 3 在已有主题色基础上加视觉装饰 + 微动效**（不是重新主题化）。

---

## 🎯 目标

把"能玩"的游戏升级到"愿意玩"——字卡、棋盘、选项卡在"动 + 装饰"层面更有质感。范围比 Phase 2 细（5 游戏装饰各不相同），计划 1 天完成。

**最终效果**：
- 鼠标悬停字卡：scale(1.05) + 主题色光晕，柔和"凸起"感
- 配对成功：双格同时黄色星星 burst + 主题色背景闪烁（match 专属）
- 翻牌：3D rotateY 180°（memory 专属）
- 选项卡右上角小耳朵图标 + 题目卡 1° 微动（pinyin/listen 专属）
- 颜色条按钮 4px 主题色描边（stroop 专属）

---

## 📋 阶段拆分

### Phase 3A — 通用基础设施（5 游戏共用）

**目标**：定义可复用的"字卡 hover 凸起 + 主题色光晕 + matched burst"组件类，不动现有逻辑。完成后 5 个游戏的字卡都有统一凸起感和配对反馈。

#### 需求点

**R-3A.1** 字卡 hover 凸起（统一 5 游戏）

```css
.tile:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 20px var(--theme-glow);
  z-index: 1;
}
```

**验收标准**
- 鼠标悬停字卡有 1.05 倍放大 + 上浮 2px + 主题色光晕
- 移开恢复，无残留
- 252/252 测试通过

**R-3A.2** 字卡 selected 主题色脉动（match/stroop 选中态加强）

```css
.tile.selected,
.stroop-cell.active {
  animation: tile-pulse 1.1s ease-in-out infinite;
}
@keyframes tile-pulse {
  0%, 100% { transform: scale(1.05); box-shadow: 0 0 0 0 var(--theme-glow); }
  50%      { transform: scale(1.08); box-shadow: 0 0 0 6px transparent; }
}
```

**验收标准**
- match/stroop 选中态有 1.05-1.08 脉动
- 主题色光晕"波纹"效果
- 252/252 测试通过

**R-3A.3** matched 配对成功反馈（5 游戏共用基础规则）

```css
.tile.matched {
  animation: tile-celebrate 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
@keyframes tile-celebrate {
  0%   { transform: scale(1); }
  30%  { transform: scale(1.18) rotate(8deg); background: var(--theme-accent); }
  60%  { transform: scale(0.92) rotate(-4deg); }
  100% { transform: scale(1); background: var(--theme-accent-soft); }
}
```

**验收标准**
- 配对成功的字卡有 600ms 庆祝动画（缩放 + 旋转 + 主题色闪烁）
- 动画结束字卡保持主题色背景
- memory 的 .tile.matched 走原逻辑（不破翻牌状态）

**R-3A.4** 字卡点击时短促缩放反馈（除 matched 之外的所有字卡）

```css
.tile:active,
.option-button:active,
.stroop-color-btn:active {
  transform: scale(0.95);
  transition: transform 80ms ease;
}
```

**验收标准**
- 点击字卡/选项/色按钮时有 80ms 缩放反馈
- 不影响其他动画（selected / matched 走自己的 transform）

#### 自测步骤

```bash
# 1. 252 测试
cd /home/alpha/codex/beta_words
node scripts/mobile-one-screen-test.js http://127.0.0.1:8091/
# 期望：Total: 252, Failed: 0

# 2. 截图肉眼确认
# match play 3x3: 字卡 hover 有凸起，配对成功有 burst
# memory play 3x3: 翻牌动画保持
```

#### Commit 信息

```
feat(phase-3a): 棋盘/字卡通用装饰 — hover 凸起 + 选中脉动 + 配对 burst

* styles.css: .tile:hover scale(1.05) + 主题色光晕
* styles.css: .tile.selected / .stroop-cell.active 主题色脉动
* styles.css: .tile.matched 600ms 庆祝动画（缩放+旋转+主题色闪烁）
* styles.css: :active 80ms 短促缩放反馈

验证：mobile-one-screen-test.js Failed = 0
手测：5 游戏 hover/selected/matched 都有视觉反馈
```

---

### Phase 3B — 试点（match 完整装饰）

**目标**：在 match 游戏（结构最简单）落地 Phase 3A + 完整 match 专属装饰，验证装饰可工作且不破坏 252 测试。

#### 需求点

**R-3B.1** match 棋盘格选中态主题色脉动（已在 R-3A.2 包含，需在 match 试点确认）

**R-3B.2** match 配对成功双格同色 flash

```css
[data-game="match"] .tile.matched {
  animation: match-flash 700ms ease-out forwards;
}
@keyframes match-flash {
  0%   { background: var(--theme-accent); box-shadow: 0 0 0 0 var(--theme-glow); }
  50%  { background: var(--theme-accent); box-shadow: 0 0 0 16px transparent; }
  100% { background: var(--theme-accent-soft); box-shadow: 0 0 0 0 transparent; }
}
```

**验收标准**
- 配对成功的双格同时 700ms 同色 flash（波纹外扩）
- 动画结束保留主题色背景
- 252/252 测试通过

**R-3B.3** match 错误反馈（点错字卡时不匹配）

```css
[data-game="match"] .tile.mismatch {
  animation: match-shake 400ms ease-out;
}
@keyframes match-shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
```

**JS 触发**：在 app.js 的 match 错误处理加 `tile.classList.add('mismatch')`，400ms 后 `remove`。

**验收标准**
- 选错字卡时左右抖动 400ms
- 抖动结束字卡恢复原样
- 252/252 测试通过

#### Commit 信息

```
feat(phase-3b): match 完整装饰 — 选中脉动 + 配对 flash + 错误抖动

* styles.css: [data-game="match"] .tile.matched 同色 flash
* styles.css: [data-game="match"] .tile.mismatch 抖动
* app.js: match 错误处理加 .mismatch class

验证：mobile-one-screen-test.js Failed = 0
手测：match 3x3 选中脉动 + 配对 flash + 错误抖动
```

---

### Phase 3C — 推广 4 游戏 + 专属装饰

**目标**：把 Phase 3A 推广到 memory / pinyinFriend / listenCard / stroopTrain + 加 4 游戏专属装饰。

#### 顺序

memory → stroop → pinyin → listen（每个独立 commit）

#### 3C.1 memory

**R-3C.1.1** 卡片正面：空心矩形 + 字 + 主题色描边（替换之前话题提到的"空心矩形"）

```css
[data-game="memory"] .board.memory .tile.hidden-face {
  background: var(--theme-bg);
  border: 2px dashed var(--theme-accent);
  color: var(--muted);
  box-shadow: inset 0 0 0 2px var(--theme-accent-soft);
}
```

**R-3C.1.2** 卡片背面：主题色 + 主题图标（用 `?` 字符或 SVG "记忆"图标）

```css
[data-game="memory"] .board.memory .tile.hidden-face::before {
  content: "?";
  font-size: 32px;
  color: var(--theme-accent);
  font-weight: 900;
}
```

**R-3C.1.3** 翻牌 3D rotateY 动画（增强 transform）

```css
.board.memory .tile {
  transform-style: preserve-3d;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
.board.memory .tile.flipped {
  transform: rotateY(180deg);
}
.board.memory .tile .tile-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
}
.board.memory .tile .tile-back {
  transform: rotateY(180deg);
}
```

**注**：3D 翻牌需要 DOM 结构调整（.tile 内部加 .tile-face / .tile-back）。**这是个比 CSS-only 更大的改动**——见下方决策点。

**验收标准**
- 翻牌有 3D rotateY 180° 动画（400ms）
- 卡片正面（字）→ 卡片背面（记忆图标）平滑切换
- 252/252 测试通过

#### 3C.2 stroop

**R-3C.2.1** 待选区外框虚线换主题色

```css
[data-game="stroopTrain"] .stroop-select {
  border: 2px dashed var(--theme-accent);
}
```

**R-3C.2.2** 颜色条按钮 4px 主题色描边（区分已选）

```css
[data-game="stroopTrain"] .stroop-color-btn {
  border: 4px solid transparent;
  box-shadow: 0 0 0 0 transparent;
  transition: box-shadow 200ms ease;
}
[data-game="stroopTrain"] .stroop-color-btn.selected {
  border-color: var(--theme-accent);
  box-shadow: 0 0 0 3px var(--theme-glow);
}
```

**验收标准**
- 颜色条按钮已选项 4px 主题色描边 + 光晕
- 待选区外框虚线主题色
- 252/252 测试通过

#### 3C.3 pinyin / listen

**R-3C.3.1** 选项卡右上角小耳朵图标（提示点我听）

```html
<button class="option-button">
  <svg class="option-ear" viewBox="0 0 24 24"> <!-- 喇叭图标 --> </svg>
  <span>拼音</span>
</button>
```

```css
[data-game="pinyinFriend"] .option-button,
[data-game="listenCard"] .option-button {
  position: relative;
  padding-right: 36px; /* 给耳朵留位 */
}
.option-button .option-ear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--theme-accent);
  opacity: 0.7;
}
.option-button:hover .option-ear {
  opacity: 1;
  animation: ear-wiggle 0.5s ease-in-out;
}
@keyframes ear-wiggle {
  0%, 100% { transform: translateY(-50%) rotate(0); }
  25%      { transform: translateY(-50%) rotate(-8deg); }
  75%      { transform: translateY(-50%) rotate(8deg); }
}
```

**注**：这个需要 HTML 改（option-button 内加 SVG）。见下方决策点。

**R-3C.3.2** 当前题目卡旋转 1° 微动 + "听"按钮显眼

```css
[data-game="listenCard"] .listen-prompt {
  transform: rotate(-1deg);
  border: 3px solid var(--theme-accent);
}
[data-game="pinyinFriend"] .quiz-word {
  transform: rotate(1deg);
  border: 3px solid var(--theme-accent);
}
.listen-prompt .listen-mark,
.quiz-word .listen-mark {
  animation: ear-pulse 2s ease-in-out infinite;
}
@keyframes ear-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}
```

**验收标准**
- 题目卡 1° 微旋转 + 主题色加粗边框
- "听"图标 2s 周期脉动
- 252/252 测试通过

---

## ⚠️ 关键决策点（待主人拍板）

### 决策 1：Memory 3D 翻牌是否做？

**R-3C.1.3** 需要 DOM 结构调整（.tile 内部加 .tile-face / .tile-back）和 JS 触发 class。

| 选项 | 操作 | 后果 |
|---|---|---|
| **A. 做**（推荐） | 改 DOM + JS + CSS，实现 3D 翻牌 | 视觉最完整，但工作量 +30 分钟 |
| **B. 不做** | 保持现状（无翻牌动画） | 跳过这步，Phase 3 减 1 个 commit |
| **C. 简化** | 用纯 CSS scale 翻转（不用 3D） | 视觉折中，不动 DOM |

### 决策 2：pinyin/listen 小耳朵图标是否做？

**R-3C.3.1** 需要 HTML 改（option-button 内加 SVG）。

| 选项 | 操作 | 后果 |
|---|---|---|
| **A. 做**（推荐） | HTML 改 + CSS 摆位 + hover 摆动动画 | 视觉完整，工作量 +20 分钟 |
| **B. 不做** | 保持现状（无小耳朵） | 跳过，Phase 3 减 1 个 commit |

### 决策 3：match 错误反馈抖动是否做？

**R-3B.3** 需要 JS 改（app.js match 错误处理加 .mismatch class）。

| 选项 | 操作 | 后果 |
|---|---|---|
| **A. 做**（推荐） | JS 加 .mismatch 触发 + 400ms 自动 remove | 完整反馈，工作量 +10 分钟 |
| **B. 不做** | 保持现状（无错误抖动） | 跳过，Phase 3 减 1 个 commit |

---

## 📊 工作量预估

- Phase 3A（通用基础设施）：1 commit，~1 小时
- Phase 3B（match 试点）：1 commit，~30 分钟（取决于决策 3）
- Phase 3C 推广（4 游戏）：3-4 commit，~2-3 小时（取决于决策 1/2）

**全部完成**：5-7 commit，半天到 1 天

---

## 🚦 验收 Checklist（Phase 3 整体）

- [ ] Phase 3A commit 已入 git，252/252 通过
- [ ] Phase 3B commit 已入 git，252/252 通过 + match 截图确认装饰
- [ ] Phase 3C memory commit（取决于决策 1）
- [ ] Phase 3C stroop commit
- [ ] Phase 3C pinyin commit（取决于决策 2）
- [ ] Phase 3C listen commit（取决于决策 2）
- [ ] 主人确认 5 游戏装饰效果 + 录屏
- [ ] 部署：只发本机 8091（192.168.31.60）

完成后此文档标题改为 `✅ completed`，并附实际 commit hash 列表。
