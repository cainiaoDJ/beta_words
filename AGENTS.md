# Repository Guidelines — beta_words

项目：`beta_words`（幼小衔接识字游戏，纯静态前端 HTML/CSS/JS）。

产品说明见 `current/README.md`，部署细节见 `current/DEPLOYMENT.md`，游戏设计与开发准则见 `current/GAME_SOP.md`。**本文件只写开发守则与基准要求**，不重复产品/部署内容。

---

## 🧪 基准要求：多设备兼容测试（**必跑**）

**任何 UI 调整（HTML 布局、CSS 尺寸、字体、动画、SVG、栅格、字号、行距、padding/margin、按钮位置等）完成提交前，必须先跑 `scripts/mobile-one-screen-test.js`，全部通过才算 UI 调整完成。**

不只是大改：哪怕改一个 `padding`、一行 CSS、一处字体大小，只要可能影响文档高度，都要先跑一遍。哪怕只是临时测一下的微调，本地过完测试再合。

### 测试覆盖

- **7 个手机 viewport**：iPhone 13 / SE 2nd / 12 mini / 8、Pixel 5、小屏 (360×640)、极小屏 (320×568)
- **每个 viewport × 36 个测试点**：lobby + 5 个 setup + 5 游戏 × 3 难度 × (gameplay + complete panel)
- **共 252 个断言**，验证所有游戏状态在所有手机上**一屏内可见、无滚动**
- 断言细节（2026-07-29 架构变更后）：
  - 主断言：`.stage-canvas` 的 getBoundingClientRect 完全在 viewport 内（设计画布缩放后 fit 进视口）
  - 次断言：`.screen.active` 的 scrollHeight ≤ 640 设计 px（内部内容不溢出）

### 怎么跑

```bash
cd /home/alpha/codex/beta_words

# 1) 起本地静态服务（任选其一；远程已部署版可直接用）
python3 -m http.server 4173 &
# 或：直接用内网部署版 http://192.168.31.60:8091/（默认）

# 2) 跑测试（依赖 /tmp/node_modules/playwright）
node scripts/mobile-one-screen-test.js http://127.0.0.1:4173/
# 不传 URL 则默认 http://192.168.31.60:8091/

# 3) 看输出
#   ✅ = 通过；❌ = 该状态下画布超出视口或内部溢出
#   Total: 252, Failed: 0   ← Failed 必须为 0（fail 时 exit 1）
```

### Pass 标准（**硬性**）

- **Failed = 0** 才算 UI 调整通过
- **不允许"知道有 fail 但修不了就先这样"**。任何 fail 必须修：要么调 CSS 让文档高度 ≤ 视口，要么扩 viewport 范围承认小屏不兼容并写进 README
- 失败时输出具体 fail 位置（device + state + 数值），按 label 定位到具体游戏 + 难度 + 状态

### 不能跳过的理由（灵魂级）

这是幼小衔接产品，**实际用户是小朋友的家长和小孩**。手机 viewport 覆盖从 320px 到 393px 横跨 4 年前的入门机到现在的标准机。任何"在 375px 调好看了就完事"的错觉都会让小屏 / 老机型用户一打开就懵——而这些恰恰是产品定位的核心人群。

---

## 📂 项目结构速记

- `current/` — 唯一在维护的源码目录（`index.html` / `styles.css` / `app.js` / `assets/` / `scripts/stage.js`）
- `scripts/mobile-one-screen-test.js` — 多设备兼容测试（必跑）
- `scripts/README.md` — 该测试的精简说明
- **不要**直接编辑 `/home/alpha/apps/beta_words/current/` 里的文件——那是部署目录，由本仓库通过 tar+ssh 流式同步过去

## 🚀 提交前 Checklist

UI 调整：

- [ ] 改动了哪些文件（HTML / CSS / JS / 资源）
- [ ] **跑了 `mobile-one-screen-test.js`，Failed = 0**（必填，缺则视为未完成）
- [ ] 改动在桌面 / 横屏 / iPad 等更大 viewport 上没引入新 bug（手测 / 浏览器 responsive 模式粗看）

