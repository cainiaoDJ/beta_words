# Phase 11 — 算术闪卡改造：全量随机出题 + 计时评星

> 状态：**规划待拍板**（尚未写代码）
> 基线：`main` @ `d14f44c`（= 线上 sophie520 `/var/www/games/current/`，4 文件 md5 已核一致）
> 分支：`feat/math-flash-timed-deck`

---

## 1. 目标

把算术闪卡从「每关 10 题、按错题数评星、带困难模式」改成：

- **全量随机出完**：每关的闪卡知识点**去重成 45 张**，随机洗牌后**一张不漏全部出完**
- **计时评星**：整局总耗时决定星级
  - ≤ 90 秒 → ★★★
  - ≤ 150 秒 → ★★
  - > 150 秒 → ★
- **移除困难模式**：不再有每题 5 秒倒计时

---

## 2. 为什么"45 张"是对的（核心发现）

四个关卡的**人教版一年级上册口算表题量恰好都是 45 小题**。这是硬约束，不是拍脑袋：

| 关卡 | 知识点 | 卡片数 |
|---|---|---|
| L1 | 10 以内加法 | 45 |
| L2 | 10 以内减法 | 45 |
| L3 | 20 以内进位加法 | 45 |
| L4 | 20 以内退位减法 | 45 |

**时间预算换算**（反馈动画 0.6 秒/题，实测 `showMathFeedback` 延时 600ms / 错误 1300ms）：

| 星级 | 总时长 | 每题毛时间 | 扣 0.6s 反馈后的纯思考时间 |
|---|---|---|---|
| ★★★ | 90s | 2.00s | **1.40s** |
| ★★ | 150s | 3.33s | **2.73s** |

对一年级孩子：10 以内加减法熟练后 1.4 秒一题可达（三星）；进位/退位题 2.7 秒一题是二星线。**四关同题量 → 四关同时间预算 → 星级可横向比较**。这是"每关都是 45 张"最重要的理由。

反例：如果沿用现有题池（L2=54 / L3=55 张），90 秒要每题 1.67 秒，进位加法几乎不可能三星；星级会变成"关卡专属时间表"，失去统一口径。

---

## 3. 规则表（拍板版）

### 3.1 出题

| 项 | 规则 |
|---|---|
| 题池 | 每关 **45 张唯一知识点卡**，去重后固定 |
| 出题顺序 | **洗牌后全量出完**，每张卡恰好出现 1 次，无重复、无遗漏 |
| 题目总数 | 45（每关相同） |
| 进度显示 | `第 N / 45 题` |
| 答错 | **不重出**（计入错题，不占用额外时间），继续下一题 |
| 计时起点 | 首题出现瞬间（`startTimer()` 已有） |
| 计时终点 | 第 45 题判定完成的瞬间 |

### 3.2 评星（只看时间）

| 条件 | 星级 | 奖杯 | 标题文案 |
|---|---|---|---|
| elapsed ≤ 90000ms | ★★★ | gold | 太快啦！ |
| elapsed ≤ 150000ms | ★★ | silver | 稳稳的！ |
| 其它 | ★ | bronze | 完成啦！ |

- **最低 1 星**：只要出完 45 题就有 ★（原规则错满 10 题是 0 星）—— 计时制不该有 0 星，这是本规则的内建含义。
- **错题不再扣星**，但**完成面板仍显示答对数**（`答对 38 / 45（84%）`），作为正确率信息保留，不参与评星。
- **奖杯档位**沿用现有 `.trophy[data-tier]`（gold/silver/bronze），但**必须新增专用函数**，不能改 `calcTrophyTier`（那个被 match/memory/compare 等 7 个游戏共用）。

### 3.3 移除困难模式

删除范围（逐项核对过引用）：

| 位置 | 内容 |
|---|---|
| `current/index.html` | `#math-hard-row` 整块（mode-row + toggle-switch） |
| `current/app.js` | `state.mathHard`、`restoreMathHard()`、`#math-hard-toggle` 事件、`startMathCountdown()`、`stopMathCountdown()`、`handleMathTimeout()`、`MathFlashEngine.submitTimeout()`、`mathDeadline`/`mathTickId` |
| `current/app.js` | badge 文案 `+ " · 困难"` 拼接 |
| `current/styles.css` | `.math-card__timer`、`.math-card.is-urgent` 相关规则 |
| `current/app.js` | `localStorage` key `beta_words_mathflash_hard` |
| `current/index.html` | 卡面 `.math-card__timer` 进度条 DOM |

