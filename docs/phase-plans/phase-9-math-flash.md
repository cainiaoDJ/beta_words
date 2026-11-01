# Phase 9 — 算术闪卡 mathFlash（详细规划）

> 📁 上级文档：[`current/GAME_SOP.md`](../../current/GAME_SOP.md) §13 新增游戏流程
> 🎨 视觉规范：[`current/DESIGN_LANGUAGE.md`](../../current/DESIGN_LANGUAGE.md)
> 🧪 验收基准：`AGENTS.md`《基准要求：多设备兼容测试》
> 🖼 设计稿：[`../mockups/phase-9/`](../mockups/phase-9/)
>
> 状态：📐 设计稿已完成（7 屏 + 翻卡分解图 + 旧vs新对比图 + 5 张拼图）→ ✅ 主人已拍板 → ⏳ 待开发（Phase 9A 起）

---

## 🎯 目标

在现有 7 个游戏（match / memory / pinyinFriend / listenCard / stroopTrain / compare / idiomFill）基础上，**新增第 8 个游戏：算术闪卡（mathFlash）**。

规则一句话：

> 每次出一张闪卡，卡面上是一个 20 以内的加减算式，底下给 4 个数字选项，选对得分；一局固定 10 题，全对 3 星。

**4 个关卡**（按顺序递进）：

| 关卡 | 名称 | 算式范围 | 备注 |
|---|---|---|---|
| L1 | 10 以内加法 | `a + b ≤ 10` | 入门，不进位 |
| L2 | 10 以内减法 | `a − b ≥ 0`，`a ≤ 10` | 熟练，不退位 |
| L3 | 20 以内加法 | `a + b ≤ 20` | 进位（8+7=15） |
| L4 | 20 以内减法 | `a − b ≥ 0`，`a ≤ 20` | 退位（13−8=5） |

**每关固定 10 题**（不是 n×n 棋盘），**每题固定 4 个选项**。

---

## ⭐ 评分规则（主人拍板）

| 错题数 | 星级 | 附加效果 |
|---|---|---|
| 0（10/10 全对） | **3 星** | **撒花** + 吉祥物 celebrate + 金杯 |
| 1 ~ 3 | **2 星** | 银杯 + 小彩屑 |
| 4 ~ 9 | **1 星** | 铜杯 |
| 10（全错） | **0 星** | 无杯位，提示语鼓励再来一次 |

> ⚠️ **与现有 `calcStarCount()` 不同**：现有规则是按正确率分档（rate<0.5 → 0 星，<0.8 → 1 星，<1.0 → 2 星，全对 → 3 星）。主人这次要求按**错题数**分档（错 1-3 个就是 2 星，错 4-9 个就是 1 星），口径不同。
>
> **决策**：不改动现有 `calcStarCount()`（会影响 pinyinFriend / listenCard 等已有游戏），而是**新增 mathFlash 专用函数** `calcMathStars(wrongCount)`：
> ```js
> function calcMathStars(wrongCount) {
>   if (wrongCount === 0) return 3;
>   if (wrongCount <= 3) return 2;
>   if (wrongCount <= 9) return 1;
>   return 0;
> }
> ```
> 奖杯档位同理新增 `calcMathTrophy(wrongCount)`（0→无 / 1-3→铜 / 4-6→银 / 7+→金 中的对应），与星数映射保持一致：3星→金、2星→银、1星→铜、0星→无。

---

## ⏱ 困难模式（主人拍板）

**位置：游戏选关界面**（setup 页），是一个独立开关行，不占关卡按钮位。

| 项 | 值 |
|---|---|
| 每题限时 | **5 秒** |
| 超时行为 | **自动判错**，立即进入下一题 |
| 超时反馈 | 卡片转告警红、正确答案高亮 1.2 秒后翻页 |
| 开关状态 | 记住（localStorage），下次进选关页保持上次状态 |
| 开启时的表现 | HUD 中间计时器从"总用时"切换为**倒计时读秒**（5→1，剩 2 秒内变红脉冲）；卡片顶部加一条**剩余时间进度条**（语义 = 剩余，随倒计时收缩） |

**普通模式**保持现有 HUD 语义：中间计时器显示本局总用时。

---

## 🎨 主题色（第 8 套 token）

