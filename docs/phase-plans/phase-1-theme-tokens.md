# Phase 1 — 主题色 token 基础设施（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 1
>
> 状态：🔵 planning → ⏳ Phase 1A in progress
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法（Phase A 基础设施 → Phase B 试点 match → Phase C 推广其余 4 个）。每阶段独立 commit，跑 252 测试通过。

---

## 🎯 目标

建立 per-game 主题色系统，让所有游戏组件能"切主题"而不需要重写组件。最终效果：

- 进 match 游戏 → 整体橙色调
- 进 memory 游戏 → 整体紫色调
- 进 pinyinFriend → 蓝色调
- 进 listenCard → 绿色调
- 进 stroopTrain → 红色调
- 在 lobby → 米黄中性调

每个游戏有自己的"主题身份"，玩家一眼能区分，但不影响 cream 米黄画布底色（保持阅读舒适）。

---

## 📋 阶段拆分

### Phase 1A — 基础设施（CSS token + data-game 同步）

**目标**：定义主题色 CSS 变量，把 `state.game` 同步到 `body[data-game]`。**不动任何现有视觉**。完成后现有游戏看起来一模一样，但 token 系统就位。

#### 需求点

**R-1A.1** `:root` 添加 6 套主题色变量（match / memory / pinyinFriend / listenCard / stroopTrain / lobby）

每套 5 个变量：
- `--theme-{id}-bg`（主题极浅背景 `rgba(...,0.06)`）
- `--theme-{id}-accent`（主色）
- `--theme-{id}-accent-soft`（浅版 `rgba(...,0.15)`）
- `--theme-{id}-ink`（深色版，用于文字）
- `--theme-{id}-glow`（发光 `rgba(...,0.4)`）

**色板（2026-08-01 立）**

| ID | accent | bg | accent-soft | ink | glow | 视觉感受 |
|---|---|---|---|---|---|---|
| match | `#f08c3a` 暖橙 | `rgba(240,140,58,0.06)` | `rgba(240,140,58,0.15)` | `#b3591f` | `rgba(240,140,58,0.4)` | 找朋友的兴奋感 |
| memory | `#8a4fd6` 紫 | `rgba(138,79,214,0.06)` | `rgba(138,79,214,0.15)` | `#5d2fa0` | `rgba(138,79,214,0.4)` | 记忆宫殿的神秘 |
| pinyinFriend | `#2f80e9` 蓝 | `rgba(47,128,233,0.06)` | `rgba(47,128,233,0.15)` | `#1a5fb4` | `rgba(47,128,233,0.4)` | 学本领的专注 |
| listenCard | `#2fa84f` 绿 | `rgba(47,168,79,0.06)` | `rgba(47,168,79,0.15)` | `#1a7035` | `rgba(47,168,79,0.4)` | 听故事的沉浸 |
| stroopTrain | `#e94f4f` 红 | `rgba(233,79,79,0.06)` | `rgba(233,79,79,0.15)` | `#b32f2f` | `rgba(233,79,79,0.4)` | 色彩派对的热闹 |
| lobby | `#f5cd2f` 黄 | `rgba(247,215,92,0.04)` | `rgba(247,215,92,0.12)` | `#b5941f` | `rgba(247,215,92,0.3)` | 识字小屋的温馨 |

**验收标准**
- 6 套 × 5 个 = 30 个 CSS 变量定义在 `:root` 块内
- 命名严格遵循 `--theme-{id}-{slot}` 格式
- 颜色值为十六进制或 rgba，不写 magic number

**R-1A.2** 添加 `[data-game="..."]` 选择器 hook

每套主题定义独立的 `--theme-bg / --theme-accent / --theme-accent-soft / --theme-ink / --theme-glow` 临时变量（在对应 `[data-game]` 块内）：

```css
[data-game="match"] {
  --theme-bg: var(--theme-match-bg);
  --theme-accent: var(--theme-match-accent);
  /* ... */
}
```

这样业务代码只需写 `var(--theme-accent)` 即可拿到当前游戏主题色。

**验收标准**
- 6 个 `[data-game="..."]` 块全部定义（lobby + 5 游戏）
- 业务代码（Phase B 起）统一用 `--theme-accent / --theme-bg` 等中间变量
- 不出现直接引用 `--theme-{id}-*` 的业务代码

**R-1A.3** `app.js` 加 `syncTheme(gameId)` 函数

```js
function syncTheme(gameId) {
  // lobby 用 "lobby"，游戏用 gameId（match / memory / pinyinFriend / listenCard / stroopTrain）
  document.body.dataset.game = gameId || "lobby";
}
```

**调用时机**
- `chooseGame()` 进入 setup 时
- `showScreen("lobby")` 返回大厅时
- `chooseGame()` 直接进 play（如支持）时
- 页面初始化时默认 `lobby`

**验收标准**
- `syncTheme()` 函数定义并 export（若需）
- 在 3 个时机调用（看上面列表）
- body 的 `data-game` 属性在切换屏幕 / 游戏时正确更新
- 默认值 `lobby`

**R-1A.4** 不动现有视觉

Phase 1A 完成的标志是**视觉 0 变化**——所有现有游戏看起来一模一样。

**验收标准**
- 252/252 测试通过
- 现有任何 `--color-*` / `--accent` / `--bg` 等变量定义**完全不动**
- 没有引入任何新的视觉规则

#### 自测步骤