**保留**：`.toggle-switch` / `.toggle-knob` 样式 —— BGM 开关（`#bgm-toggle`）在用，不能删。

---

## 4. 逐屏规格

### 4.1 选关页（`#setup`）

```
┌──────────────────────────────┐
│  ← 返回        选择难度        │
├──────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  │
│  │ 10以内加法 │  │ 10以内减法 │  │
│  │ 45题·入门 │  │ 45题·熟练 │  │   ← sub 改为题数
│  └──────────┘  └──────────┘  │
│  ┌──────────┐  ┌──────────┐  │
│  │20以内加法 │  │20以内减法 │  │
│  │ 45题·进位 │  │ 45题·退位 │  │
│  └──────────┘  └──────────┘  │
│  （困难模式开关整行删除）      │
└──────────────────────────────┘
```

改动：
- `LEVELS[x].sub` 由 `"10 题 · 入门"` → `"45 题 · 入门"`（4 关全改）
- 删掉 `#math-hard-row`
- 选关页不再有额外行 → 高度**减少**，移动端一屏测试不会因此失败（只会更宽松）

### 4.2 游戏页（`#game`）

HUD 三格不变（进度 / 计时 / 提示），语义变：

```
┌──────────────────────────────┐
│  ← 换关卡    算术闪卡          │
│              算一算，选答案     │
├──────────────────────────────┤
│   12 / 45        00:24      │  ← 进度 / 总计时
│                选一个答案       │
├──────────────────────────────┤
│      ┌────────────────┐      │
│      │  10 以内加法   │      │  ← badge 不再拼「· 困难」
│      │      第 12 题   │      │
│      │   4 + 3 = ?    │      │
│      └────────────────┘      │
│      ┌──┐ ┌──┐ ┌──┐ ┌──┐    │
│      │ 5│ │ 6│ │ 7│ │ 8│    │
│      └──┘ └──┘ └──┘ └──┘    │
└──────────────────────────────┘
```

改动：
- 进度 `session.cursor + 1} / 10` → `/ 45`
- 计时器现在是**全局总计时**，不再是困难模式的每题倒计时。**关键**：`updateTimerDisplay()` 的变橙/变红阈值（30s/60s）是全局共用的，90 秒/150 秒的新阈值**不能改全局函数**（会影响其他 8 个游戏）→ 需给算术闪卡**新增专用计时显示函数**或按游戏分支。
- 卡面 `.math-card__timer` 进度条 DOM 删除（那是困难模式专用）
- `.math-card.is-urgent` 样式删除

### 4.3 完成面板（`#complete-panel`）

```
┌──────────────────────────────┐
│            🏆                │
│         ★ ★ ★                │
│         太快啦！              │
│      用时 01:12              │
│    答对 38 / 45（84%）         │
│       新纪录！                │
│   [ 再玩一次 ]                │
│   [ 下一关 ]                  │
│   [ 回大厅 ]                  │
└──────────────────────────────┘
```

改动：
- `completeTime.textContent`：`用时 X\n答对 N / 45（p%）`
- `complete-stats` 已有 `white-space: pre-line`，两行 OK
- 星级显示改为按时间
- **奖杯**：直接复用 index.html 现有的三档奖杯 SVG（bronze/silver/gold，`data-tier` + `hidden`），只改显示哪一档 → **不新增任何奖杯图形代码**
- **统计字号必须降**：见下方 R8
- **最佳记录逻辑要重写**：原逻辑是 `session.correctCount > 0 && elapsed < best.elapsedMs`，且 key 是 `beta_words_mathflash_best_{size}`。计时制下应该**只比时间**，且旧记录是"10 题制"的，**必须换 key**（否则旧的 10 题成绩会跟新的 45 题成绩串味）→ 新 key 如 `beta_words_mathflash_timed_best_{size}`。

### R8（实测发现）：统计文案在 32px 下必然折行

真实浏览器实测（360px 视口，面板内可用宽度 **280px**）：

| 文案 | 32px（现值） | 28px | 26px | 24px |
|---|---|---|---|---|
| `答对 38 / 45（84%）` | 339 **超+59** | 296 超+16 | 275 ✅ | 254 ✅ |
| `答对 45 / 45（100%）` | 361 **超+81** | 316 超+36 | 293 **超+13** | 271 ✅ |
| `答对 45 / 45（0%）` | 317 超+37 | 277 ✅ | 257 ✅ | 237 ✅ |

