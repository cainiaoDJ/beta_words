# Phase 5 — 反馈动效（详细规划） ✅ COMPLETED 2026-08-02

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 5
>
> 状态：✅ completed（2026-08-02 16:08）
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法。每阶段独立 commit，跑 252 测试通过。
>
> 🎯 **基于**：答对（`tile-correct-spring` + `setMascotState("happy")`）和答错（`tile-wrong-shake` + `setMascotState("sad")`）**基础反馈已存在**。Phase 5 加额外增强（彩屑 / 红光闪 / 计时器阈值 / 填色滑入）。
>
> 决策：决策 1/2/3 选 A A A（每次答对彩屑 / 屏幕红光闪 / mascot 不动）

---

## 🎯 目标

把"答对/答错"基础反馈**升级到多邻国级**：
- 每次答对：除了 tile 弹簧 + mascot 笑，**额外撒 6-8 片小彩屑**
- 每次答错：除了 tile 抖动 + mascot 哭，**屏幕边缘红光闪 1 次**
- 计时器：超过阈值（30s 黄、60s 红）**自动变橙/红**提醒
- Stroop 待选格填色：corrent/wrong 状态有**滑入动画**

---

## 📋 阶段拆分

### Phase 5A — 通用基础设施

**目标**：定义可复用的"小彩屑（每次答对）+ 屏幕红光闪"组件。

#### 需求点

**R-5A.1** `spawnMiniConfetti()` 答对小彩屑（每次答对）

```js
// 6-8 片小彩屑（用主色 hsl），从点击位置 burst
function spawnMiniConfetti(x, y, hue, count = 8) {
  const host = document.createElement("div");
  host.className = "confetti-mini";
  document.body.appendChild(host);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-mini-piece";
    // 从 (x, y) 散开
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 30 + Math.random() * 40;
    piece.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    piece.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    piece.style.background = `hsl(${hue + (Math.random() * 30 - 15)}, 80%, 60%)`;
    host.appendChild(piece);
  }
  setTimeout(() => host.remove(), 800);
}
```

```css
.confetti-mini-piece {
  position: fixed;
  width: 6px;
  height: 10px;
  border-radius: 1px;
  pointer-events: none;
  z-index: 150;
  animation: confetti-burst 700ms ease-out forwards;
}
@keyframes confetti-burst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--tx), var(--ty)) scale(0); opacity: 0; }
}
```

**验收标准**
- 每次答对触发 8 片小彩屑
- 0.7s 后自动 remove
- 252/252 测试通过

**R-5A.2** 屏幕边缘红光闪（每次答错）

```js
function flashError() {
  const flash = document.createElement("div");
  flash.className = "error-flash";
  document.body.appendChild(flash);
  requestAnimationFrame(() => flash.classList.add("is-active"));
  setTimeout(() => {
    flash.classList.remove("is-active");
    setTimeout(() => flash.remove(), 400);
  }, 80);
}
```

```css
.error-flash {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99;
  box-shadow: inset 0 0 0 0 rgba(220, 50, 47, 0);
  transition: box-shadow 350ms ease-out;
}
.error-flash.is-active {
  box-shadow: inset 0 0 80px 20px rgba(220, 50, 47, 0.5);
}
```

**验收标准**
- 答错时屏幕边缘红光闪 1 次（350ms fade in/out）
- 不影响点击（pointer-events: none）
- 252/252 测试通过

**R-5A.3** 计时器阈值变橙/红

```js
function updateTimerDisplay(elapsedMs) {
  // 现有：格式化 mm:ss
  // 新增：根据阈值加 .warning / .danger class
  timer.classList.toggle("warning", elapsedMs > 30000);  // > 30s 橙
  timer.classList.toggle("danger", elapsedMs > 60000);   // > 60s 红
}
```

```css
.hud-timer.warning {
  background: #e89858;
  border-color: #cd7f32;
  color: white;
}
.hud-timer.danger {
  background: #e94f4f;
  border-color: #b32f2f;
  color: white;
  animation: timer-pulse 1s ease-in-out infinite;
}
@keyframes timer-pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.05); }
}
```

**验收标准**
- 30s 后变橙（warning）
- 60s 后变红 + 脉动（danger）
- 252/252 测试通过

#### Commit 信息

```
feat(phase-5a): 反馈动效基础设施 — 小彩屑 + 红光闪 + 计时器阈值

* app.js: spawnMiniConfetti(x, y, hue, count) 答对彩屑
* app.js: flashError() 屏幕红光闪
* app.js: updateTimerDisplay 加 warning / danger 阈值判断
* styles.css: .confetti-mini-piece burst 700ms 动画
* styles.css: .error-flash 红光 350ms fade
* styles.css: .hud-timer.warning / .danger + timer-pulse 脉动

验证：mobile-one-screen-test.js Failed = 0
```