```bash
# 1. 起本地服务
cd /home/alpha/codex/beta_words/current && python3 -m http.server 4173 &

# 2. 跑 252 测试（必须全过，证明没破）
cd /home/alpha/codex/beta_words
node scripts/mobile-one-screen-test.js http://127.0.0.1:4173/
# 期望：Total: 252, Failed: 0

# 3. 检查 body data-game 是否切换
# 浏览器 DevTools 看 <body data-game="match"> 等
# 或 curl -s http://127.0.0.1:4173/ | grep body

# 4. 视觉对比（截图对比改动前）
# 用同一个 Playwright 脚本截图前后两个版本，肉眼对比应一致
```

#### Commit 信息

```
feat(theme): Phase 1A — 主题色 token 基础设施

加 6 套主题色 CSS 变量（match / memory / pinyinFriend / listenCard /
stroopTrain / lobby），加 [data-game] 选择器 hook，加 app.js syncTheme()
同步 state.game 到 body[data-game]。本阶段不动任何现有视觉，仅基础
设施就位。

* styles.css: 新增 --theme-{id}-{slot} 变量 × 6 套 + [data-game] 块
* app.js: 新增 syncTheme(gameId) 函数 + 3 处调用点

验证：mobile-one-screen-test.js Failed = 0（视觉零变化）
```

---

### Phase 1B — 试点（match）

**目标**：在 match 游戏（结构最简单：1 个棋盘 + HUD）应用主题色，验证框架可用。

#### 需求点

**R-1B.1** match 棋盘区域使用 `var(--theme-bg)` 替代纯白

**R-1B.2** match 字卡正面加主题色描边（`var(--theme-accent)` 1px）

**R-1B.3** match HUD 进度数字 / 计时器 / 提示框使用主题色辅助

**R-1B.4** match 完成面板主题色化（奖杯区先不加，Phase 4 做）

**R-1B.5** match setup 屏幕顶栏用主题色

#### 验收标准

- match 进入后能看到主题色（橙色）出现在棋盘底色、字卡描边、HUD 等
- memory / pinyinFriend / listenCard / stroopTrain / lobby 看起来**完全不变**（试点失败时只影响 match，其他不受牵连）
- 252/252 测试通过

#### 自测步骤

```bash
# 1. 252 测试
cd /home/alpha/codex/beta_words
node scripts/mobile-one-screen-test.js http://127.0.0.1:4173/
# 期望：Total: 252, Failed: 0

# 2. 截图肉眼确认 match 主题色生效
# 截图存 /home/alpha/.openclaw/workspace/.beta-screenshots/phase-1b-match.png

# 3. 截图确认其他 4 游戏没变
# 截图存 phase-1b-{memory,pinyin,listen,stroop}-unchanged.png
```

#### Commit 信息

```
feat(theme): Phase 1B — 主题色试点 match

match 游戏应用主题色 token：棋盘底色、字卡描边、HUD 进度色。
其他 4 游戏保持不变，验证 token 框架可用。

* styles.css: .match 区域内多用 var(--theme-*)

验证：mobile-one-screen-test.js Failed = 0
手测：match 3x3 / 5x5 / 7x7 主题色可见，其他 4 游戏视觉零变化
```

#### 试点失败处理

如果 Phase 1B 暴露 token 框架缺陷（如某些组件 hardcode 颜色无法 override）：

1. **不**继续做 Phase 1C，先 revert Phase 1B
2. 回 Phase 1A 改框架
3. 重新走 Phase 1B

---

### Phase 1C — 推广（4 游戏 + lobby）

**目标**：把主题色扩展到其余 4 游戏 + lobby。

**顺序**：memory → pinyinFriend → listenCard → stroopTrain → lobby（每个独立 commit）

#### 每个游戏验收标准

- 该游戏进入后能看到自己的主题色
- 完成面板主题色化（stroop 完成文案已升级用时 + 成功率，其他游戏在 Phase 4 统一做）
- 其他游戏**视觉零回归**
- 252/252 测试通过

#### 每个游戏自测

```bash
node scripts/mobile-one-screen-test.js http://127.0.0.1:4173/
# 截图肉眼确认新游戏主题色生效 + 其他游戏没回归
```

#### Commit 信息（每个游戏一条）

```
feat(theme): Phase 1C — 主题色推广 {gameId}

{gameId} 游戏应用主题色 token。

* styles.css: .{gameId} 区域内多用 var(--theme-*)

验证：mobile-one-screen-test.js Failed = 0
手测：{gameId} 3x3/5x5/7x7 主题色可见，match/memory/{已推广游戏列表} 视觉零变化
```

---

## ⚠️ 风险

| 风险 | 兜底 |
|---|---|
| 主题色过艳破坏 cream 画布的阅读舒适 | bg 用 `rgba(...,0.06)` 极浅；accent 用作点缀不铺满 |
| stroop 字色与主题色冲突（stroop 字色已经是红/黄/蓝/绿/紫/橙） | stroop 棋盘背景用主题色极浅版，字色不变 |
| 现有变量被破坏 | Phase 1A 严格"零视觉变化"，252 测试守护 |
| [data-game] 在快速切换时闪烁 | 加 `transition: background 200ms` 在 .screen |

---

## 🚦 验收 Checklist

Phase 1 整体完成时：

- [ ] Phase 1A commit 已入 git，252/252 通过
- [ ] Phase 1B commit 已入 git，252/252 通过 + match 截图确认主题色
- [ ] Phase 1C 4 个游戏每个独立 commit，252/252 每次都过
- [ ] lobby 主题色 commit，252/252 通过
- [ ] 主人确认 5 主题 + lobby 主题视觉效果和谐
- [ ] 整体视觉回归肉眼对比前后无负面影响

完成后此文档标题改为 `✅ completed`，并附实际 commit hash 列表。