| ID | accent | bg | accent-soft | ink | glow | 视觉感受 |
|---|---|---|---|---|---|---|
| **mathFlash** | `#ec4899` 玫红 | `rgba(236,72,153,0.06)` | `rgba(236,72,153,0.15)` | `#be185d` | `rgba(236,72,153,0.4)` | 闪卡/活力，和已有 7 套色相都拉得开 |

> 选色依据：现有 7 套已占 橙 / 紫 / 蓝 / 绿 / 红 / 青绿 / 黄，玫红（320°）是唯一没占的色相段，且与 stroopTrain 的正红（0°）有足够区分度。
>
> 字母表由 `match` / `memory` / `pinyinFriend` / `listenCard` / `stroopTrain` / `compare` / `idiomFill` 覆盖，需要新增第 8 套。

---

## 🃏 算式卡重设计（主人拍板：纸质名片 + 翻卡）

**问题**：原设计是 300×300 正方形方框，没有"卡片感"，看起来就是个输入框。

**方案**：改成**横向名片比例的纸卡**，带真实纸感材质，并给一道**翻卡动效**。

### 尺寸与比例

| 项 | 值 | 说明 |
|---|---|---|
| 尺寸 | **332 × 200** | 比例 1.66，贴**标准名片 90×54mm（1.667）** |
| 宽度 | `min(100%, 332px)` | 与内容区等宽，比原 300px 更"占手" |
| 覆盖 | `aspect-ratio: 332 / 200` | 必须**覆盖** `.zone-primary` 的 `aspect-ratio: 1` + `display: grid`（否则会被压回正方形） |

### 纸质材质（4 层叠加）

| 层 | 实现 |
|---|---|
| 纸底 | `background-color: var(--tile)`（暖白 #fffef8）+ 顶部 `linear-gradient(180deg, rgba(255,255,255,.92), transparent 42%)` 高光 |
| 纤维纹理 | 两层 `repeating-linear-gradient`（1px 竖线 / 1px 横线，透明度 .035~.045），间距 3px |
| 纸边 | `border: 1px solid rgba(122,100,68,.16)` + `inset 0 1px 0 rgba(255,255,255,.95)` 上沿高光 + `inset 0 -1px 0 rgba(122,100,68,.08)` 下沿厚度 |
| 投影 | 分层：`0 2px 3px rgba(31,44,36,.1)` 接触影 + `0 14px 22px -12px rgba(31,44,36,.3)` 环境影 → 纸片浮在桌面上 |

### 摆放姿态
- 正面 `transform: rotate(-2deg)` —— 随手放在桌上的轻微倾斜
- 背面 `transform: rotateY(180deg) rotate(-2deg)` —— 翻转后仍保持同一倾角

### 翻卡动效

**结构**（双面卡）：
```
.math-card            ← perspective: 1400px
  .math-card__inner   ← transform-style: preserve-3d; transition: transform 480ms
    .math-card__face--front   ← backface-visibility: hidden（题目面）
    .math-card__face--back    ← backface-visibility: hidden（素纸背面）
```

**翻页流程（答对 / 答错都翻）**：
1. 答对 → 绿高亮 + spring 动效 → 停留 600ms → 翻页
2. 答错 → 错项红抖动 + **正确答案绿高亮并闪动 3 次** → 停留 900ms → 翻页
3. 翻页 = 旧卡绕 Y 轴 `rotateY(0 → -180deg)` 翻走，同时新题卡从背面 `rotateY(180 → 0)` 转出

**关键参数**：
- 过渡时长 **480ms**，缓动 `cubic-bezier(0.3, 0, 0.2, 1)`
- `perspective: 1400px`（太小平透视弱，太大像贴纸）
- 背面素纸 `#faf6ec` + 同款纤维纹理 + 极淡水印 `rgba(236,72,153,.1)`
- 动效中额外露出**纸卡折脊**：`.math-card__face--front::after`（右侧 7px 竖条，`translateZ(9px)`，仅动效态 `opacity:1`）

> ⚠️ **实测坑（已踩）**：`rotateY(-90deg)` 时正反两面同时侧立且 `backface-visibility:hidden`，**整张卡会消失**。所以"侧立中段"帧必须用 `-65deg`（还剩 ~42% 宽）而不是 `-90deg`。设计稿的 `flip-diagram.png` 就是用 0° / -30° / -65° / -180° 四帧来表达的。

