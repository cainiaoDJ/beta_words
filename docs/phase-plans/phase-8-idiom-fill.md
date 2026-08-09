# Phase 8 — 成语填空 idiomFill（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md)
>
> 状态：🔵 planning → ⏳ Phase 8A in progress
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法 + `current/GAME_SOP.md` §13 新增游戏流程 + `current/DESIGN_LANGUAGE.md` v2 统一 token。
>
> 🎯 **基于**：clawdo `8ygy4o93`（autonomy=collab，时机已到：所有视觉 phase + 7 BGM 完成）。

---

## 🎯 目标

在 5 个游戏（match/memory/pinyinFriend/listenCard/stroopTrain）基础上，**新增第 6 个游戏：成语填空（idiomFill）**。规则一句话：

> 给 3-7 个成语，每个成语扣掉 1-2 个字，玩家从下方候选字池里**先点空格再选字**（两步式），把字填回成语里。完成整个游戏。

数据范围：**3 年级语文标准**（部编版 3 年级上下册常见成语，约 40 个），不超纲。

---

## 🎨 主题色（**第 7 套 token**）

| ID | accent | bg | accent-soft | ink | glow | 视觉感受 |
|---|---|---|---|---|---|---|
| **idiomFill** | `#6e3eb8` 靛紫 | `rgba(110,62,184,0.06)` | `rgba(110,62,184,0.15)` | `#4d2789` | `rgba(110,62,184,0.4)` | 典雅文化感（区别 memory `#8a4fd6` 浅紫，更深更"古朴"） |

- accent 用 token，不用大面积铺满（守 SOP §11"不装饰光球渐变"）
- 跟 memory 区分：memory `#8a4fd6` 是浅紫（神秘），idiomFill `#6e3eb8` 是深靛紫（典雅/书卷气）
- letterbox SVG 主题色用同色系：紫色萤火 + 紫色星云 + 紫色水晶（呼应 memory 但更深更"古朴"）

---

## 📋 数据：3 年级成语清单（**40 个**）

按部编版 3 年级上下册 + 课后读读写写 + 单元日积月累分类：

### 寓言成语（10 个）— 三年级下册第二单元
1. 亡羊补牢（wáng yáng bǔ láo）
2. 揠苗助长（yà miáo zhù zhǎng）
3. 画蛇添足（huà shé tiān zú）
4. 守株待兔（shǒu zhū dài tù）
5. 叶公好龙（yè gōng hào lóng）
6. 狐假虎威（hú jiǎ hǔ wēi）
7. 自相矛盾（zì xiāng máo dùn）
8. 刻舟求剑（kè zhōu qiú jiàn）
9. 邯郸学步（hán dān xué bù）
10. 杞人忧天（qǐ rén yōu tiān）

### 自然成语（10 个）— 三年级上册第三/七单元 + 下册第一/四单元
1. 五光十色（wǔ guāng shí sè）
2. 千姿百态（qiān zī bǎi tài）
3. 万紫千红（wàn zǐ qiān hóng）
4. 五颜六色（wǔ yán liù sè）
5. 色彩斑斓（sè cǎi bān lán）
6. 莺歌燕舞（yīng gē yàn wǔ）
7. 春暖花开（chūn nuǎn huā kāi）
8. 形态各异（xíng tài gè yì）
9. 成群结队（chéng qún jié duì）
10. 芬芳迷人（fēn fāng mí rén）

### 习作/动作/性格成语（10 个）— 三年级上下册常用
1. 一丝不苟（yī sī bù gǒu）
2. 专心致志（zhuān xīn zhì zhì）
3. 聚精会神（jù jīng huì shén）
4. 欢声笑语（huān shēng xiào yǔ）
5. 争先恐后（zhēng xiān kǒng hòu）
6. 各抒己见（gè shū jǐ jiàn）
7. 津津有味（jīn jīn yǒu wèi）
8. 不紧不慢（bù jǐn bù màn）
9. 垂头丧气（chuí tóu sàng qì）
10. 哈哈大笑（hā hā dà xiào）

