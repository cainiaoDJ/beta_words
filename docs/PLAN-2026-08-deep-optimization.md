# 深度优化总纲（2026-08-01 立）

> 📁 本文件是**总纲**，不写实施细节。每个 Phase 实施前会单独写 `phase-plans/phase-X-<name>.md`（需求点 R-X.N + 验收标准 + 自测步骤），完成 commit 后归档。
>
> 📁 **流程约束**：遵循 `beta_words/AGENTS.md` 的方法论——架构级改动开 `feat/<topic>` 分支，按 Phase A（基础设施）→ Phase B（试点）→ Phase C（推广）三阶段走，每个 commit 必跑 `mobile-one-screen-test.js` Failed = 0。

---

## 🎯 总目标

5 个儿童识字游戏（match / memory / pinyinFriend / listenCard / stroopTrain）各自有**独立视觉主题色**，棋盘/卡片有装饰和反馈动效，结算页有奖杯/星星数，背景 letterbox 用分层 SVG 动画填充，加 per-game 背景音乐。整体往"幼小衔接多邻国"的调子靠，从"功能 OK 的工程稿"升级到"小朋友愿意玩的爱不释手的游戏"。

---

## 📊 现状基线（2026-08-01）

- 5 个游戏全功能：`app.js` 实现完整，`mobile-one-screen-test.js` 252/252 全绿
- 配色单调：全游戏共用 `--bg #f5f7f3` + `--accent #2f8c73` + `--sun #f7d75c`，没有 per-game 主题
- 视觉简陋：字卡正面纯白 + 灰描边，mascot 只在顶栏角落小图，进度只有 `0/8` 干数字
- 听字识别色（stroop）：计时器被 `syncStroopHud()` 故意隐藏（已修），完成后无"下一关"按钮（已修）
- 背景：`.stage` 的 `--stage-bg #1d221d` 黑色 letterbox 区域**当前完全空着**（浪费的视觉空间）

---

## ⚠️ 风险 / 约束

| 项 | 说明 | 兜底方案 |
|---|---|---|
| **252 测试不破** | 任何 UI 改动必跑 `mobile-one-screen-test.js` Failed = 0 | 改完先跑测试，发现 fail 立即按 `AGENTS.md §3` 修；不允许批量提交 |
| **背景音乐 autoplay** | 浏览器禁止 autoplay，需用户首次交互解锁 | audio context + 首次 click 解锁；voice picker 加"背景音乐开关" |
| **BGM 不能盖过 TTS** | 识字游戏核心是听字音 | 默认音量 30%，TTS 触发时 duck 到 10%，结束后回 30% |
| **资源体积** | 5+1 首 BGM，每首 ≤ 30s loop，单首 ≤ 500KB | music_generate 选 instrumental 版优先；可考虑 base64 内联（仅小段） |
| **可关闭 / 无障碍** | 课堂 / 感统敏感场景需要静音 | voice picker 加"背景音乐"toggle，默认开；记 localStorage `beta_words_bgm_pref` |
| **设计 token 不破** | 现有 `--bg / --accent / --sun / --color-*` 仍在用 | 新主题色走 `--theme-{gameId}-{slot}`，旧 token 保留（lobby / 通用组件用） |
| **letterbox SVG 不抢戏** | `.stage-canvas` 的 360×640 cream 画布是核心 | SVG 透明度 ≤ 0.4，动画速率 ≤ 0.05 弧度/s，鼠标不响应（不增加误触） |
| **不破坏离线部署** | 部署是静态文件 tar+ssh 同步 | 所有 SVG / MP3 走 `current/assets/` 目录，**不**外链 CDN |

---

## 🎵 Phase 0 — 音乐 demo 选型（半天）

**目标**：用 `music_generate` 出 6 首 30s demo，主人在 webchat / 飞书试听确认风格，挑选 / 重做后再集成。

**Brief**

