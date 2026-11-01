# Phase 6 — 分层 SVG letterbox 背景（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 6
>
> 状态：🔵 planning
>
> 📐 **流程**：严格按 `beta_words/AGENTS.md` 三阶段法（Phase A 基础设施 → Phase B 试点 lobby → Phase C 推广 5 个游戏）。每阶段独立 commit，跑 252 测试通过。
>
> 🎯 **基于**：letterbox 区域（黑色上下）目前是空 var(--stage-bg) = #1d221d。Phase 6 把这区域填上分层 SVG 动效，让 letterbox 看起来"活的"。

---

## 🎯 目标

把"看起来死的"黑色 letterbox 区域升级为 3 层 parallax SVG 动效：
- 远景（60s 慢漂）— 云、星、月
- 中景（30s 中速）— 气球、纸飞机
- 近景（15s 快漂）— 闪烁小星、上升气球

**每个游戏 / 场景一个主题**（lobby / match / memory / pinyinFriend / listenCard / stroopTrain），按 `data-game` 切换。

---

## 📋 阶段拆分

### Phase 6A — 通用基础设施

**目标**：定义 letterbox-bg 容器 + 3 层 parallax CSS animation + body data-game 切换 fade。

#### 需求点

**R-6A.1** HTML 加 letterbox-bg 容器（在 .stage 内，.stage-canvas 之前）

```html
<div class="stage">
  <!-- Phase 6: letterbox 3 层 parallax SVG 背景 -->
  <div class="letterbox-bg" data-bg="lobby" aria-hidden="true">
    <svg class="bg-layer bg-layer-1" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice">
      <!-- 远景元素：云 / 星 -->
    </svg>
    <svg class="bg-layer bg-layer-2" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice">
      <!-- 中景元素：气球 / 纸飞机 -->
    </svg>
    <svg class="bg-layer bg-layer-3" viewBox="0 0 100 50" preserveAspectRatio="xMidYMid slice">
      <!-- 近景元素：闪烁小星 / 上升气球 -->
    </svg>
  </div>
  <div class="stage-canvas">...</div>
</div>
```

**验收标准**
- 容器在 letterbox 区域显示，**不挡 cream 画布**
- `pointer-events: none` 不影响点击
- 252/252 测试通过

**R-6A.2** letterbox-bg 容器 CSS

```css
.letterbox-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;  /* 低于 .stage-canvas (z-index 1) */
  overflow: hidden;
  /* 切换 fade */
  opacity: 0;
  transition: opacity 400ms ease;
}
.letterbox-bg.is-active {
  opacity: 1;
}
.bg-layer {
  position: absolute;
  inset: 0;
  width: 200%;  /* 横向扩展，留出漂移空间 */
  height: 100%;
  opacity: 0.7;  /* 不抢戏 */
}
.bg-layer-1 { animation: bg-drift-slow 60s linear infinite; opacity: 0.25; }
.bg-layer-2 { animation: bg-drift-medium 30s linear infinite; opacity: 0.35; }
.bg-layer-3 { animation: bg-drift-fast 15s linear infinite; opacity: 0.40; }
@keyframes bg-drift-slow {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }  /* 100% 宽，所以 -50% 回到原位 */
}
@keyframes bg-drift-medium {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes bg-drift-fast {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
```

**验收标准**
- 3 层用同一 transform 模式（不同速度）
- opacity 区分（0.25 / 0.35 / 0.40）
- 252/252 测试通过

**R-6A.3** body data-game 切换时 letterbox fade

在 `app.js` 现有 `syncTheme()` 加 letterbox 切换：

```js
function syncBgLayer(gameId) {
  // 隐藏当前所有 letterbox-bg
  document.querySelectorAll('.letterbox-bg').forEach((el) => el.classList.remove('is-active'));
  // 显示当前 gameId 的 letterbox-bg
  const target = document.querySelector(`.letterbox-bg[data-bg="${gameId || 'lobby'}"]`);
  if (target) target.classList.add('is-active');
}
```

调用时机：`syncTheme()` / `showScreen("lobby")` / `chooseGame()` 都调一次。

**验收标准**
- body data-game 切换时 letterbox 跟着 fade in/out
- 252/252 测试通过

#### Commit 信息

```
feat(phase-6a): letterbox 背景基础设施 — 3 层 parallax + fade 切换

* index.html: .stage 内加 .letterbox-bg 容器（lobby 占位 SVG）
* styles.css: .letterbox-bg 容器 + 3 层 parallax 动画（60s/30s/15s）
* styles.css: 切换 fade 400ms
* app.js: syncBgLayer() 跟随 body data-game 切换

验证：mobile-one-screen-test.js Failed = 0
```

---

### Phase 6B — 试点（lobby letterbox）

**目标**：在 lobby 实现完整 3 层 SVG（云 + 气球 + 闪烁星），验证 layout + 性能。