- 现有文案是 `答对 10 / 10（100%）`，短得多，所以 32px 一直没暴露问题
- **结论：算术闪卡完成面板统计降到 24px 最坏值 271px < 280px，全档安全**
- `.complete-stats` 被 8 个游戏共用 → **不能改全局字号**，用算术闪卡专用修饰类 `.complete-stats--timed { font-size: 24px }`

### R9（实测发现）：`complete-title` 的 tier 只有三档，一星没档位

现有 `data-tier` 只有 `perfect` / `good` / `tryAgain`（灰）。计时制下 1 星是"完成啦"（不是失败），复用 `tryAgain` 的灰色会传达错误情绪 → **新增 `ok` 档**（灰但偏中性，或直接用 `good` 色淡一档）。

> ⚠️ `.complete-title[data-tier="tryAgain"]` 是共用样式，**新增 `ok` 而不是改 `tryAgain` 的颜色**。

---

## 5. 引擎改动（`current/engine/math-flash.js`）

### 5.1 题池重建

当前 `createQuestion()` 每次调用都**重新穷举全池 + 随机抽一张**，导致：
1. 同一题可能重复出现（如 `10+10` 可能出两次）
2. 无法保证"全部出完"

改为：启动时构建一次**去重的 45 张卡片池** → 洗牌 → 依次发牌。

```js
// 每关固定 45 张唯一知识点卡
function buildDeck(size) {
  const level = LEVELS[size];
  const seen = new Set();
  const cards = [];
  for (let a = 1; a <= 20; a++) {
    for (let b = 1; b <= 10; b++) {
      const answer = level.op === "+" ? a + b : a - b;
      if (!isValidCard(size, a, b, answer)) continue;
      const key = `${a}-${b}`;           // 去重键
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push({ a, b, op: level.op, answer });
    }
  }
  return shuffle(cards);
}
```

各关合法性条件（在现有 `createQuestion` 基础上收紧，去掉边角重复）：

| 关卡 | 条件 | 说明 |
|---|---|---|
| L1 | `a>=1 && b>=1 && a+b<=10` | 10 以内加法，共 45 |
| L2 | `a>=2 && b>=1 && b<a && a-b>=1` | 去掉 `a-b=0`（10-10=0），得 45 |
| L3 | `a<=9 && b<=9 && a+b>=11` 或 `a==10 && b>=1 && b<=9` | 去掉 `10+10`，得 45 |
| L4 | `a>=11 && b<=9 && a%10<b && a-b>=2` | 保持，得 45 |

> L3 的 `10+x` 一档（10+1..10+9）保留 —— 这是 20 以内进位加法表的正式内容。

### 5.2 session 结构

```js
{
  size, deck: [...45张], cursor: 0, correctCount: 0, wrongCount: 0,
  locked: false, current: null, options: []
}
```

- `startQuestion()`：从 `deck[cursor]` 取题，不再调 `createQuestion()`
- `nextQuestion()`：边界从 `cursor >= 10` 改为 `cursor >= 45`
- `submitAnswer()`：边界同步改
- `submitTimeout()`：**删除**（困难模式移除）
- `calcStars(wrongCount)` → **新增** `calcStarsByTime(elapsedMs)`（3/2/1，不返回 0）
- `calcTrophy(wrongCount)` → **新增** `calcTrophyByStars(stars)`
- `calcTitle(stars)` → 文案改为 "太快啦！/ 稳稳的！/ 完成啦！"

> 命名原则（skill 明确要求）：改共享函数前先查调用方；新口径**新增专用函数**，不改 `calcStarCount` / `calcTrophyTier`（其他 7 个游戏在用）。

### 5.3 选项干扰项

`createOptions()` 现有逻辑（用 answer ± 偏移量造干扰项）**可沿用**，但需检查边界：L1 答案范围 2..10、L4 答案范围 2..19，偏移后越界会被 `minAnswer/maxAnswer` 过滤掉，然后从 remaining 补齐。现有代码已处理，**不改**。

---

## 6. app.js 改动清单

