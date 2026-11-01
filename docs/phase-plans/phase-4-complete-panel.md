# Phase 4 — 结算页大改（详细规划） ✅ COMPLETED 2026-08-02

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 4
>
> 状态：✅ completed（2026-08-02 13:21）
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法。每阶段独立 commit，跑 252 测试通过。
>
> 🎯 **基于**：complete-panel 已有"标题 + 用时 + 新纪录 + 3 按钮"基础。Phase 4 加奖杯/星星/历史最佳/撒花主题色化。
>
> 决策：决策 1/2/3 选 A A A（简单档位 / 都显示 / 随机彩色撒花）

---

## 🎯 目标

把"功能 OK"的结算页升级到"小朋友愿意晒"——奖杯 + 星星 + 历史最佳对比 + 主题色撒花。**对小朋友来说"我得了 3 颗星 + 金奖杯 + 新纪录"是核心成就感**。

**最终效果**：
- 顶部：3 档奖杯（铜/银/金，56×56 SVG，按正确率 50%/80%/100% 渐变显示）
- 中部：1-3 颗星（按正确率 + 时长综合算，⭐ 主题色 + 抖动入场）
- 用时 / 成功率 / 新纪录（已有，补"用时 + 成功率"对齐 stroop）
- 三按钮（再玩一次主 + 下一关次 + 回大厅次）
- 撒花升级：彩色渐变 confetti（按主题色）

---

## 📋 阶段拆分

### Phase 4A — 通用基础设施

**目标**：定义可复用的"奖杯 SVG + 星星 SVG + 撒花 confetti"组件类。完成后 complete-panel 结构就位，但 5 游戏具体表现由 [data-game] 主题色决定。

#### 需求点

**R-4A.1** complete-panel DOM 结构升级

```html
<div id="complete-panel" class="complete-panel" hidden>
  <div class="trophy-row">
    <!-- 奖杯 SVG：3 档渐变（铜/银/金） -->
    <div class="trophy" data-tier="bronze" hidden>...</div>
    <div class="trophy" data-tier="silver" hidden>...</div>
    <div class="trophy" data-tier="gold" hidden>...</div>
  </div>
  <div class="star-row">
    <!-- 3 颗星 SVG -->
    <svg class="star is-earned" data-star="1">★</svg>
    <svg class="star is-earned" data-star="2">★</svg>
    <svg class="star" data-star="3">★</svg>
  </div>
  <p class="complete-title">都找到了</p>
  <p id="complete-stats" class="complete-stats">用时 00:08 · 成功率 100%</p>
  <p id="best-record" class="complete-record" hidden>新纪录！进步 3 秒！</p>
  <div class="actions">
    <button id="play-again" class="primary-button" type="button">再玩一次</button>
    <button id="next-board" class="secondary-button" type="button" hidden>下一关</button>
    <button class="secondary-button" type="button" data-action="back-lobby">回大厅</button>
  </div>
</div>
```

**验收标准**
- DOM 结构就位（奖杯 + 星星 + 标题 + 统计 + 记录 + 3 按钮）
- 252/252 测试通过

**R-4A.2** 奖杯 SVG（3 档，inline SVG，56×56）

```html
<!-- 铜奖杯：浅铜色 -->
<svg class="trophy-svg" viewBox="0 0 64 64" fill="none">
  <path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#cd7f32"/>
  <rect x="22" y="44" width="20" height="6" fill="#cd7f32"/>
  <rect x="18" y="50" width="28" height="6" fill="#a6611f"/>
  <!-- 耳朵 -->
  <path d="M8 18c-4 0-4 8 0 8" stroke="#cd7f32" stroke-width="3"/>
  <path d="M56 18c4 0 4 8 0 8" stroke="#cd7f32" stroke-width="3"/>
</svg>
<!-- 银奖杯：白银色 + 微光 -->
<!-- 金奖杯：金色 + 强光 -->
```

**验收标准**
- 3 档 SVG 视觉区分明显（颜色 + 简略装饰）
- 默认全部 hidden，根据完成率动态显示 1 档
- 252/252 测试通过

**R-4A.3** 星星 SVG（5 角星，30×30）

```html
<svg class="star-svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2L14.85 8.5L22 9.27L16.5 14.14L18.18 21L12 17.27L5.82 21L7.5 14.14L2 9.27L9.15 8.5L12 2Z"/>
</svg>
```

**R-4A.4** 奖杯/星星入场动画

