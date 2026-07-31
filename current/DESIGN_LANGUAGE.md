# Design Language — Beta Words (Design System v2)

> 5 个游戏现状审计 + 统一设计语言 + Phase C 推广清单  
> 项目：`beta_words`（幼小衔接识字游戏）  
> 文档版本：v2.0 / 2026-07-31  
> 配套实施：`feat/design-system-v2` 分支（Phase A ✅ / Phase B ✅ / Phase C 待）

---

## 1. 5 个游戏现状审计

### 1.1 游戏类型与视觉骨架

| 游戏 | 类型 | 视觉骨架 | 主元素 | 辅助元素 |
|---|---|---|---|---|
| 识字消消乐 (match) | 棋盘配对 | `#board` (zone-primary 300×300) | `.tile` grid | — |
| 识字翻翻乐 (memory) | 翻牌配对 | `#board` (zone-primary 300×300) | `.tile` grid (preview + reveal) | — |
| 拼音找朋友 (pinyin-friend) | 听音选字 | `#quiz` (zone-stack) | `.quiz-word` (zone-primary) | `.option-grid` (zone-secondary) |
| 听音点卡 (listen-card) | 听音选字 | `#quiz` (zone-stack) | `.listen-prompt` (zone-primary) | `.option-grid` (zone-secondary) |
| 看字识颜色 (stroop-train) | Stroop 训练 | `#stroop-host` (zone-stack 3 zones) | `.stroop-board` `.stroop-select` `.stroop-palette` | — |

### 1.2 状态机共有字段

```
state.game            当前游戏 id (match / memory / pinyinFriend / listenCard / stroopTrain)
state.size            棋盘大小 (3 / 4 / 5 / 6 / 7)
state.phase           阶段 ("preview" / "playing")
state.tiles           字牌数组 (match / memory)
state.selectedId      当前选中牌 id
state.locked          是否锁定输入（动画期间）
state.matchedCount    已配对 / 已答对数
state.totalTargets    总目标数
state.questions       quiz 题库 (pinyin / listen)
state.questionIndex   quiz 当前题号
state.currentQuestion 当前 quiz 题对象
state.options         quiz 选项数组
```

### 1.3 反馈共有结构

**HUD**（design y=66, h=36）：

- 左侧：进度 `#progress` / `.hud-progress`
- 中间：计时 `#timer` / `.hud-timer`（固定宽 90px, 黄色背景 + 2px 边框）
- 右侧：提示 `#hint` / `.hud-hint`

**Complete Panel**（共享覆盖层）：

- title（默认"都找到了"）
- 时间 / 成功率
- "新纪录！"标记（best_record 刷新时）
- 3 按钮（再玩一次 / 下一关 / 回大厅）

### 1.4 视觉状态 class 现状（**痛点：命名不统一**）

| 语义 | match/memory tile | quiz option | stroop-cell | stroop-select-cell |
|---|---|---|---|---|
| 选中 | `.tile.selected` | — | `.stroop-cell.active` | `.stroop-select-cell.active` |
| 答对 | `.tile.matched` | `.option-button.correct` | — | `.stroop-select-cell.correct` |
| 答错 | — | `.option-button.wrong` | — | `.stroop-select-cell.wrong` |
| 不可点 | — | — | `.stroop-cell.disabled` | `.stroop-select-cell.disabled` |
| Cursor 活跃 | — | — | `.stroop-cell.active` | — |
| 奖励 | `.tile.bonus` | — | — | — |
| 翻牌背面 | `.tile.hidden-face` | — | — | — |

> **问题**：同样语义（答对）有 3 种 class 名，CSS 维护成本高，扩展难。

### 1.5 动效时长现状（**痛点：标准不一**）

| 动作 | 时长 |
|---|---|
| match 答对消失 | 220ms |
| memory 答对保留 | 220ms |
| memory 答错翻回 | 680ms |
| quiz 答对下一题 | 520ms |
| quiz 答错清除状态 | 520ms |
| complete panel 显示 | 260ms |
| screen fade-in | 180ms |

> **问题**：220 / 520 / 680 三个时长混用，没有节奏感。

### 1.6 颜色现状（**痛点：硬编码 hex, 无 token**）