非 UI 调整（如纯音频资源、纯文案）：

- [ ] 不影响布局的前提下无需跑测试
- [ ] 但如果改动了 DOM 结构或 class 名让 Playwright 选择器失效，必须同步修测试脚本

## 📝 提交信息

沿用项目已有的常规风格：

- UI 调整：`ui: <一句话说明>`（如 `ui: 缩小完成面板字号避免 iPhone SE 溢出`）
- 测试修：`test: <一句话说明>`（如 `test: 给 iPhone SE 加 320 宽度容忍`）
- 资源：`asset: <一句话说明>`
- 架构/基础设施：`feat: <一句话说明>` 或 `feat(zone): <一句话说明>`（如 `feat(zone): 统一游戏画面分区 token 与 .zone-* 类`）
- Bug 修复：`fix: <一句话说明>` 或 `fix(stroop): <一句话说明>`（如 `fix(stroop): 棋盘字号在 7x7 时溢出 12px`）

一个 UI 调整一个 commit；测试修与 UI 改可拆可合，**但一次提交里所有 UI 改动必须已经过测试**。

---

## 🌿 迭代开发方法论（2026-07-29 立，架构级改动专用）

适用场景：**跨多个子游戏 / 跨多个页面的架构级改动**——典型如统一布局、新增组件库、设计系统重构、跨游戏的视觉 token 收敛。任何会同时影响 ≥2 个 `.screen.active` 内部结构的改动都属于这一类。

**普通单点 UI 调整不适用本方法论**——一行 CSS / 一个 padding 改动还是按上面"🧪 基准要求"走（单点 fix 不需要走三阶段）。

### 1. 分支策略

- **架构级改动开新分支**：`feat/<topic-slug>` 命名（如 `feat/unified-game-zones`、`feat/design-tokens-v2`）
- **不在 main 上直接做大改**——避免污染 main 的稳定性
- 分支完成且全套测试通过后 → merge 回 main → 立刻部署

### 2. 三阶段（**必走，不能跳**）

```
Phase A 基础设施/框架   →  Phase B 试点（Pilot）  →  Phase C 推广（Rollout）
   纯 CSS token / 抽象层         选 1 个最简子集        一个个迁移其他子集
   不动任何具体业务              验证框架可用           每子集独立 commit
```

#### Phase A：基础设施（framework first）

- 范围：CSS token、共享类（`.zone-*`、`.btn-*`）、抽象层、纯工具函数
- **硬性约束**：**绝对不动任何具体业务页面**（不修改游戏 `.screen.active` 内部的 HTML/CSS/JS）
- 完成标志：跑现有测试 252/252 通过（**没改业务但要证明没坏**）→ commit

#### Phase B：试点（pilot first，**不能跳**）

- 范围：**只选 1 个最简子集**（结构最简单、依赖最少、最不会触雷的那个）
- 试点失败的代价最低——能验证框架是否真的可用
- 完成标志：试点子集跑测试 252/252 通过 → commit
- **试点失败必须回 Phase A 改框架**，不能"先这样以后再优化"——框架有缺陷时越往后越难回头

#### Phase C：推广（rollout one-by-one）

- 范围：剩余子集**一个个**迁移，**绝对不批量**
- 每个子集独立 commit、独立跑测试
- 完成标志：全套测试 252/252 通过 → merge 回 main

### 3. 回归测试（**修复 commit 的灵魂**）

迁移过程中必然会暴露新 bug。这是正常的。处理规范：

- 每个迁移 commit 前必须跑**当前子集测试**
- **每个迁移 commit 后必须跑"回归测试"**——之前所有已迁移子集也要跑一遍，确保没被破坏
- 跑测试发现新 fail → **不要**和迁移 commit 混在一起：
  - 选项 A：先 revert 当前改动 → 单独开 `fix:` commit → 验证 → 再继续
  - 选项 B：先完成迁移 commit（含已知 fail），单独开 `fix:` commit 修复 → **必须在 commit message 里写明"已知 fail: <状态>，fix 见下个 commit"**
  - **不允许**"批量改 5 个游戏然后跑测试，发现 8 个 fail，一次性修"的搞法——追溯性太差