| 游戏 / 场景 | 主题色 | 音乐 brief | 节奏 | 情绪 |
|---|---|---|---|---|
| Lobby（识字小屋） | 米白 #f5f7f3 | ukulele + 风铃 + 轻拍手，"欢迎来到识字小屋" | 85 BPM | 友好 / 邀请 |
| 识字消消乐 match | 暖橙 #f08c3a | 木琴 + xylophone + 拍手，"找朋友"轻快感 | 90 BPM | 兴奋 / 探索 |
| 识字翻翻乐 memory | 紫 #8a4fd6 | music box + 柔和 pad，"记忆宫殿"神秘但友好 | 70 BPM | 安静 / 神秘 |
| 拼音找朋友 pinyinFriend | 蓝 #2f80e9 | 长笛 + 钢琴，"学本领"专注但不沉闷 | 75 BPM | 专注 / 轻快 |
| 听音点卡 listenCard | 绿 #2fa84f | 吉他拨弦 + 铃声，"听故事"放松 | 80 BPM | 沉浸 / 倾听 |
| 看字识颜色 stroopTrain | 彩虹主色红 #e94f4f | marimba + 风铃 + 彩色木琴，"色彩派对"活泼 | 100 BPM | 兴奋 / 热闹 |

每首 30s，loop 接缝无突兀，instrumental 优先（避免歌词抢 TTS）。

**完成标志**
- 6 首 MP3 存 `current/assets/music/{lobby,match,memory,pinyinFriend,listenCard,stroopTrain}.mp3`
- 主人书面确认风格 OK（或要求重做某几首）
- 详细 plan: `phase-plans/phase-0-music-demo.md`

---

## 🎨 Phase 1 — 主题色 token 基础设施（半天）

**目标**：建立 per-game 主题色系统，让所有游戏组件能"切主题"而不需要重写组件。

**做什么**
- `:root` 加 `--theme-{gameId}-{slot}` 变量组（每组含 `-bg / -accent / -accent-soft / -ink / -glow`）
- body 加 `data-game` 属性（与现有 `state.game` 同步），CSS 用 `[data-game="match"]` 选择器 hook
- 现有 `.theme-` 组件类（按钮/卡片/进度条）扩展支持主题色
- 顶栏/title/卡片/按钮/HUD/进度条 全部走 `var(--theme-*-*)` 而不是硬编码

**约束**
- 走 AGENTS.md 三阶段：Phase A 基础设施（不动业务）+ Phase B 试点（match 最简）+ Phase C 推广（其余 4 个）
- 试点失败回 Phase A 改框架

**完成标志**
- 252/252 测试通过（Phase A 完成时也要跑，证明没破）
- 进每个游戏，主题色自动切换（不需手动加 class）
- 详细 plan: `phase-plans/phase-1-theme-tokens.md`

---

## 🏠 Phase 2 — Lobby + Setup 重设计（半天）

**Lobby**
- 5 张游戏卡每张用**主题色背景**（不再是统一薄荷绿块）
- 图标换成主题色版（match 橙色对勾、memory 紫色问号、stroopTrain 彩虹）
- 5 张卡"孤儿"问题：改为 `1+2+2` 错落网格（match 主推，memory+pinyin 并列，listenCard+stroopTrain 并列）
- 吉祥物在右下角陪伴感（不再是顶栏小图）
- 加背景音乐开关按钮在顶栏齿轮旁边（沿用 voice picker 入口）

**Setup**
- 难度按钮加**主题色徽章**（推荐关有"⭐推荐"，如 4×4 是 match 的黄金难度）
- 顶部条带用当前游戏主题色
- 返回按钮加游戏主题色 icon

**完成标志**
- 252/252 测试通过
- 截图肉眼确认 5 主题和谐
- 详细 plan: `phase-plans/phase-2-lobby-setup.md`

---

## 🎲 Phase 3 — 各游戏棋盘 + 选项装饰（1 天）

**通用（5 游戏共用规则）**
- 棋盘背景：从纯白换成主题色极浅版（如 match `rgba(240,140,58,0.06)`）
- 字卡正面：从纯白换成"主题色 + 米黄叠加"，加 1px 主题色描边
- 字卡 hover：scale(1.05) + 主题色光晕
- 字卡 matched：黄色星星 burst + 主题色背景闪烁

**Stroop 专属**
- 待选区米字格保留（草稿纸感），外框虚线换主题色
- 颜色条按钮加 4px 主题色描边（区分已选）