### 卡面元素
- 左上角：关卡标签 `.math-card__badge`（粉底 + `--theme-ink` 字）
- 右上角：`第 N 题`（`--muted`）
- 中央算式：52px，数字 `--ink`，`+ − = ?` 用 `--theme-ink` / `--theme-accent`，`font-variant-numeric: tabular-nums`
- 算式区 `inset: 30px 0 8px`（给抬头让位），`display:flex` 横排（**注意**：用 `grid` 会让每个 span 变成一行，竖排）

---

---

## 🖼 设计稿（7 屏 + 1 张动效分解图）

全部用**线上真实 `styles.css`** 渲染，只叠加 mathFlash 专属样式，保证色调与现网完全一致。

| 文件 | 界面 | 说明 |
|---|---|---|
| `out/01-lobby.png` | 大厅 | 新增第 8 个入口"算术闪卡 / 算一算，选答案" |
| `out/02-setup.png` | 选关 | 4 个关卡卡 + 底部困难模式开关（默认关） |
| `out/03-play.png` | 游戏中（普通） | 闪卡 `4 + 3 = ?` + 2×2 选项 |
| `out/04-play-hard.png` | 游戏中（困难） | 卡片顶部剩余时间条 + 告警红边框 + HUD 红色倒计时 |
| `out/05-wrong.png` | 答错反馈 | 选错项红抖动 + 正确答案绿高亮 |
| `out/06-complete-3star.png` | 完成（3 星） | 金杯 + 3 星点亮 + 撒花 + 新纪录 |
| `out/07-complete-1star.png` | 完成（1 星） | 铜杯 + 1 星点亮 + 无撒花 |
| `out/flip-diagram.png` | **翻卡动效分解图** | 4 帧（正面 / −30° / −65° / 背面）宽幅图，说明纸质卡的翻转过程 |
| `out/card-compare.png` | **卡片改版 旧 vs 新** | 左 300×300 方框，右 332×200 纸卡三态（正面 / 翻起 52° / 背面）+ 改动清单 |
| `out/sheet-0-overview.png` | 总览拼图 | 7 屏一览 |
| `out/sheet-1-card-compare.png` | 卡片对比（放大） | |
| `out/sheet-2-flip.png` | 翻卡分解（放大） | |
| `out/sheet-3-play.png` | 游戏中三态拼图 | 普通 / 困难 / 答错 |
| `out/sheet-4-setup-complete.png` | 选关与结算拼图 | |

重跑设计稿：
```bash
cd docs/mockups/phase-9
python3 gen_mockups.py        # 7 屏手机稿
python3 gen_flip_diagram.py   # 翻卡动效分解图
python3 gen_card_compare.py   # 旧 vs 新 对比图
```

### 界面规格

**A. 大厅入口**
- 位置：`.game-list` 中「看字识颜色」与「成语填空」之间（第 7 个），2 列网格 → 落在第 4 行右位，第 5 行只放「成语填空」；右下角是**吉祥物 mascot-companion**（线上本来就有，非渲染缺失）
- 图标：`assets/icon-math-flash.svg`（32×32，白卡 + 粉色加号 + 粉色横线，呼应"闪卡"）
- 文案：标题「算术闪卡」（4 字，符合 SOP 大厅入口准则）+ 副标「算一算，选答案」

**B. 选关界面**
- 复用现有 `#setup .difficulty-grid`（2 列），4 个关卡卡 + 隐藏第 5 个
- 每卡：`<strong>` 关卡名 + `<span>` "10 题 · 入门/熟练/进位/退位"
- L1 标 `data-recommended="true"`（复用现有"⭐ 推荐"角标）
- 底部新增 `.mode-row`：左「困难模式 / 每题 5 秒，超时算错」+ 右 `.toggle-switch`（复用现有 BGM 开关组件）

**C. 游戏中（普通）**
- HUD：左 `3 / 10` 进度 / 中 `00:12` 总用时 / 右 `选一个答案`
- **纸卡：332×200 名片比例**，倾斜 −2°，左上角关卡标签、右上角「第 N 题」，中央 52px 算式
- 选项：2×2 网格，数字 **44px**、按钮 `min-height: 96px`（大按钮更好点），`tabular-nums`

**D. 游戏中（困难）**
- 卡片**下缘** 5px 剩余时间条（玫红 → 剩 2 秒转 `rgb(var(--color-danger))`）
- 卡片边框转告警红 + 红调阴影（`0 14px 22px -12px rgba(216,109,76,.42)`）
- HUD 中间：红色倒计时数字，剩 2 秒内脉冲