### ABAC / AABB / 数字成语（10 个）— 三年级上册第一/三单元
1. 摇摇摆摆（yáo yáo bǎi bǎi）
2. 清清楚楚（qīng qīng chǔ chǔ）
3. 明明白白（míng míng bái bái）
4. 有说有笑（yǒu shuō yǒu xiào）
5. 走来走去（zǒu lái zǒu qù）
6. 又大又红（yòu dà yòu hóng）
7. 三心二意（sān xīn èr yì）
8. 五湖四海（wǔ hú sì hǎi）
9. 四面八方（sì miàn bā fāng）
10. 七上八下（qī shàng bā xià）

> 📁 **数据规模**：40 个成语。难度 7 时每局 7 个成语 + 干扰字，40 个够随机抽（不重复池大）。

---

## 📋 难度梯度（主人拍板）

| Size | idiomCount | blankPerIdiom | 总待选字数 | 干扰字数 | 总候选字数 |
|---|---|---|---|---|---|
| 3 | 3 | 1 | 3 | 1 | 4 |
| 4 | 4 | 1 | 4 | 1 | 5 |
| 5 | 5 | 2 | 10 | 1 | 11 |
| 6 | 6 | 2 | 12 | 2 | 14 |
| 7 | 7 | 2 | 14 | 2 | 16 |

- 干扰字：从 40 个成语的**未扣字**里随机抽，不引入其他字（保持纯净）

---

## 🛠 实施 stages

### Phase 8A — 数据 + 注册 + 主题色 + 静态展示（**当前**）

#### 需求点

**R-8A.1** `app.js` 加 `IDIOMS` 数据表（40 个 3 年级成语）

```js
const IDIOMS = [
  { id: "wybl", value: "亡羊补牢", blanks: [2], pinyin: "wáng yáng bǔ láo" },
  // blanks 是 value 中被扣字的 index 数组（0-based）
  // 每条成语至少有 1 个可扣字位置
];
```

**R-8A.2** 加 `IDIOM_SETTINGS`

```js
const IDIOM_SETTINGS = {
  3: { idiomCount: 3, blankPerIdiom: 1 },
  4: { idiomCount: 4, blankPerIdiom: 1 },
  5: { idiomCount: 5, blankPerIdiom: 2 },
  6: { idiomCount: 6, blankPerIdiom: 2 },
  7: { idiomCount: 7, blankPerIdiom: 2 },
};
```

**R-8A.3** `GAMES` 加 `idiomFill` 配置

```js
idiomFill: {
  id: "idiomFill",
  name: "成语填空",
  title: "把成语填完整",
  boardLabel: "成语填空区",
  startHint: "先点一个空格，再选字",
  recordPrefix: "beta_words_idiom_fill_best"
}
```

**R-8A.4** `RECOMMENDED_SIZE` 加 idiomFill 推荐难度（4，跟其他游戏一致）

**R-8A.5** `styles.css` 加第 7 套主题色 token

```css
:root {
  --theme-idiomFill-bg: rgba(110, 62, 184, 0.06);
  --theme-idiomFill-accent: #6e3eb8;
  --theme-idiomFill-accent-soft: rgba(110, 62, 184, 0.15);
  --theme-idiomFill-ink: #4d2789;
  --theme-idiomFill-glow: rgba(110, 62, 184, 0.4);
}
[data-game="idiomFill"] {
  --theme-bg: var(--theme-idiomFill-bg);
  --theme-accent: var(--theme-idiomFill-accent);
  --theme-accent-soft: var(--theme-idiomFill-accent-soft);
  --theme-ink: var(--theme-idiomFill-ink);
  --theme-glow: var(--theme-idiomFill-glow);
}
```

**R-8A.6** 大厅 HTML 加 `id="open-idiom-fill"` 入口（参考 match/memory 的 .game-entry）

**R-8A.7** `index.html` 加 letterbox SVG（紫色萤火 + 紫色星云 + 紫色水晶 3 层）

```html
<div class="letterbox-bg" data-bg="idiomFill" aria-hidden="true">
  <!-- Layer 1: 紫色星云（远景 60s 漂）-->
  <!-- Layer 2: 紫色萤火（中景 30s 漂）-->
  <!-- Layer 3: 紫色水晶 + 闪烁星（近景 15s 漂）-->
</div>
```

**R-8A.8** 加 `#idiom-host` 容器（放游戏区）