- selected: `#fff0a6`（浅黄）
- matched: opacity 0 → 1 + `#e8f2ec`（浅绿）
- correct: `#dff3ea` + `#2f8c73`（浅绿 + 主绿）
- wrong: `#ffe7dd` + `#d86d4c`（浅红 + 红）
- bonus: `#dff3ea` + `#1f6f59`

> **问题**：所有颜色都是 hex 字面量, 没有 tonal palette, hover/active/disabled 没分级。

### 1.7 反馈链现状（**痛点：缺音效 + 缺 mascot 联动**）

| 动作 | 视觉 | 动效 | 语音 | 音效 |
|---|---|---|---|---|
| tap | ❌ | ❌ | ❌ | ❌ sfx.tap-pop |
| 答对 | ✅ playVoice "找对了" | ✅ 220ms 清除 | ✅ | ❌ sfx.correct-ding / ❌ tile-correct-spring |
| 答错 | ✅ playVoice "再试一次" | ✅ 520ms 清除 | ✅ | ❌ sfx.wrong-buzz / ❌ tile-wrong-shake |
| 完成 | ✅ playVoice "都找到了" | ✅ 260ms | ✅ | ❌ sfx.complete-fanfare / ❌ confetti / ❌ mascot |

> **问题**：音效 0 个真音频；mascot 4 个 SVG 写了但完全没用上。

---

## 2. 统一设计语言（提案）

### 2.1 设计原则

1. **现代化** — 多邻国风格：弹簧 + shake + 撒花 + mascot 全程陪伴
2. **小朋友友好** — 大字号 / 大触控 / 即时反馈 / 容错（答错不惩罚过重）
3. **SOP 边界** — 圆角 ≤8px / 不用大面积紫深蓝棕米 / 不装饰光球渐变 blob
4. **不喧宾夺主** — 玩法服务于识字，UI 不分散注意力

### 2.2 视觉系统（Phase A 已落）

| 类别 | Token | 值 | 用途 |
|---|---|---|---|
| 主色 | `--color-primary` | `47 140 115` (RGB) | 按钮、边框、聚焦 |
| 主色深 | `--color-primary-strong` | `31 111 89` | 选中文字、激活态 |
| 主色浅 | `--color-primary-soft` | `223 243 234` | icon 容器、tile 正确背景 |
| 主色 hover | `--color-primary-hover` | `38 158 130` | hover 边框 |
| 主色 active | `--color-primary-active` | `25 90 73` | active 状态 |
| 警告 | `--color-warning` | `247 215 92` | 计时器背景 |
| 警告浅 | `--color-warning-soft` | `255 248 214` | 提示背景 |
| 危险 | `--color-danger` | `216 109 76` | 错误边框 |
| 危险浅 | `--color-danger-soft` | `255 231 221` | 错误背景 |
| 圆角 | `--radius-xs/sm/md` | `4 / 6 / 8px` | SOP ≤8px |
| 阴影 | `--shadow-subtle/card/overlay` | 3 层 | 立体感 |
| 字号 | `--fs-tiny/caption/body/h3/h2/h1/display` | `11/12/14/16/18/26/32px` | 7 级 |
| 字重 | `--fw-bold/black` | `700 / 900` | 简洁 |
| 字体 | `--font-display/heading/body/numeric` | system stack | 4 类 |
| 间距 | `--space-1/2/3/4/5` | `4/8/12/16/24px` | 5 级 |

### 2.3 动效系统（Phase A 已落）