**E. 答错反馈（翻页之前）**
- 复用现有 `.option-button.is-wrong`（红 + shake）与 `.is-correct`（绿 + spring）
- **新增 `.is-flashing`**：正确答案绿底 + 4px 绿色光晕，`animation: math-correct-flash .42s ease-in-out 3 alternate`（闪 3 次，约 1.26s）
- 闪动结束后**再翻页**（旧卡翻走 + 新题卡转出）
- HUD 提示改「再想想」，吉祥物切 sad

**F. 完成面板**
- 完全复用现有 `#complete-panel` 结构（金杯 / 3 星 / 标题 / 统计 / 新纪录 / 3 按钮）
- 仅换奖杯档位映射 + 星星数算法 + 标题文案
- 撒花复用现有 `spawnConfetti()`，但**只在 3 星时撒**

---

## 🛠 实施 stages

### Phase 9A — 数据 + 注册 + 主题色 + 大厅入口 + 静态选关页

**R-9A.1** `app.js` 新增关卡配置 + 题目生成器

```js
const MATH_FLASH_LEVELS = {
  3: { name: "10 以内加法", sub: "入门", op: "+", max: 10, min: 0, carry: false },
  4: { name: "10 以内减法", sub: "熟练", op: "−", max: 10, min: 0, carry: false },
  5: { name: "20 以内加法", sub: "进位", op: "+", max: 20, min: 0, carry: true },
  6: { name: "20 以内减法", sub: "退位", op: "−", max: 20, min: 0, carry: true },
};

// 10 以内加法：a,b ∈ [1,9]，a+b ≤ 10，不进位
// 10 以内减法：a ∈ [2,10]，b ∈ [1,a]，a-b ∈ [0,9]
// 20 以内加法：a,b ∈ [1,10]，a+b ∈ [11,20]（保证进位），或 ≤10 也可
// 20 以内减法：a ∈ [11,20]，b ∈ [1,9]，a-b ∈ [2,19]（保证退位）
function createMathQuestions(level) { /* 返回 10 题 */ }
```

**R-9A.2** 干扰项生成规则（4 选 1 的另外 3 个）

- 正确答案 `ans` 必须落在该关卡合法区间
- 3 个干扰项按优先级取：`ans±1` → `ans±2` → `ans±3` → `ans±10` → `ans±5`
- 过滤掉：超出该关卡区间、非整数、重复值
- 补不满 3 个时用区间内随机数兜底
- 4 个选项**打乱顺序**后展示（用现有 `shuffleArray()`），避免答案位置固定

**R-9A.3** `GAMES` 注册第 8 个游戏

```js
mathFlash: {
  id: "mathFlash",
  name: "算术闪卡",
  title: "算一算，选答案",
  boardLabel: "算术闪卡题目区",
  startHint: "选一个答案",
  recordPrefix: "beta_words_mathflash_best"
}
```

**R-9A.4** 主题色 token（第 8 套）+ `[data-game="mathFlash"]` 映射

**R-9A.5** 大厅入口 + `assets/icon-math-flash.svg`

**R-9A.6** `syncSetupForGame()` 扩展 mathFlash 分支：4 个关卡卡文案 + 隐藏第 5 个 + 显示困难模式行
（沿用 compare 的现成模式，见 `app.js:709`）

**R-9A.7** `setRecommendedDifficulty()` 加 `mathFlash: 3`

**验收**：大厅能进选关页，4 关卡显示正确，困难模式开关可点；`mobile-one-screen-test.js` 加 `open-math-flash` 后仍 0 fail

**Commit**：`feat(math-flash): 注册游戏 + 主题色 + 大厅入口 + 选关页`

---

### Phase 9B — 出题 + 4 选项渲染 + 答题判定

**R-9B.1** `state` 新增字段
```js
mathQuestions: [],     // 本局 10 题
mathCursor: 0,         // 当前题序
mathCorrectCount: 0,   // 已答对
mathWrongCount: 0,     // 已答错
mathLocked: false,     // 本题已判定，锁输入
mathHard: false,       // 困难模式
mathTimeoutId: null,   // 困难模式倒计时 handle
mathDeadline: 0,       // 当前题截止时间戳
```