| # | 位置 | 改动 |
|---|---|---|
| 1 | `GAMES.mathFlash` | 不动 |
| 2 | `state` | 删 `mathHard`；新增 `mathDeckSize`（常量 45） |
| 3 | `restoreMathHard()` | **整个函数删除** |
| 4 | `#math-hard-toggle` addEventListener | 删除 |
| 5 | `syncSetupForGame()` | 删 `mathHardRow.hidden` / `restoreMathHard()` 调用 |
| 6 | `chooseGame()` | 删 `restoreMathHard()` 调用 |
| 7 | `startMathFlashGame()` | 删 `if (!state.mathHard) startTimer()` → **无条件 `startTimer()`**；建 deck |
| 8 | `renderMathQuestion()` | 进度 `/45`；删 `· 困难` 拼接；删 `.math-card__timer` 操作；删 `startMathCountdown` 调用 |
| 9 | `startMathCountdown()` | **整个函数删除** |
| 10 | `stopMathCountdown()` | **整个函数删除** |
| 11 | `handleMathTimeout()` | **整个函数删除** |
| 12 | `handleMathOptionClick()` | 删 `state.mathHard` 死线检查分支 |
| 13 | `showMathFeedback()` | 删 `stopMathCountdown()` |
| 14 | `flipMathCard()` | 删 `stopMathCountdown()` |
| 15 | `completeMathFlash()` | 星级改按时间；奖杯改按星级；文案改"答对 N / 45"；**最佳记录换 key + 只比时间** |
| 16 | `clearMathFlash()` | 删 `stopMathCountdown()` 及 `mathDeadline` 清理 |
| 17 | 计时显示 | **新增** mathFlash 专用计时阈值（90s 橙 / 150s 红），不动全局 `updateTimerDisplay` |

---

## 7. 风险表

| # | 风险 | 影响 | 缓解 |
|---|---|---|---|
| R1 | 45 题一局约 2–4 分钟，比原 10 题长 4.5 倍 | 幼儿注意力涣散，中途退出 | 题量是需求硬约束（"全部出完"）；通过 HUD 进度 `N/45` + 每题即时反馈维持节奏；可在 2.2 节开放问题里确认是否需要"分段休息" |
| R2 | 答错不重出 → 孩子可能乱点也能拿 3 星 | 评星失去区分度 | 三星线 1.4s/题 已接近"看题就答"的极限，乱点反而快不了多少（选项要读）；完成面板保留正确率；**是否加"答错扣时"列入开放问题** |
| R3 | 旧最佳记录（10 题制）与新的 45 题制时间不可比 | 记录显示错乱 | **换 localStorage key**（`beta_words_mathflash_timed_best_{size}`），旧 key 不读不写 |
| R4 | `updateTimerDisplay` 是 8 个游戏共用 | 改阈值会污染其它游戏 | 新增 mathFlash 专用函数，不动共用函数 |
| R5 | 移动端一屏测试脚本会玩算术闪卡到结算 | 45 题 × 0.6s 反馈 ≈ 27s+，测试超时 | 需改测试脚本：算术闪卡走"直接调完成面板"捷径，不真打 45 题（见 §9） |
| R6 | 难度 5/6/7 的 `.difficulty` 按钮在算术闪卡下被隐藏 | 测试脚本 `GAME_SIZES` 若点了隐藏 size → Playwright 超时 → **整个进程挂掉** | 测试脚本算术闪卡 size 已是 `[3,4,5,6]`，与 4 个有效关卡一致，**无需改**；改后需复核 |
| R7 | `calcStars` 旧签名 `calcStars(wrongCount)` 被别处引用 | 改坏其它游戏 | 搜引用确认只在算术闪卡用；仍按 skill 要求新增函数而非改签名 |
| R8 | 完成面板统计 `答对 N / 45（100%）` 在 32px 下宽 361px，超出可用宽度 280px 达 81px | **真机上必然折成三行**，破坏一屏布局 | 实测最坏值 24px = 271px < 280px；算术闪卡专用 `.complete-stats--timed { font-size: 24px }`，不改共用样式 |
| R9 | `.complete-title` 的 `data-tier` 只有 perfect/good/tryAgain 三档 | 1 星"完成啦"只能复用灰色 tryAgain，情绪传达错误 | 新增 `ok` 档；不改共用 `tryAgain` 颜色 |
| R10 | 一局 45 题的**测试脚本耗时**：若脚本真打 45 题 × 0.6s 反馈 ≈ 27s+ | 全量回归变慢 | 已核实脚本**只做布局测量**（点难度→等 500ms→手动显示完成面板），不真打题 → 无影响；但完成后需复跑确认 448 仍全绿 |

---

## 8. 分阶段实施