### 4. 修复 commit 规范

`fix(<scope>): <一句话 bug 描述>`

message 必须包含：

```text
触发测试点：<device> × <state>
根因：<一句话>
修法：<一句话>
验证：mobile-one-screen-test.js Failed = 0
```

**根因不能是"我不确定为什么这样写"**——必须 ssh 上 dev 环境实测 / 打开 Playwright trace 看到再写。

### 5. 框架迭代的边界

推广过程中**不允许**改 Phase A 的框架。理由：框架变了 = 之前所有迁移都作废。

如果发现框架有缺陷，三个选项（按推荐顺序）：

1. **局部 hack**（用 `games/<id>.css` 或 zone 内部 override）—— 接受短期技术债，记入已知问题清单
2. **回滚**——把 Phase C 已迁移的子集全部 revert，回到 Phase B 试点失败，改框架，重新走流程
3. **开新分支**——创建 `feat/<topic>-v2` 分支继承 v1 的工作，在 v2 上重做框架（适用于结构性缺陷）

### 6. 验收清单（Phase B/C 每个子集完成时）

- [ ] 跑 `mobile-one-screen-test.js`，Failed = 0（**当前子集 + 之前已迁移子集都要跑**）
- [ ] 手测当前子集：lobby → 难度 → 3x3 / 5x5 / 7x7 → 完成 → 再来
- [ ] 手测其他已迁移子集**至少 1 个**（不全量，但要抽样确认没回归）
- [ ] commit message 标明是哪个阶段（`feat(zone):` `ui(match):` `fix(stroop):`）

### 7. merge 回 main

- 分支上**所有 phase 完成** + 全套测试 252/252 通过
- `git checkout main && git merge --no-ff feat/<topic>`（**保留分支拓扑**，便于将来追到这次大改）
- merge 后**立刻**部署（tar+ssh 流式同步），不要让分支留在 main 上没部署

#### 7.1 远端拓扑（2026-11-01 核实）

本仓库有两个 remote，**活跃的是 `github`**：

| remote | 地址 | 状态 | 内容 |
|---|---|---|---|
| `github` | `git@github.com:cainiaoDJ/beta_words.git` | ✅ 活跃，唯一可写可推 | `main` / `feat/*` |
| `origin` | `ssh://git@sophie520.top:22000/Alpha/beta_words.git` | ❌ Gitea 已于 2026-10-21 停用 | 仅存 `main`（f7f6a0f，22 commits） |

- **产品真实演进线**：`origin/main`（f7f6a0f）→ `feat/trace-tian`（4743b11，线上基线）→ `feat/math-flash`（29030a3）。
  `origin/main` 是这条线的祖先，但因 Gitea 停用，**`main` 分支已推至 github**（2026-11-01，`d73619e`）。
- **`master`（dc9eca5）不是主干**：它是 2026-09-22 的一次性导入快照，与 `origin/main` **无共同祖先**，
  文件布局也不同（老式根目录 `app.js`/`styles.css`，无 `current/`）。**不要往 master 上 merge**。
- 合并主干前先确认目标：`git merge-base --is-ancestor origin/main <分支>` 应为真。
- 新建 main 时用 `git checkout -b main origin/main`（拿真主干起点），**不要**从 `master` 建。
- 推 `main` 用 `git push github main:main`（Gitea 已死，往 origin 推会失败）。

### 8. 当前进行中的架构改动

- **feat/unified-game-zones**（2026-07-29 开）：统一 5 个游戏的画面分区
  - Zone Framework：Z1 title / Z2 status-hud / Z3 primary（统一 300×300）/ Z4 secondary / Z5 toolbar
  - 试点游戏：match（最简，1 个主元素）
  - 推广顺序：match → memory → pinyin-friend → listen-card → stroop-train