**PinyinFriend / ListenCard 专属**
- 选项卡：白底 → 主题色极浅底 + 大字号拼音 + 右上角小耳朵图标（提示点我听）
- 当前题目卡：主题色边框 + 旋转 1° 微动 + "听"按钮显眼

**Memory 专属**
- 卡片正面：之前说过空心矩形，现在加字 + 主题色描边
- 卡片背面：主题色 + 主题图标（如 memory 的"记忆"图标）
- 翻牌动画：3D rotateY（已有 transform，加 perspective）

**Match 专属**
- 棋盘格选中态：主题色脉动动画
- 配对成功：双格同色 flash

**完成标志**
- 252/252 测试通过
- 录屏对比新旧差异，主人确认效果
- 详细 plan: `phase-plans/phase-3-board-decoration.md`（按子游戏拆分需求）

---

## 🎉 Phase 4 — 结算页大改（半天）

**做什么**
- 加**奖杯 SVG**（3 档：铜 / 银 / 金，按正确率 50% / 80% / 100% 显示）
- 加**星星数**：每局显示 1-3 星（按时长 + 正确率算）
- 加**历史最佳对比**："本次 00:08 vs 最佳 00:05，进步 3 秒！"
- 三按钮改成"再玩一次（主）+ 下一关（次）+ 回大厅（次）"
- 撒花动画升级：彩色渐变 confetti（已有基础，加主题色版）
- stroop 完成文案已升级为"用时 + 成功率"，其他游戏也对齐

**完成标志**
- 252/252 测试通过
- 截图肉眼确认 3 档奖杯清晰可辨
- 详细 plan: `phase-plans/phase-4-complete-panel.md`

---

## 🎬 Phase 5 — 反馈动效（半天）

**做什么**
- 答对：mascot 弹跳 + 卡片放大 + 撒彩屑（已有 sprite，加 curve）
- 答错：mascot 摇头 + 卡片左右抖动 + 红光闪
- 计时器到达阈值：HUD 数字变橙→红（提醒）
- Mascot 表情切换：现在用 SVG sprite 静态切图，改成 SVG `<animate>` 流畅版
- Stroop 完成：待选格填色有滑入动画
- Memory 翻牌：3D 翻转动效（已有 transform 基础，加 perspective + backface-visibility）

**完成标志**
- 252/252 测试通过
- 录屏确认动效不卡（Chrome DevTools Performance 60fps）
- 详细 plan: `phase-plans/phase-5-feedback-animations.md`

---

## 🎵 Phase 7 — BGM 选型 + 集成（1 天）

> 📁 **重排**：原 Phase 0（demo 选型）+ Phase 6（集成）合并。

### Part A：Demo 选型（半天）

用 `music_generate` 出 6 首 30s demo（5 游戏 + lobby），主人在 webchat / 飞书试听挑选 / 重做后再集成。

每首 brief 与原 Phase 0 一致：

| ID | 文件名 | Brief | BPM |
|---|---|---|---|
| M-L | `lobby.mp3` | ukulele + 风铃 + 轻拍手，"欢迎来到识字小屋" | 85 |
| M-Match | `match.mp3` | 木琴 + xylophone + 拍手，"找朋友"轻快感 | 90 |
| M-Memory | `memory.mp3` | music box + 柔和 pad，"记忆宫殿"神秘但友好 | 70 |
| M-Pinyin | `pinyinFriend.mp3` | 长笛 + 钢琴，"学本领"专注但不沉闷 | 75 |
| M-Listen | `listenCard.mp3` | 吉他拨弦 + 铃声，"听故事"放松 | 80 |
| M-Stroop | `stroopTrain.mp3` | marimba + 风铃 + 彩色木琴，"色彩派对"活泼 | 100 |

每首 30s，loop 接缝无突兀，instrumental 优先（避免歌词抢 TTS）。

详细 plan: `phase-plans/phase-7a-music-demo.md`

### Part B：集成（半天）

**架构**
- 每个游戏进入时启动对应 `<audio loop>`，离开时 fadeOut(0.3s) 停
- 音量默认 30%，TTS 触发时 duck 到 10%（250ms ramp），结束后回 30%
- 第一次用户 click 解锁 audio context（audio + music 同源处理）
- Voice picker 加按钮 toggle（默认开），记 `localStorage.beta_words_bgm_pref`