**R-9B.2** `#math-host` DOM（独立 zone-stack，不复用 `#quiz`）
```
#math-host.math-host.zone-stack
  ├─ .math-card.zone-primary      ← 闪卡（算式 + 倒计时条 + 关卡标签）
  └─ .option-grid.zone-secondary  ← 4 个数字选项
```
> 与 compare / idiomFill 同样的"独立 host"模式，避免动到现有 quiz 逻辑。

**R-9B.3** `renderMathQuestion()`：渲染算式 + 4 个选项（打乱后）

**R-9B.4** `handleMathOptionClick(option, button)`
- 命中 → `.is-correct` + `state.mathCorrectCount++` + 撒小彩屑 + 语音 `prompt.correct` + **600ms 后翻页**
- 未命中 → `.is-wrong` + `state.mathWrongCount++` + **正确答案加 `.is-flashing`（绿高亮 + 闪 3 次）** + 语音 `prompt.tryAgain` + **900ms 后翻页**
- 本题计为已答（`state.mathLocked = true`），锁定其余选项，不再重复扣分

> ⚠️ 关键设计：**答错也要推进**。10 题固定，错了就计入 `mathWrongCount`，翻页进下一题。
> 这与 pinyinFriend 的"答错留在原题重来"不同——本游戏按"错几题"评星，留在原题会导致题目永远做不完。
>
> ⚠️ 主人明确要求：**答错即翻页，翻页之前高亮并闪动正确答案**。所以顺序必须是
> 「红抖动 → 正确项绿闪（3 次 ≈1.26s）→ 再翻页」，不能反过来。

**R-9B.5** `flipMathCard(nextRenderFn)` — 翻页动效
```js
function flipMathCard() {
  const host = document.getElementById("math-host");
  // 旧卡翻走：.math-card__inner rotateY(0 → -180deg)
  // 新卡从背面转出：下一题卡以 rotateY(180deg) 起步，再转回 0
}
```
- DOM 结构：同一时刻两张卡叠放（`.math-flip-pair`），旧卡 `is-out`、新卡 `is-in`
- 旧卡 `transform: rotateY(-82deg) translateX(-40px) translateZ(-10px)`（起步）
- 新卡 `transform: rotateY(180deg) translateX(40px)` → 480ms 后到 `rotateY(0)`
- ⚠️ **不能用 -90deg**：正反两面同时侧立 + `backface-visibility:hidden` → 整张卡消失
- 翻页结束后清理旧卡节点，避免 DOM 堆积

**R-9B.6** `completeMathFlash()`：算星 + 算杯 + 标题 + 统计 + 撒花（仅 3 星）+ 记录最佳成绩

**R-9B.7** 纸卡 DOM（写在 index.html 的 `#math-host` 里）
```html
<div id="math-host" class="math-host zone-stack" hidden>
  <div class="math-flip-pair">
    <div class="math-card zone-primary">
      <div class="math-card__inner">
        <div class="math-card__face math-card__face--front">
          <div class="math-card__timer"><i style="width:100%"></i></div>
          <div class="math-card__head">
            <span class="math-card__badge">10 以内加法</span>
            <span class="math-card__label">第 1 题</span>
          </div>
          <div class="math-eq"><span>4</span><span class="op">+</span><span>3</span><span class="op">=</span><span class="q">?</span></div>
        </div>
        <div class="math-card__face math-card__face--back"></div>
      </div>
    </div>
  </div>
  <div class="option-grid zone-secondary" role="list"></div>
</div>
```

**验收**：普通模式 10 题能跑完，星级按错题数正确，3 星有撒花，答错时正确项闪动后才翻页

**Commit**：`feat(math-flash): 出题 + 4 选项 + 答题判定 + 星级 + 纸质翻卡`

---

### Phase 9C — 困难模式（5 秒倒计时）

**R-9C.1** 选关页 `.mode-row` 开关 → `state.mathHard`，并写 localStorage（`beta_words_mathflash_hard`）

**R-9C.2** 每题开始时启动 5 秒倒计时
- 用 `requestAnimationFrame` 或 `setInterval(100ms)` 驱动
- 剩余时间写入 `.math-card__timer i` 的 `width`（语义 = 剩余）
- HUD 中间计时器切到倒计时读秒