| 类别 | Token | 值 | 用途 |
|---|---|---|---|
| 时长 | `--motion-fast` | `120ms` | 短反馈（hover） |
| 时长 | `--motion-base` | `200ms` | 标准反馈（点击） |
| 时长 | `--motion-slow` | `320ms` | 长反馈（错误 shake） |
| 时长 | `--motion-celebrate` | `480ms` | 庆祝（答对弹簧、confetti 飞） |
| 缓动 | `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 标准过渡 |
| 缓动 | `--ease-emphasized` | `cubic-bezier(0.2, 0, 0, 1.2)` | 弹性（轻微过冲） |
| 缓动 | `--ease-decel` | `cubic-bezier(0, 0, 0.2, 1)` | 减速（入场） |
| 缓动 | `--ease-accel` | `cubic-bezier(0.4, 0, 1, 1)` | 加速（出场） |

### 2.4 共享 keyframes（Phase A 已落）

| 名称 | 用途 | 时长 |
|---|---|---|
| `tile-correct-spring` | 答对弹簧放大 (1 → 1.12 → 0.98 → 1) | 480ms emphasized |
| `tile-wrong-shake` | 答错左右 shake (±4px, 4 段) | 320ms standard |
| `ripple-expand` | 水波纹扩散 (scale 0 → 4, opacity → 0) | 480ms |
| `confetti-fall` | 撒花粒子（110vh 下落 + 旋转 720deg） | 1200ms accel |
| `mascot-bounce` | mascot 跳跃 (translateY -12 + scale 1.08) | 480ms emphasized |
| `mascot-welcome` | mascot 入场（从下 20px + scale 0.8 → 1） | 480ms emphasized |
| `stroop-pulse` | cursor 呼吸（已有，保持） | 1.1s |

### 2.5 交互系统（**Phase C 落地**）

#### 2.5.1 统一状态 class（替换散乱命名）

| 语义 | 旧 class（多套） | **新统一 class** | 适用 |
|---|---|---|---|
| 选中 | `.tile.selected` / `.stroop-cell.active` | `.is-selected` | tile / option / cell |
| 答对 | `.tile.matched` / `.option-button.correct` / `.stroop-select-cell.correct` | `.is-correct` | tile / option / select-cell |
| 答错 | `.option-button.wrong` / `.stroop-select-cell.wrong` | `.is-wrong` | option / select-cell |
| 不可点 | `.stroop-cell.disabled` | `.is-disabled` | stroop-cell |
| Cursor 活跃 | `.stroop-cell.active` | `.is-active` | stroop-cell |
| 奖励 | `.tile.bonus` | `.is-bonus` | tile |
| 翻牌背面 | `.tile.hidden-face` | `.is-hidden` | tile |

> **迁移策略**：保留旧 class 作为 alias（兼容 1 个 Phase C 子集），新 class 优先；下次重构删除旧。

#### 2.5.2 统一反馈链

| 动作 | 视觉 | 动效 | 语音 | 音效 |
|---|---|---|---|---|
| tap（任何点击） | scale(0.96) 即时反馈 | 120ms | — | `sfx.tap-pop` |
| 答对 | `.is-correct` 绿色背景 | tile-correct-spring 480ms | `prompt.correct` "找对了" | `sfx.correct-ding` |
| 答错 | `.is-wrong` 红色背景 | tile-wrong-shake 320ms | `prompt.tryAgain` "再试一次" | `sfx.wrong-buzz` |
| 完成 | confetti 1.2s | mascot celebrate bounce + complete panel scale-in | `prompt.complete` "都找到了" | `sfx.complete-fanfare` |

#### 2.5.3 统一动效时长（替换散乱 220/520/680ms）

| 动作 | **新标准** | 旧 |
|---|---|---|
| 答对消除（match 风格消失） | 220ms + tile-correct-spring 480ms | 220ms |
| 答对保留（memory 风格） | 220ms + tile-correct-spring 480ms | 220ms |
| 答错恢复 | 480ms + tile-wrong-shake 320ms | 420ms / 680ms |
| 答对下一题（quiz） | 480ms + tile-correct-spring 480ms | 520ms |
| 答错清除状态（quiz） | 320ms + tile-wrong-shake 320ms | 520ms |
| Complete panel 入场 | 320ms + scale-in 200ms | 260ms |
| Mascot 切换 | 480ms emphasized bounce | — |

#### 2.5.4 Mascot 状态切换表

| 触发时机 | 切换目标 | 实现 |
|---|---|---|
| 答对 | src → `mascot-happy.svg` + bounce | `<img src>` 切换 + `.bounce` class |
| 答错 | src → `mascot-sad.svg` + bounce | 同上 |
| 完成 | src → `mascot-celebrate.svg` + bounce + confetti | 同上 + confetti host |
| 回 lobby | src → `mascot-wave.svg` + welcome | 重新触发 welcome keyframe |

### 2.6 完成面板（D11 多邻国化）

**当前结构**：

- title "都找到了"
- 时间 / 成功率
- 新纪录标记
- 3 按钮（再玩一次 / 下一关 / 回大厅）

**Phase C 升级**：

- 大字标题（大字号 + 字重 900）
- mascot celebrate 切换 + bounce 动画
- 数字突出（`--fs-display` 32px + tabular-nums）
- 进度环（圆形 SVG stroke-dashoffset，按成功率填充）
- 主按钮巨型（再玩一次 56px 高 + 强色背景）
- confetti 粒子从顶部飘落

**stroop-train 特殊**：title 改"完成 X/Y (Z%)"、mascot 庆祝、按钮文字"再玩一次"。

---

## 3. Phase C 推广计划

### 3.1 推广顺序（按依赖 + 复用率）

```
C1: match (识字消消乐)      ← 最简, 验证 .is-* 迁移
C2: memory (识字翻翻乐)     ← match 的扩展 + preview phase
C3: pinyin-friend           ← quiz 模式首次, 验证 option 迁移
C4: listen-card             ← pinyin 的兄弟, 复用 quiz 框架
C5: stroop-train            ← 3 zone + active/cursor 状态, 收尾
```

### 3.2 每子集统一范围（每个 commit 包含）

1. **统一状态 class 迁移** — `.tile.matched` → `.is-correct`（保留旧 class 作为 alias）
2. **统一动效时长** — 220/520/680 → 标准时长（见 2.5.3）
3. **统一反馈链接入** — 答对/答错加 tile-correct-spring / tile-wrong-shake + sfx 占位
4. **mascot 状态切换** — happy/sad 切换 + bounce
5. **完成面板升级** — 大字标题 + mascot celebrate + confetti + 主按钮巨型

### 3.3 不做的事（保持克制）

- ❌ streak / 等级 / 排行榜（按 SOP "不喧宾夺主"）
- ❌ 真实音频录制（留 Phase D）
- ❌ 拆 JS 文件（保持单文件，按 SOP "保持纯静态前端"）
- ❌ 引入构建工具
- ❌ 大面积改 HUD 进度条（保持单行，进度条多邻国化留 Phase D 可选）

### 3.4 验收清单（每个 C 子集）

- [ ] 跑了 `mobile-one-screen-test.js`, Failed = 0（252/252）
- [ ] 旧 class 保留作为 alias（一次 PR 不删除）
- [ ] 新 class `.is-*` 在新代码优先使用
- [ ] mascot 切换在该游戏的 complete 流程验证通过
- [ ] 手动测试：lobby → 难度 → 3x3 / 5x5 / 7x7 → 答对 / 答错 → 完成 → 再玩一次
- [ ] commit message 标明是哪个游戏（`feat(match): 接入 .is-* 状态 + tile-correct/wrong 动效`）

### 3.5 merge 回 main 时机

C5 stroop-train 完成后 + 全套 252/252 通过 → merge main → 部署。

---

## 4. 实施路径总览

```
当前状态（2026-07-31 23:30）
├─ Phase A   ✅ (commit d32e486) - 视觉/动效基础设施
├─ Phase B   ✅ (commit 63e3631) - lobby 试点
├─ Phase 0.5 ✅ (本文档)         - 设计语言审计
└─ Phase C   🔜                  - 5 个游戏推广

Phase C 实施节奏（按顺序）
├─ C1 match       — 1 commit + 测试 + 部署
├─ C2 memory      — 1 commit + 测试 + 部署
├─ C3 pinyin      — 1 commit + 测试 + 部署
├─ C4 listen      — 1 commit + 测试 + 部署
├─ C5 stroop      — 1 commit + 测试 + 部署
└─ merge main     — 总 commit + 全套测试 + 部署

Phase D (后续, 可选)
├─ sfx 真实音频录制（4 个 key）
├─ mascot 跨游戏联动（multi-mascot 同屏）
├─ HUD 进度条多邻国化
└─ streak 系统（localStorage）
```

---

**文档定位**：配套 AGENTS.md 的"产品设计语言总览"。  
**更新责任**：每次 Phase 完成同步更新对应小节。  
**AGENTS.md 引用**：在 "🌿 迭代开发方法论" 增加"设计语言总览见 current/DESIGN_LANGUAGE.md"。