**实现**
- `<audio id="bgm-{gameId}" src="..." loop preload="auto">` 放 index.html（或 JS 动态创建）
- `app.js` 加 `bgmController` 模块：进游戏 play() / 离游戏 fadeOut / toggle / TTS duck
- 静默 fallback：MP3 加载失败 / 浏览器拒绝 autoplay → 不影响游戏
- BGM 触发时机：**进 play 才播**，setup 选难度不干扰

**完成标志**
- 6 首 BGM 真机 / 模拟器测试 autoplay 行为正常
- TTS 触发时音乐 duck 听感自然
- Voice picker 开关生效（关掉后 BGM 停，重启后记忆偏好）
- 252/252 测试通过（audio 加载不影响 scrollHeight）
- 详细 plan: `phase-plans/phase-7b-bgm-integration.md`

---

## 🌌 Phase 6 — 分层 SVG letterbox 背景动画（半天）

> 📁 **主人新方向（2026-08-01 16:33 改稿）**：把背景 SVG 动画放在 `.stage` 的**黑色 letterbox 区域**（cream 画布外的上下黑色条带），用 3 层 parallax SVG 拼成一个可动的背景图。**不**在 cream 画布内放插画（避免抢游戏戏）。

**设计思路**

```
┌─────────────────────────────────┐ ← 黑色 letterbox TOP（手机约 60-80px 高）
│ ☁️     ⭐ ·     · ☁️   ·  ⭐ ·   │ ← Layer 1: 远景云 / 星（慢漂 60s）
│      ·  ⭐  ·          ·        │ ← Layer 2: 中景元素（中速 30s）
│  · ⭐     ·   ⭐  ·       ·     │ ← Layer 3: 近景粒子（快漂 15s）
├─────────────────────────────────┤ ← cream 画布顶（360×640）
│                                  │
│      GAME CANVAS (cream)         │
│                                  │
├─────────────────────────────────┤ ← cream 画布底
│  ·    🎈       ·     ·  ·  ⭐   │ ← Layer 3: 近景（如上升气球）
│       ·   ·  🎈     ·           │ ← Layer 2: 中景
│  ·  ⭐     ·     ·    ⭐  ·    ☁️│ ← Layer 1: 远景（慢漂）
└─────────────────────────────────┘ ← 黑色 letterbox BOTTOM
```

**3 层 Parallax 设计原则**
- Layer 1（远景 / 60s 循环）：低频装饰元素（云、星、月、彩虹），透明度 0.15-0.25，慢漂移（translateX 0→100%）
- Layer 2（中景 / 30s 循环）：中等元素（光斑、纸飞机、铃铛、叶子），透明度 0.25-0.35，中速漂移
- Layer 3（近景 / 15s 循环）：高互动元素（彩屑、上升气球、闪烁星），透明度 0.30-0.40，fast 漂移

**每游戏 / 场景主题元素**

| 场景 | Layer 1（远景） | Layer 2（中景） | Layer 3（近景） |
|---|---|---|---|
| Lobby | 暖云朵 + 太阳光晕 | 飘动气球 + 五彩铃铛 | 闪烁小星星 + 慢速彩屑 |
| Match | 橙色秋叶 + 阳光 | 橙色气球 + 拍手图标 | 上升星 + 彩屑 |
| Memory | 紫色星空 + 弯月 | 紫色萤火 + 紫色星云 | 闪烁水晶 + 流星 |
| PinyinFriend | 蓝白云 + 彩虹 | 蓝纸飞机 + 雨滴 | 蓝蝴蝶 + 雪花 |
| ListenCard | 绿叶 + 树影 | 绿色蜻蜓 + 风铃 | 飘落绿叶 + 绿星 |
| StroopTrain | 彩虹 + 太阳 | 彩色泡泡 + 风车 | 上升彩球 + 闪星 |