**R-9C.3** 超时处理 `onMathTimeout()`
- 标记 `mathWrongCount++`
- 卡片加 `.is-urgent`（红边框 + 红色时间条）
- **正确答案加 `.is-flashing`（绿高亮闪动）**，与答错同款
- 语音 `prompt.tryAgain`
- 闪动结束（1.26s）后翻页进下一题

**R-9C.4** `leaveGame()` 清理倒计时 handle（`state.mathTimeoutId`），与现有 `stopMemoryCountdown()` / `stopTimer()` 同款处理

**验收**：困难模式超时会自动判错并翻页；退出游戏后无残留计时器

**Commit**：`feat(math-flash): 困难模式 5 秒倒计时 + 超时判错`

---

### Phase 9D — 测试 + 部署

**R-9D.1** `scripts/mobile-one-screen-test.js`
- `GAMES` 数组加 `'open-math-flash'`
- `GAME_SIZES['open-math-flash'] = [3, 4, 5, 6]`
- `ZONE_EXPECT['math-flash'] = { primary: 1, secondary: 1, toolbar: 0 }`
- 断言全部通过（Failed = 0），7 个 viewport × 新增状态

**R-9D.2** 补一条**逻辑单测**（新建 `scripts/math-flash-test.js`）
- 星级映射：错 0/1/3/4/9/10 → 3/2/2/1/1/0
- 题目合法性：每关 10 题，结果都在该关区间内
- 干扰项合法性：4 个选项互不相同、恰有 1 个是正确答案、且都在区间内
- 超时判错：模拟 timeout 后 `mathWrongCount` 递增且题序推进

**R-9D.3** 部署（走 `static-site-deploy` skill，tar + ssh 流式同步）
- 备份 → 上传 → 校验 md5 → 原子替换 → 重读线上 md5

**Commit**：`test(math-flash): 多设备兼容 + 逻辑单测` / `deploy: 上线算术闪卡`

---

## ⚠️ 风险与已知坑

| # | 风险 | 处理 |
|---|---|---|
| 1 | **星级口径与现有 `calcStarCount()` 不同** | 不改现有函数，新增 mathFlash 专用函数，避免影响 pinyinFriend / listenCard |
| 2 | **`.option-button` 带 `padding-right: 36px !important`**（为拼音题小耳朵留位） | mathFlash 选项必须覆盖为 `padding: 8px 12px !important` + `justify-content: center`，否则数字整体偏左（**已在设计稿阶段实测发现并修掉**） |
| 3 | **色板 token 是 RGB 三元组**（`--color-danger: 216 109 76`） | 必须写 `rgb(var(--color-danger))`，直接 `var(--color-danger)` 会让整条声明失效（**已在设计稿阶段实测发现并修掉**） |
| 4 | 大厅加第 8 个入口后高度逼近上限 | 实测 8 个入口时 lobby scrollHeight = 615 ≤ 640，**不溢出**；但只剩 25px 余量，后续再加游戏必须重排大厅 |
| 5 | 困难模式计时器泄漏 | `leaveGame()` 必须清 handle；`leaveGame` 已有同类清理先例 |
| 6 | 小屏（320×568）字号 | 选项 32px + 算式 54px 在 320 宽下需复核，Phase 9D 测试必须覆盖 |
| 7 | 现有 `.zone-primary` 强制 1:1 方形 + `display:grid` | 纸卡必须覆盖 `aspect-ratio: 332/200` + `display:block`，否则被压回正方形（**已在设计稿阶段实测并修掉**） |
| 8 | `.zone-primary` 宽度是 `min(100%, var(--primary-size))`（300px） | 纸卡要占满内容宽，需在 `.math-host` 里覆盖 `--primary-size: 332px` / `--secondary-w: 332px` |
| 9 | `rotateY(-90deg)` 时卡片整张消失 | 正反两面同时侧立 + `backface-visibility:hidden`。侧立帧最多到 `-65deg`，翻走起点用 `-82deg` |
| 10 | `backface-visibility:hidden` 与 `overflow:hidden` 冲突 | 卡片容器不能加 `overflow:hidden`，否则 3D 变换被压平，翻卡变成 2D 缩放 |

---

## 🚦 验收 Checklist