```css
.trophy {
  animation: trophy-rise 600ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
}
.star {
  animation: star-pop 400ms ease-out backwards;
}
.star:nth-child(1) { animation-delay: 200ms; }
.star:nth-child(2) { animation-delay: 400ms; }
.star:nth-child(3) { animation-delay: 600ms; }

@keyframes trophy-rise {
  from { transform: translateY(20px) scale(0.6); opacity: 0; }
  to   { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes star-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

**验收标准**
- 奖杯从下方 600ms 弹入
- 3 颗星按 200/400/600ms 依次弹出（"累加感"）
- 252/252 测试通过

**R-4A.5** 撒花 confetti 升级（彩色渐变 + 主题色版）

现有 .complete-panel 没 confetti 元素，需要 JS 动态生成 + CSS 动画：

```js
// 撒花：在 complete-panel 显示时触发
function spawnConfetti(count = 30) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = `hsl(${Math.random() * 360}, 80%, 60%)`;
    piece.style.animationDelay = `${Math.random() * 200}ms`;
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), 2000);
  }
}
```

```css
.confetti {
  position: fixed;
  top: -10px;
  width: 8px;
  height: 14px;
  z-index: 200;
  pointer-events: none;
  animation: confetti-fall 1.6s ease-in forwards;
}
@keyframes confetti-fall {
  to {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
```

**验收标准**
- complete-panel 显示时撒 30 片彩色纸屑（hsl 随机色）
- 1.6s 后自动 remove（不堆积 DOM）
- 252/252 测试通过

#### 自测步骤

```bash
# 252 测试
cd /home/alpha/codex/beta_words
node scripts/mobile-one-screen-test.js
# 期望：Total: 252, Failed: 0
```

#### Commit 信息

```
feat(phase-4a): 结算页基础 — DOM 升级 + 奖杯/星星 SVG + 撒花

* index.html: complete-panel 拆 trophy-row + star-row + stats
* styles.css: 奖杯/星星入场动画（rise 600ms / pop 400ms 错开）
* styles.css: confetti 彩色纸屑动画
* app.js: spawnConfetti() complete-panel 显示时触发

验证：mobile-one-screen-test.js Failed = 0
```

---

### Phase 4B — 试点（match 完整结算页）

**目标**：在 match 游戏完整跑"完成 → 奖杯 → 星星 → 撒花 → 历史最佳"全链路。

#### 需求点

**R-4B.1** 计算奖杯档位（按正确率 50%/80%/100%）

```js
function calcTrophyTier(correct, total) {
  if (total === 0) return null;
  const rate = correct / total;
  if (rate >= 1.0) return 'gold';
  if (rate >= 0.8) return 'silver';
  if (rate >= 0.5) return 'bronze';
  return null;  // 不显示奖杯
}
```

**R-4B.2** 计算星星数（正确率 + 时长综合）

```js
function calcStars(correct, total, elapsedMs) {
  if (total === 0) return 0;
  const rate = correct / total;
  if (rate < 0.5) return 0;
  if (rate < 0.8) return 1;
  if (rate < 1.0) return 2;
  // 满分 + 快速（< 30s 4×4 棋盘）= 3 星
  if (elapsedMs < 30000) return 3;
  return 2;
}
```

**R-4B.3** 显示奖杯（只有 1 档可见）+ 标记星星 earned

```js
function showTrophy(tier) {
  document.querySelectorAll('.trophy').forEach(t => t.hidden = true);
  if (tier) {
    const el = document.querySelector(`.trophy[data-tier="${tier}"]`);
    if (el) el.hidden = false;
  }
}
function showStars(starCount) {
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('is-earned', i < starCount);
  });
}
```

**R-4B.4** 历史最佳对比（localStorage）

```js
const RECORD_KEY = (gameId, size) => `beta_words_best_${gameId}_${size}`;

function updateBestRecord(elapsedMs) {
  const key = RECORD_KEY(state.game, state.size);
  let best = null;
  try { best = parseInt(localStorage.getItem(key) || '0', 10) || null; } catch (_) {}
  if (!best || elapsedMs < best) {
    try { localStorage.setItem(key, String(elapsedMs)); } catch (_) {}
    return { isNew: true, improvement: best ? best - elapsedMs : 0 };
  }
  return { isNew: false, best, improvement: 0 };
}
```

**验收标准**
- match 完成时根据正确率显示 1 档奖杯
- 星星数 = 0-3（按 rate + 时长）
- 历史最佳显示："新纪录！进步 3 秒！"或"本次 00:08 vs 最佳 00:05"
- 撒花 confetti 触发
- 252/252 测试通过

#### Commit 信息

```
feat(phase-4b): match 结算页 — 奖杯档位 + 星星数 + 历史最佳

* app.js: calcTrophyTier / calcStars / updateBestRecord
* app.js: showTrophy / showStars + completeMatchGame 调用
* app.js: match 完成时 spawnConfetti