```html
<section id="idiom-host" class="zone-stack" hidden>
  <!-- HUD（标题 + 进度 + 计时器）-->
  <!-- Slot machine 滚筒 240px -->
  <!-- Candidate pool 候选字池 -->
</section>
```

**R-8A.9** `app.js` 加 `chooseGame/startGame/leaveGame` 的 idiomFill 分支（先空架子，能进游戏屏看到静态滚筒）

**R-8A.10** 静态滚筒渲染：成语列表 + 当前聚焦行（先静态展示，不接交互）

**R-8A.11** mobile-one-screen-test.js 加 idiomFill 断言（lobby 入口 + setup 难度 + game 屏静态滚筒）

#### 验收标准

- 大厅能看到第 6 个游戏入口"成语填空"
- 点入口 → 进 setup（4 推荐难度标黄）→ 选难度 → 进游戏屏
- 游戏屏看到 letterbox 紫色背景 + 滚筒 + 候选字池静态展示
- 滚筒第 1 个成语居中（其他半隐藏），候选字池显示扣出来的字 + 干扰字
- 252+12=264 测试通过
- mobile-one-screen-test.js 截图肉眼确认紫色调 + 滚筒节奏

#### Commit 信息

```
feat(phase-8a): 成语填空 Phase 8A — 数据 + 注册 + 主题色 + 静态展示

加 40 个 3 年级成语数据（寓言/自然/习作/ABAC 4 类）+ IDIOM_SETTINGS
5 档难度 + 第 7 套紫色主题色 token（idiomFill 靛紫 #6e3eb8，区别
memory 浅紫 #8a4fd6）+ 大厅入口 + letterbox 紫色 SVG + #idiom-host
静态滚筒 + 候选字池展示。

* app.js: 加 IDIOMS, IDIOM_SETTINGS, GAMES.idiomFill, RECOMMENDED_SIZE
* styles.css: 加 --theme-idiomFill-* 5 个 token + [data-game="idiomFill"]
* index.html: 加 letterbox SVG + 大厅入口 + #idiom-host 容器
* scripts/mobile-one-screen-test.js: 加 idiomFill 断言

验证：264/264 测试通过
```

---

### Phase 8B — 两段式交互（点 slot + 点候选字 + 退回）

#### 需求点

**R-8B.1** 点 slot → `state.selectedSlot = {idiomId, slotIdx}` + slot 加 `.is-selected`（黄色脉冲边框）
**R-8B.2** 点已选中 slot → 清 `state.selectedSlot` + slot 去 `.is-selected`
**R-8B.3** 点已填 slot（`.is-filled`）→ 字退回候选字池 + slot 去 `.is-filled`
**R-8B.4** 点候选字（无 selectedSlot）→ 抖动候选字池 + TTS "先点一个空格"
**R-8B.5** 点候选字（有 selectedSlot）→ 字填入选中 slot + `.is-filled` + 清 selectedSlot

#### 关键 bug 防护（**主人 7-05 痛点**）

- ✅ 滚筒行间距 10px（卡片不粘连）
- ✅ 选中边框用 `.is-selected` class（黄色脉冲，`box-shadow: 0 0 0 3px var(--theme-accent)` + animation pulse）
- ✅ 字填入 slot 严格走 `state.selectedSlot` 单一来源
- ✅ slot 点击优先判断：`.is-filled` → 退字；否则 → 切换 selectedSlot

#### Commit 信息

```
feat(phase-8b): 成语填空两段式交互 — 点 slot + 点候选字 + 退回

实现 idiomFill 两段式交互：state.selectedSlot 单一来源，点 slot 切换
选中（.is-selected 黄色脉冲），点已填 slot 退字，点候选字填入选中 slot。
防 7-05 bug：滚筒 10px 行间距、单一来源、.is-selected class 复用。

* app.js: handleIdiomSlotClick + handleIdiomCandidateClick + 字池渲染
* styles.css: .idiom-slot.is-selected 黄色脉冲 + .idiom-slot.is-filled 绿脉冲
* styles.css: .idiom-row gap 10px + .candidate-pool 抖动 animation

验证：264/264 测试通过
```

---

### Phase 8C — 完成判定 + TTS + advance + 完成面板

#### 需求点