- [x] 大厅出现「算术闪卡」入口，图标正常
- [x] 选关页 4 个关卡文案正确，第 5 个隐藏，L1 带"⭐ 推荐"
- [x] 困难模式开关能开能关，状态跨会话保持（localStorage `beta_words_mathflash_hard`）
- [x] 每关固定 10 题，算式全部落在该关区间内
- [x] 每题 4 个选项，位置打乱，恰有 1 个正确
- [x] 答对：绿 + 彩屑 + 语音 + 600ms 翻页
- [x] 答错：红抖动 + **正确答案绿高亮闪动 3 次** → 再翻页（顺序不能反）
- [x] 纸卡为正方形（300×300），有纸纹/投影，**摆正不倾斜**（2026-11-01 主人定稿）
- [x] 算式字号 52px → 48px（正方形卡片内最宽合法算式 `10+10=?` 仍留 10px 以上余量）
- [x] 翻页动效：旧卡侧立翻走、新卡从背面转出，全程 480ms，不闪白不消失
- [x] 星级按错题数：0→3★ / 1-3→2★ / 4-9→1★ / 10→0★
- [x] 3 星时撒花，1-2 星不撒
- [x] 困难模式：5 秒倒计时可视，超时自动判错并翻页
- [x] 完成面板显示奖杯 + 星星 + 统计 + 新纪录
- [x] `mobile-one-screen-test.js` Failed = 0
- [x] `math-flash-test.js` 全绿
- [x] 线上 md5 与本地一致（**已部署 2026-11-01 10:24**）

### ✅ 部署记录（2026-11-01）

- **服务器**：`sophie520:/var/www/games/current/`（nginx `location ^~ /games/ { alias /var/www/games/current/; }`）
- **基准**：部署前线上 md5 == `4743b11`（= 本分支基线）→ 只带 mathFlash 增量
- **注意**：服务器上另有一个嵌套残留目录 `/var/www/games/current/current/`（旧构建 `da6aea7`），
  公网 `/games/current/` 会打到它；本次**两条路径都更新**，避免同一站点两个版本
- **发布文件**：`app.js` / `index.html` / `styles.css` / `engine/math-flash.js` / `assets/icon-math-flash.svg`
- **方式**：scp 到 `.tmp` → 校验 md5 → `mv` 原子替换 → 回读远端 md5 比对
- **回滚点**：
  - `/var/www/games/current.bak-mathflash-outer-4743b11-20261101-102406`
  - `/var/www/games/current.bak-mathflash-nested-da6aea7-20261101-102406`
- **线上验证**：
  - 公网 md5 与本地 5 个文件全部一致（`/games/` 与 `/games/current/` 两条路径）
  - `mobile-one-screen-test.js` 跑公网：`Total: 462, Failed: 0`（9 游戏 × 7 视口）
  - 真实浏览器走查：全对 → 3 星 + 金杯 + “全对啦！”；错 9 个 → 1 星 + 铜杯 + “差一点点”
  - 困难模式：倒计时 5→4→3→2，≤2s 触发 `is-urgent`，超时自动判错并翻页
  - 0 page error；其余 8 个游戏入口与行为未受影响（`styles.css`/`index.html` 相对基线**零删除行**）

---

## ✅ 开发完成记录（2026-11-01，feat/math-flash）

**实现分工**：DOM/CSS 契约由 Hermes 落盘（`current/index.html` + `current/styles.css`），
纯逻辑引擎 + `app.js` 交互 + 测试由 Codex 写。

**提交**（分支 `feat/math-flash`，未 push）：
- `7c21a90` feat(math-flash): 出题引擎 + 4 选项 + 星级判定 + 纸质翻卡 + 困难模式
- `6f1bc76` test(math-flash): 多设备兼容 + 逻辑单测

**新增文件**：`current/engine/math-flash.js`（纯逻辑，Node 可 require，零 DOM 依赖）。

**验收实测**：
- `node --check` × 4 文件 → 全通过
- `node scripts/math-flash-test.js` → 逻辑单测：通过 8，失败 0
- `BASE_URL=http://127.0.0.1:4176/current/ node scripts/mobile-one-screen-test.js` → Total: 462, Failed: 0（9 个游戏 × 7 视口）
- 补充视口检查（桌面/横屏/iPad）→ Total: 80, Failed: 0
- 真浏览器手动走查：全对 → 3 星 + 金杯 + 撒花 + "全对啦！"；答错 → 红抖动 + 正确项绿闪 → 翻页；困难模式 → 5→1 倒计时 + 超时自动判错 + 绿闪 + 翻页；切到别的游戏困难开关自动隐藏。

