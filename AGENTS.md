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
- **共 252 个断言**，验证所有游戏状态在所有手机上**一屏内可见、无滚动**（`document.documentElement.scrollHeight ≤ window.innerHeight`）

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
#   ✅ = 通过；❌ = 该状态下文档高度超过视口（溢出/滚动）
#   Total: 252, Failed: 0   ← Failed 必须为 0
```

### Pass 标准（**硬性**）

- **Failed = 0** 才算 UI 调整通过
- **不允许"知道有 fail 但修不了就先这样"**。任何 fail 必须修：要么调 CSS 让文档高度 ≤ 视口，要么扩 viewport 范围承认小屏不兼容并写进 README
- 失败时 `overflow` 数值为正数（docH - vpH）；按 label 定位到具体游戏 + 难度 + 状态

### 不能跳过的理由（灵魂级）

这是幼小衔接产品，**实际用户是小朋友的家长和小孩**。手机 viewport 覆盖从 320px 到 393px 横跨 4 年前的入门机到现在的标准机。任何"在 375px 调好看了就完事"的错觉都会让小屏 / 老机型用户一打开就懵——而这些恰恰是产品定位的核心人群。

---

## 📂 项目结构速记

- `current/` — 唯一在维护的源码目录（`index.html` / `styles.css` / `app.js` / `assets/`）
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

一个 UI 调整一个 commit；测试修与 UI 改可拆可合，**但一次提交里所有 UI 改动必须已经过测试**。