**R-8C.1** 填对一个完整成语（4 字全对）→ `playIdiomVoice(idiom)` TTS 读整个成语 + 触发 `advanceToNextIdiom()`
**R-8C.2** `advanceToNextIdiom()`：找下一个未完成成语 + `focusIdiom(next)` + 滚筒 translateY 平滑切换
**R-8C.3** 所有成语完成 → 触发完整游戏完成（star/trophy/计时/best record 沿用 4B）
**R-8C.4** BGM：沿用 `bgmController.playForGame(state.game)`，advance 时不停，完成时 fadeOut
**R-8C.5** 答对一个完整成语 → 8 片紫色彩屑（hue 258）+ `setMascotState("happy")`
**R-8C.6** 完成整个游戏 → 全滚筒成语 fade in 高亮 + 一起 TTS 朗读（每个成语 1.5s 间隔）+ `setMascotState("celebrate")` + confetti

#### Commit 信息

```
feat(phase-8c): 成语填空完成判定 + TTS + advance + 完成面板

成语填空完成判定：填对一个成语 → TTS 读成语 + 紫色彩屑 + 跳下一个；
全完成 → 滚筒成语 fade in 高亮 + TTS 全部读 + mascot celebrate + confetti。
完成面板沿用 Phase 4B 算法（rate = 完成成语 / 总成语）。

* app.js: playIdiomVoice + advanceToNextIdiom + 完成判定
* app.js: completeIdiomFill + mascot 切换 + confetti
* styles.css: .idiom-row.is-complete 高亮 + fade in

验证：264/264 测试通过 + 手测 3x3 完成路径
```

---

### Phase 8D — 测试 + BGM 验证 + 部署本机

#### 需求点

**R-8D.1** `mobile-one-screen-test.js` 加 idiomFill 完整路径断言
**R-8D.2** `node --check current/app.js` 通过
**R-8D.3** `git diff --check` 通过
**R-8D.4** tar+ssh 部署 `~/codex/beta_words/current/` → `/home/alpha/apps/beta_words/current/`
**R-8D.5** curl 验证：`/` 200, `/assets/backgrounds/idiomFill.svg` 200, 6+1=7 个 game card 都在
**R-8D.6** 主人手测：lobby → 成语填空 → 3x3 / 5x5 / 7x7 → 完成 → 再玩一次 → 回大厅

#### Commit 信息

```
docs(phase-8d): 成语填空 Phase 8D — 测试 + BGM 验证 + 部署

跑全套 264/264 测试通过，部署本机 8091，curl 验证 letterbox SVG 服务正常。

* docs: 标记 Phase 8A/B/C/D completed
* feat(deploy): tar+ssh 推送本机

验证：本机 8091 可访问、lobby 7 个入口、game 屏可玩
```

---

## ⚠️ 风险

| 风险 | 兜底 |
|---|---|
| 滚筒 translateY 在 iOS Safari 性能 | 用 transform + will-change: transform，禁用 box-shadow 动画 |
| safe-area-inset 在 iPhone 刘海屏 | padding-top/bottom 加 env(safe-area-inset-*) |
| 7-05 bug 重现（卡片粘连 / 选中消失 / 字没填入） | 单一 state 来源 + 10px gap + .is-selected class 复用 |
| 40 个成语不够随机抽（难度 7 时容易重复）| 后期扩到 60 个；先用 40 |
| TTS 读成语浏览器不支持（zh-CN 4 字成语）| fallback `speak(idiom.value)` 包 try/catch |
| BGM 集成时 advance 节奏 | 完成一个成语不切 BGM，整个游戏完成才 fadeOut |
| 完成面板"完成率"语义：完成成语 / 总成语 | 沿用 4B `correct/total` 模式，rate 算法不变 |

---

## 🚦 验收 Checklist

- [ ] Phase 8A commit + 264 测试通过 + 主人截图确认紫色调
- [ ] Phase 8B commit + 264 测试通过 + 主人手测两段式交互（点 slot + 点字 + 退字）
- [ ] Phase 8C commit + 264 测试通过 + 主人手测完整路径（3x3/5x5/7x7 完成）
- [ ] Phase 8D commit + 部署本机 8091 + curl 验证
- [ ] 主人确认 idiomFill 视觉/交互/反馈符合改版设计要求
- [ ] 合并入 PLAN 总纲未来阶段

完成后此文档标题改为 `✅ completed`，并附实际 commit hash 列表。