### ⚠️ 开发中踩到的两个上游历史 bug（已修的是测试，不是游戏代码）

| # | 现象 | 根因 | 处理 |
|---|---|---|---|
| A | `mobile-one-screen-test.js` 直接崩（不是软失败） | `GAME_SIZES['open-compare']` 写了 `[3,5,7]`，但 compare 在选关页隐藏 `data-size="7"`（`COMPARE_LEVELS` 只有 3~6）→ Playwright 点隐藏按钮超时 | 测试改成 `[3,5,6]`（**游戏代码没动**） |
| B | Stroop 的 zone 断言数对不上 | `app.js` 里 `stroopBoard.className = "stroop-track"` **整体替换**了 class，抹掉了 `zone-primary`；同时 `styles.css` 里 `.stroop-select { display:none !important }`，待选区本来就不显示 | 测试改用 `#stroop-board.stroop-track` 作为 primary，secondary 期望值改 0（**游戏代码没动**） |

> 这两条都是**测试脚本与线上真实 DOM 不一致**，不是本次 mathFlash 引入的，也不是游戏功能缺陷。

---

## ✅ 设计稿阶段实测结论（开发前已踩完的坑）

设计稿不是画出来的，是**用线上真实 `styles.css` 渲染 + 逐屏视觉核对**跑出来的，以下 4 个问题在写代码前就已发现并修掉：

| # | 问题 | 现象 | 修法 |
|---|---|---|---|
| 1 | `.option-button` 的 `padding-right: 36px !important` | 4 个选项数字整体偏左，不居中 | mathFlash 选项覆盖为 `padding: 8px 12px !important` + `justify-content: center` |
| 2 | 色板 token 是 RGB 三元组 | `border-color: var(--color-danger)` **整条声明失效**，卡片边框回退成 `#222`；倒计时条填充变透明 | 一律写 `rgb(var(--color-danger))` |
| 3 | `10 以内加法` 配了 `7 + 5 = 12` | 算式超出该关卡区间（和 > 10），教学上超纲 | 改为 `4 + 3 = ?`；L3 用 `9 + 8 = ?`（进位） |
| 4 | 抓帧时机不稳 | 动画未结束被拍到 → 整屏半透明发白 | 设计稿渲染统一 `animation: none`，撒花改静态散落 |
| 5 | 算式用 `display:grid` 排版 | 每个 `span` 变成独立一行 → 算式竖排且底部被裁 | 改 `display:flex` + `align-items/justify-content: center` + `white-space: nowrap` |
| 6 | 卡片 `inset: 0` 居中算式 | 算式压住抬头行 | 算式区改 `inset: 30px 0 8px` 给抬头让位 |
| 7 | 单帧截图表达不了 3D 翻转 | 中段帧看着像"两张卡叠着"，读不出翻页 | 另出一张宽幅**动效分解图**（0° / -30° / -65° / -180° 四帧） |

另外核对过：右下角那个"笑脸卡片+绿笔"图标是**线上的吉祥物 mascot-companion**，不是渲染缺失；奖杯 SVG 里的数字 1/2/3 是**现有奖杯等级标记**，沿用不。

### 开发时的等价注意事项

上面 7 条在写进 `current/styles.css` 时要**原样带上**，否则真机会重现同样的错位/失效。

另：设计稿渲染脚本里 `mockup-frame.css` 会关掉所有动画与过渡，这是**截图需要**，写进 `current/styles.css` 时**不能带**。

---

## ✅ 主人已拍板（2026-10-31）

| # | 议题 | 结论 |
|---|---|---|
| 1 | 星级口径 | **按错题数**：全对 3 星（撒花）/ 错 1-3 → 2 星 / 错 4-9 → 1 星 / 全错 0 星。新增 `calcMathStars(wrongCount)`，**不动** 现有 `calcStarCount()` |
| 2 | 答错后的流程 | **答错即翻页**；翻页**之前**先把**正确答案高亮并闪动**（不是停在原题重来） |
| 3 | 主题色 | **玫红 `#ec4899` 认可**，按第 8 套 token 落地 |
| 4 | 算式卡重设计 | **取消正方形方框** → 改**名片比例横向卡（332×200，比例 1.66）+ 纸质材质 + 翻卡动效** |

> 第 4 项的详细规格见下方「🃏 算式卡重设计（纸质名片翻卡）」。

---