---

### Phase 5B — 试点（match 完整反馈）

**目标**：在 match 游戏答对/答错时完整触发彩屑 + 红光闪。

#### 需求点

**R-5B.1** match 配对成功时撒小彩屑（从 match 主题色 hue 范围）

**R-5B.2** match 配对错误时屏幕红光闪

**R-5B.3** match stroop 等所有答对都触发小彩屑

#### 验收标准

- match 配对正确 → 8 片小彩屑（橙色 hsl 范围）
- match 配对错误 → 屏幕红光闪
- 252/252 测试通过

#### Commit 信息

```
feat(phase-5b): match 完整反馈 — 彩屑 + 红光闪

* app.js: handleMatchTileClick 配对正确调 spawnMiniConfetti
* app.js: handleMatchTileClick 配对错误调 flashError

验证：mobile-one-screen-test.js Failed = 0
手测：match 3x3 配对正确有彩屑，配对错误有红光
```

---

### Phase 5C — 推广 + Stroop 填色滑入

#### 5C.1 stroop 填色滑入动画

```css
.stroop-select-cell.correct,
.stroop-select-cell.wrong {
  animation: stroop-fill-slide 400ms ease-out;
}
@keyframes stroop-fill-slide {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1.04); }
}
```

#### 5C.2 推广其他 4 游戏彩屑 + 红光

- memory: 配对成功/失败都触发
- pinyin / listen: 答对 / 答错触发
- stroop: 颜色填对 / 填错触发

每个独立 commit。

---

## ⚠️ 决策点（待主人拍板）

### 决策 1：每次答对都撒彩屑 vs 只在完成时

| 选项 | 描述 | 后果 |
|---|---|---|
| **A**（推荐） | 每次答对都撒（8 片小彩屑，0.7s 内消失） | 反馈强烈，但 5×5 棋盘可能花 |
| **B** | 只在完成时撒 | 不如决策 A 反馈，但更简洁 |

### 决策 2：红光闪 vs 红色边框

| 选项 | 描述 |
|---|---|
| **A**（推荐） | 屏幕边缘红光闪（不影响点击） |
| **B** | 整屏红色边框脉冲 |

### 决策 3：mascot SVG `<animate>` 流畅化是否做

| 选项 | 描述 | 工作量 |
|---|---|---|
| **A. 不做**（推荐） | 保持 4 个静态 SVG 切换 | 0 |
| **B. 简版** | 单一 SVG 加 `<animate>` 表情切换 | 1-2h |
| **C. 完整版** | 4 个 SVG 都有 `<animate>` | 半天 |

---

## 🚦 验收 Checklist

- [ ] Phase 5A commit，252/252 通过
- [ ] Phase 5B match commit，252/252 + 截图
- [ ] Phase 5C 4 游戏 + stroop 填色 commit
- [ ] 主人确认反馈效果
- [ ] 部署：只发本机 8091

完成后此文档标题改为 `✅ completed`。

---

## ✅ 实际执行记录（2026-08-02）

### commit 链（feat/deep-optimization 分支）

| commit | 内容 |
|---|---|
| `683996b` | **Phase 5A** 基础设施：spawnMiniConfetti + flashError + 计时器阈值 + 2 个 bug 修复 |
| `fca62c6` | **Phase 5B** match 试点：配对正确彩屑（hue=30 橙）+ 配对错误红光闪 |
| `ca53869` | **Phase 5C.1** stroop 填色滑入动画（400ms scale 0.5 → 1.15 → 1.04） |
| `c93e199` | **Phase 5C.2** 4 游戏推广：memory 紫 hue=270 / pinyin 蓝=210 / listen 绿=130 / stroop 红=0 |

### 验证

- `mobile-one-screen-test.js` **4 次全过**：Total: 252, Failed: 0
- 截图（workspace/.beta-screenshots/）：
  - `phase5a-flash.png` — 红光闪
  - `phase5a-warning.png` — 计时器 30s 橙
  - `phase5a-danger.png` — 计时器 60s 红+脉动
  - `phase5a-confetti.png` — 8 片橙色彩屑（DOM 验证 piece 实际在 body 顶层 burst）

### 主题色 hue 表

| 游戏 | hue | 颜色 |
|---|---|---|
| match | 30 | 暖橙 |
| memory | 270 | 紫 |
| pinyinFriend | 210 | 蓝 |
| listenCard | 130 | 绿 |
| stroopTrain | 0 | 红 |