**实现方式**
- 6 个 SVG 文件（每个场景 1 个），每个含 3 个 `<g>` 分层，CSS `@keyframes` 各自循环动画
- 存 `current/assets/backgrounds/{lobby,match,memory,pinyinFriend,listenCard,stroopTrain}.svg`
- HTML 把 SVG 直接 inline 到 `.stage` 内（不走 `.stage-canvas`），`<svg class="letterbox-bg" data-bg="match">` 切换
- body `data-game` 切换时 fade in/out（0.4s cross-fade）
- 不响应鼠标 / 触摸（`pointer-events: none`），纯装饰不抢交互
- 性能：单 SVG ≤ 20 个元素，总文件 ≤ 10KB，CSS animation GPU 加速（transform）

**完成标志**
- 252/252 测试通过
- 录屏肉眼确认 3 层 parallax 节奏自然
- 在小屏 320×568 上 letterbox 比例仍然合理
- 详细 plan: `phase-plans/phase-7-letterbox-svg.md`

---

## ⏱️ 总体 ETA（重排于 2026-08-01 16:38：主人指示音乐放最后）

| Phase | 内容 | ETA | 依赖 |
|---|---|---|---|
| 1 | 主题色 token（A→B→C 三阶段） | 半天 | 无 |
| 2 | Lobby + Setup 重设计 | 半天 | Phase 1 B 阶段 |
| 3 | 棋盘 + 选项装饰（5 子游戏） | 1 天 | Phase 1 完成 |
| 4 | 结算页大改 | 半天 | Phase 3 完成 |
| 5 | 反馈动效 | 半天 | Phase 3 完成 |
| 6 | 分层 SVG letterbox 背景 | 半天 | Phase 1 完成 |
| 7 | BGM demo 选型 + 集成 | 1 天（demo 半天 + 集成半天） | Phase 5 完成 |
| **合计** | | **3.5-4.5 天** | |

> 📁 **变更说明**：原本的 Phase 0（音乐 demo）和 Phase 7（letterbox SVG）顺序调换。先做完所有视觉，letterbox SVG 是纯装饰（不影响玩法），放视觉阶段最后；BGM 涉及 autoplay / duck / 偏好记忆等机制，和视觉改完后打包一起做最稳。
> 
> 旧 Phase 6（背景音乐集成）+ 旧 Phase 0（音乐 demo）合并为新 Phase 7：先跑 music_generate demo 让主人挑选，再做集成。

---

## 📂 实施流程（每次实施一个 Phase）

```
1. 读 phase-plans/phase-X-<name>.md（如不存在则先写）
   ├── 需求点 R-X.1, R-X.2, ...（每个清晰可验收）
   ├── 验收标准（具体数值 / 视觉描述）
   └── 自测步骤（mobile-one-screen-test.js + 手测路径）

2. feat/<phase-slug> 分支（如 feat/theme-tokens）

3. 实施 + commit（按 Phase A/B/C 拆 commit）

4. 跑 mobile-one-screen-test.js，Failed = 0

5. 手测：lobby → 每个游戏 → 3x3 / 5x5 / 7x7 → 完成 → 再来

6. 截图给主人确认效果

7. 【部署策略 2026-08-01 17:12 修订】
   ├─ 本期所有 commit（feat/theme-tokens 起）：**只部署本机**
   │     tar ... | tar -xzf - -C /home/alpha/apps/beta_words/current/
   │     本机服务运行中 (beta-words.service on 192.168.31.60:8091)
   ├─ **全部 phase 完成**后再统一发 VPS：
   │     tar ... | ssh ... 'tar -xzf - -C /var/www/games/current/'
   └─ 避免开发期每次小改都双向同步、主人审不到位

8. 更新 phase-plans/phase-X-<name>.md 为 completed（标 ✅ + 实际改动摘要）
```

---

## 🤔 待主人拍板的点

1. **Phase 0 音乐 demo 先跑还是先做视觉？** 现在就跑 6 首出来你试听？还是先 Phase 1-2 出视觉效果再配乐？
2. **吉祥物 IP** 升级：要不要给 mascot 起名字（如"小书"）+ 加 4 种表情动画版（目前 happy/sad/celebrate/wave 是静态）
3. **进度可视化**：5 游戏统一改"进度点"（如 9 个小圆点，已填变主题色），还是保留数字 + 加进度条？
4. **大背景插画**：Phase 7 已改 letterbox 方向（不抢 cream 画布），还要不要做？
5. **BGM 触发时机**：进入 setup 就播，还是进入 play 才播？setup 通常是选难度不该有音乐