验证：mobile-one-screen-test.js Failed = 0
手测：match 3x3 / 4x4 完成时奖杯 + 星星 + 撒花全展示
```

---

### Phase 4C — 推广 4 游戏 + 文案对齐

**目标**：把 4B 推广到 memory / pinyinFriend / listenCard / stroopTrain，文案对齐"用时 + 成功率"（stroop 已有，其他补齐）。

#### 顺序

memory → pinyin → listen → stroop（每个独立 commit）

#### 验收标准（每个游戏）

- 该游戏完成时显示对应主题色奖杯 + 星星 + 撒花
- 用时 + 成功率统一格式：`用时 00:08 · 成功率 100%`
- 历史最佳按游戏+尺寸分别存（不互相覆盖）
- 252/252 测试通过

#### 关键差异

| 游戏 | total 含义 | 星星算法 |
|---|---|---|
| match | matchedCount / state.totalTargets | 1:1 配对（满分 = 配对所有） |
| memory | matchedCount / state.totalTargets | 同 match（全部翻开配对） |
| pinyin | questions.length | 全部答对 = 满分 |
| listen | questions.length | 同 pinyin |
| stroop | correct / totalCells | 已有 "用时 + 成功率"，对齐 |

---

## ⚠️ 关键决策点（待主人拍板）

### 决策 1：星星算法

| 选项 | 算法 | 适用 |
|---|---|---|
| **A. 简单档位**（推荐） | rate<0.5:0 颗, <0.8:1 颗, <1.0:2 颗, 1.0:3 颗 | MVP 快 |
| **B. 速率综合** | rate + 时长综合（如 4×4 30s 内 = 3 颗） | 更难拿 3 颗 |
| **C. 全对才 3 颗** | 0 颗/1 颗/2 颗/3 颗按 0-25/50/75/100% 4 档 | 最严 |

### 决策 2：奖杯 + 星星是否同时显示？

| 选项 | 描述 | 后果 |
|---|---|---|
| **A. 都显示**（推荐） | 奖杯显示 + 星星显示 | 信息量大，3 颗星 + 金奖杯= 满贯 |
| **B. 只奖杯** | 3 档奖杯 = 0/1-2/3 颗星 | 简洁 |

### 决策 3：撒花 confetti 颜色

| 选项 | 描述 |
|---|---|
| **A. 随机彩色**（推荐） | hsl(随机) 全色，热闹 |
| **B. 主题色 + 副色** | 当前游戏主题色 + 1-2 个互补色，精致 |

---

## 🚦 验收 Checklist

- [ ] Phase 4A commit，252/252 通过
- [ ] Phase 4B match commit，252/252 + 截图确认
- [ ] Phase 4C 4 游戏 commit，252/252 每次都过
- [ ] 主人确认奖杯/星星/撒花视觉效果
- [ ] 部署：只发本机 8091

完成后此文档标题改为 `✅ completed`，并附实际 commit hash 列表。

---

## ✅ 实际执行记录（2026-08-02）

### commit 链（feat/deep-optimization 分支）

| commit | 内容 |
|---|---|
| `a4a871d` | **Phase 4A** 结算页基础：3 档奖杯 SVG（铜/银/金） + 3 颗星星 SVG + 入场动画 + 撒花 confetti 动画就绪 |
| `aff68b5` | **Phase 4B** match / memory 通用：calcStarCount / calcTrophyTier / showTrophy / showStars / renderTrophiesAndStars 5 个新函数 + spawnConfetti 改 hsl 随机色 |
| `c7ab778` | **Phase 4C-stroop** stroop 推广：checkComplete stroopTrain 分支调 renderTrophiesAndStars |
| `97616cc` | **Phase 4C-quiz** pinyin / listen quiz 类推广：completeQuizGame 调 renderTrophiesAndStars |

### 验证

- `mobile-one-screen-test.js` **4 次全过**：Total: 252, Failed: 0
- 截图（workspace/.beta-screenshots/）：
  - `phase4a-complete-with-font.png` — 完整 4A 效果（金奖杯 + 3 颗星 + 统计）
  - `phase4b-gold.png` — match 100% 金奖杯
  - `phase4b-silver.png` — match 88% 银奖杯
  - `phase4b-bronze.png` — match 63% 铜奖杯
  - `phase4c-pinyin-gold.png` — pinyin 100% 金奖杯
  - `phase4c-listen-silver.png` — listen 83% 银奖杯
  - `phase4c-stroop-bronze.png` — stroop 56% 铜奖杯

### 顺手修一个 bug

- 删除 `#complete-time` 后 `completeTime` 变量 = null，startGame 中途 `null.textContent = ...` 崩
- 修复：`completeTime = document.querySelector("#complete-stats")` + 4 处 `.textContent` 加 `if (completeTime)` 保护

### 顺手装中文字体

- 主人在 11:35 反馈截图全是方块（豆腐块）
- 根因：系统 0 个中文字体 + Playwright headless Chromium 无 fallback
- 修复：下载 Source Han Sans SC（思源黑体，16MB 开源）到 `~/.fonts/`，fc-cache 重建
- 之后所有截图都正常显示汉字