#### 需求点

**R-6B.1** lobby SVG 3 层内容

```html
<!-- Layer 1 远景：暖云朵 + 太阳光晕 -->
<svg class="bg-layer bg-layer-1" viewBox="0 0 200 50" preserveAspectRatio="xMidYMid slice">
  <circle cx="20" cy="20" r="6" fill="#fff8d8" opacity="0.6"/>
  <ellipse cx="35" cy="22" rx="8" ry="4" fill="#f5e8c5" opacity="0.4"/>
  <circle cx="170" cy="15" r="5" fill="#fff8d8" opacity="0.5"/>
  <!-- ... 更多云 -->
</svg>

<!-- Layer 2 中景：飘动气球 -->
<svg class="bg-layer bg-layer-2" viewBox="0 0 200 50" preserveAspectRatio="xMidYMid slice">
  <ellipse cx="50" cy="30" rx="3" ry="4" fill="#f08c3a" opacity="0.6"/>
  <line x1="50" y1="34" x2="50" y2="50" stroke="#999" stroke-width="0.3"/>
  <!-- ... 更多气球 -->
</svg>

<!-- Layer 3 近景：闪烁小星 -->
<svg class="bg-layer bg-layer-3" viewBox="0 0 200 50" preserveAspectRatio="xMidYMid slice">
  <polygon points="100,12 102,17 107,17 103,20 105,25 100,22 95,25 97,20 93,17 98,17"
           fill="#f7d75c" opacity="0.8">
    <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
  </polygon>
  <!-- ... 更多星 -->
</svg>
```

**验收标准**
- 单 SVG ≤ 20 个元素，总文件 ≤ 10KB
- 252/252 测试通过
- 视觉验证 letterbox 不再是纯黑

#### Commit 信息

```
feat(phase-6b): lobby letterbox — 3 层 SVG（云 + 气球 + 闪烁星）

* index.html: lobby .letterbox-bg 内填 3 层 SVG
  - Layer 1 远景：云朵 + 太阳光晕（60s 漂）
  - Layer 2 中景：气球 + 铃铛（30s 漂）
  - Layer 3 近景：闪烁小星 + 慢速彩屑（15s 漂）

验证：mobile-one-screen-test.js Failed = 0
手测：letterbox 不再是纯黑，3 层动效可见
```

---

### Phase 6C — 推广 5 个游戏

每个游戏独立 commit，按 phase plan 拆。

#### 5C.1 match（暖橙主题）

- Layer 1: 橙色秋叶 + 阳光
- Layer 2: 橙色气球 + 拍手图标
- Layer 3: 上升星 + 彩屑

#### 5C.2 memory（紫主题）

- Layer 1: 紫色星空 + 弯月
- Layer 2: 紫色萤火 + 星云
- Layer 3: 闪烁水晶 + 流星

#### 5C.3 pinyinFriend（蓝主题）

- Layer 1: 蓝白云 + 彩虹
- Layer 2: 蓝纸飞机 + 雨滴
- Layer 3: 蓝蝴蝶 + 雪花

#### 5C.4 listenCard（绿主题）

- Layer 1: 绿叶 + 树影
- Layer 2: 绿色蜻蜓 + 风铃
- Layer 3: 飘落绿叶 + 绿星

#### 5C.5 stroopTrain（红主题）

- Layer 1: 彩虹 + 太阳
- Layer 2: 彩色泡泡 + 风车
- Layer 3: 上升彩球 + 闪星

---

## ⚠️ 决策点（待主人拍板）

### 决策 1：letterbox 切换是 fade 还是直接显示

| 选项 | 描述 | 后果 |
|---|---|---|
| **A**（推荐） | fade 400ms（plan 默认） | 切换平滑 |
| **B** | 直接显示 | 简单但突兀 |

### 决策 2：3 层动效是同方向还是反向

| 选项 | 描述 | 后果 |
|---|---|---|
| **A**（推荐） | 全部向左漂（同方向，不同速度 = 视差） | 经典 parallax 效果 |
| **B** | 远/近反向漂 | 更立体但容易晕 |

### 决策 3：每个游戏的 SVG 是手绘还是占位元素

| 选项 | 描述 | 工作量 |
|---|---|---|
| **A**（推荐） | 用 SVG 基本元素（circle / ellipse / polygon）手绘简单图案 | 1-2h/游戏 |
| **B** | 委托 image_generate 生成 SVG 插画 | 半天/游戏 |

---

## 🚦 验收 Checklist

- [ ] Phase 6A commit，252/252 通过
- [ ] Phase 6B lobby commit，252/252 + 截图
- [ ] Phase 6C 5 个游戏 commit
- [ ] 主人确认 letterbox 视觉
- [ ] 部署：只发本机 8091

完成后此文档标题改为 `✅ completed`。