### Phase A — 引擎层（不碰 UI）
1. `engine/math-flash.js`：新增 `buildDeck()`、`isValidCard()`；`createSession` 带 deck；`startQuestion`/`nextQuestion`/`submitAnswer` 边界改 45；删 `submitTimeout`；新增 `calcStarsByTime` / `calcTrophyByStars` / `calcTitle`
2. **Node 端单测**：新增 `scripts/math-flash-deck-test.js`，断言：
   - 每关 deck 长度 == 45
   - 每关 deck 内无重复 `a-b` 键
   - 洗牌后 45 张全部不同
   - 每张卡答案在 level 的 min/maxAnswer 范围内
   - `calcStarsByTime` 边界：89999→3 / 90000→3 / 90001→2 / 150000→2 / 150001→1
3. 验收：单测全绿

### Phase B — app.js 接线 + 移除困难模式
1. 按 §6 清单逐项改
2. 新增算术闪卡专用计时阈值函数
3. 最佳记录换 key
4. 验收：`node --check current/app.js` 通过；手工跑通一局

### Phase C — HTML/CSS 收尾
1. 删 `#math-hard-row`、删卡面 `.math-card__timer` DOM
2. 删 `.math-card__timer` / `.math-card.is-urgent` CSS
3. `LEVELS[x].sub` 改 "45 题 · …"
4. **新增** `.complete-stats--timed { font-size: 24px }`（算术闪卡专用，不改共用 `.complete-stats`）
5. **新增** `.complete-title[data-tier="ok"]`（1 星档位，不改共用 `tryAgain`）
6. **新增** 算术闪卡专用计时阈值（90s 橙 / 150s 红）
7. 验收：`mobile-one-screen-test.js` **Failed = 0**（总数会从 448 变化，需在交付说明里写清原因）

### Phase D — 部署
1. `git merge --no-ff` 回 main
2. `static-site-deploy`：备份 → 上传 → 校验 md5 → 原子替换 → 重读线上 md5
3. 验证 `main:current/` 每个文件 md5 == 线上

---

## 9. 移动端测试脚本改造（R5 展开）

当前脚本对每个 size 走：点难度 → 等 500ms → 测量 gameplay → 手动显示 complete panel → 测量。

算术闪卡的问题：**gameplay 阶段只等 500ms**，本来就没真打 10 题（脚本只测布局，不测玩法）。所以**脚本实际不会被打到 45 题**——它只做布局测量。

需要改的只有：
- 脚本 `GAME_SIZES['open-math-flash'] = [3,4,5,6]` —— **保持不变**（4 个有效关卡正好对上）
- 脚本手动填的 `complete-stats` 文案 `'用时 00:42 · 成功率 8 / 8（100%）'` —— 可保留（它是布局探针，不是真数据）
- **但**完成面板真实文案变成"答对 N / 45"后，若比探针文案长，需在脚本里同步成最长形态，确保布局断言覆盖真实文案

---

## 10. 开放问题（待你拍板，各带推荐默认值）

### Q1：答错要不要扣时间？
- **推荐默认：不扣**。纯按总耗时评星，实现最简单，规则一句话说得清（"越快越三星"）。
- 备选：答错 +3 秒（防止乱点刷星）。代价：规则变复杂，孩子要理解"罚时"。

### Q2：四关都保持 45 张，还是给入门关更少的题？
- **推荐默认：四关都 45 张**。四关同题量 → 同时间预算 → 星级可横向比较（"我在哪关最快"）。
- 备选：L1 给 30 张（对刚入学的孩子更友好），但会破坏跨关可比性。

### Q3：最佳记录显示什么？
- **推荐默认：显示"最快用时"**（如"最快 01:08"），与新评星口径一致。
- 备选：显示"最高星数 + 那一局用时"。

---

## 11. 交付物清单

- [ ] `docs/phase-plans/phase-11-math-flash-timed.md`（本文件）
- [ ] `docs/mockups/phase-11/` 设计稿（选关页 / 游戏页 / 完成面板 × 三星二星一星）
- [ ] `current/engine/math-flash.js` 改写
- [ ] `current/app.js` 接线
- [ ] `current/index.html` 删困难模式 DOM
- [ ] `current/styles.css` 删困难模式样式
- [ ] `scripts/math-flash-deck-test.js` 新增单测
- [ ] `scripts/mobile-one-screen-test.js` 复核（449+ 断言全绿）
- [ ] 部署到 sophie520 + md5 复核
