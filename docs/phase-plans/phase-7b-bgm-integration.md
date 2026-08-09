# Phase 7B — BGM 集成（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 7
>
> 状态：🔵 planning（2026-08-09 启动）

---

## 🎯 目标

把 Phase 7A 入库的 6 首 BGM（lobby / match / memory / pinyinFriend / listenCard / stroopTrain）真实落地到游戏：进 play 自动播放对应 BGM、离 play fade out、TTS 触发时 duck、Voice picker 加开关、记住用户偏好。

---

## 📋 需求点

### R-7B.1 HTML 注入 6 个 `<audio>` 标签

**做什么**：在 `index.html` body 末尾 voice-picker 之前，加 6 个 `<audio loop preload="auto">`，src 指 `assets/music/{id}.mp3`。

**验收标准**：
- 6 个 audio 标签存在（id= `bgm-lobby` / `bgm-match` / `bgm-memory` / `bgm-pinyinFriend` / `bgm-listenCard` / `bgm-stroopTrain`）
- `loop` 属性 = true
- `preload="auto"` 让浏览器提前缓存
- **不要**在 lobby letterbox-bg 之前（保持层级清晰）
- 6 个 tag 总体积 21MB（暂时不压 — 部署前统一处理）

**自测步骤**：
```bash
grep -c '<audio id="bgm-' current/index.html  # 应返回 6
```

### R-7B.2 `bgmController` 模块（app.js 末尾 IIFE）

**做什么**：加一个 IIFE 模块，封装 BGM 生命周期。

**状态**：
- `audios` — `{lobby: <audio>, match: <audio>, ...}` 映射（启动时一次性 querySelectorAll 拿到）
- `currentGameId` — 当前播放的 gameId（null 表示未播放）
- `audioUnlocked` — 浏览器是否允许 autoplay（首次 click 后 true）
- `enabled` — 用户偏好（默认 true，localStorage `beta_words_bgm_pref`）
- `volume` — 当前音量（默认 0.3）
- `ducked` — 是否在 duck 状态（防重入）

**API**：
- `bgmController.playForGame(gameId)` — 切到对应 game 的 audio，淡入 0.3s → 播放（如果 unlocked + enabled）
- `bgmController.stop()` — 离 play，淡出 0.3s → pause + currentTime=0
- `bgmController.duck()` — TTS 触发，淡到 0.1（250ms ramp）
- `bgmController.restore()` — TTS 结束，淡回 0.3（500ms ramp）
- `bgmController.toggle(on)` — voice picker 开关，关闭则 stop()，开启记忆偏好
- `bgmController.unlock()` — 用户首次 click 后调一次，让后续 audio.play() 不被浏览器拒绝

**音轨选择**：lobby 进 play 用对应 game 的 audio（**lobby 自身不播 BGM**，lobby 不需要——lobby 选游戏是 30 秒内的过渡）。但 audio 元素仍存在，必要时可播。

**验收标准**：
- 252/252 测试通过（mobile-one-screen-test.js 不破）
- 手动验证：进 match → BGM 触发；离 play → BGM fade；TTS 触发 → BGM duck；TTS 结束 → 恢复

### R-7B.3 接入游戏生命周期

**接入点（app.js）**：

| 钩子 | 函数 | 行为 |
|---|---|---|
| 用户首次任意 click | 全局 click 委托 → `bgmController.unlock()` | 标记 audioUnlocked = true |
| `startGame(size)` 末尾 | `bgmController.playForGame(state.game)` | 进 play 时启动 |
| `leaveGame()` 内 | `bgmController.stop()` | 离 play 时停 |
| `playVoice(key, fallbackText)` 进入语音播放前 | `bgmController.duck()` | TTS 触发时降音量 |
| `playVoice` 的 audio `ended` 事件 + `speechSynthesis` `onend` | `bgmController.restore()` | TTS 结束恢复 |

**注意**：speechSynthesis 的 `onend` 在不同浏览器行为不一致，加兜底 timer（duck 后 8s 自动 restore，防止卡死）。

### R-7B.4 Voice picker 加 BGM 开关

**做什么**：在 voice picker modal 里加一行 "🎵 背景音乐" toggle。

**位置**：`<div id="voice-list">` 上方或下方（与音色选择同一容器）。

**HTML 结构**：
```html
<div class="voice-modal-row bgm-toggle-row">
  <span class="bgm-toggle-label">🎵 背景音乐</span>
  <button id="bgm-toggle" class="toggle-switch" type="button" role="switch" aria-checked="true">
    <span class="toggle-knob"></span>
  </button>
</div>
```

**CSS**：
- `.toggle-switch` — 44×24 圆角按钮，开/关两态背景色切换（主题色 vs 灰灰）
- `.toggle-knob` — 白色圆点，绝对定位，开时 translateX(20px)

**JS**：
- init 时读 localStorage `beta_words_bgm_pref`
- click toggle → 调 `bgmController.toggle(!enabled)` → 更新 aria-checked + 写 localStorage

**验收标准**：
- voice picker 里有 BGM toggle 行
- 默认开（与 localStorage 同步）
- 关闭后立刻 fadeOut 正在播放的 BGM
- 重新打开后下次进 play 启动 BGM
- 偏好跨刷新保留

### R-7B.5 静默 fallback

**风险**：audio 加载失败 / 浏览器拒绝 autoplay / `<audio>` 不存在 → 不影响游戏功能。

**兜底**：
- 每次 `playForGame` 内部 `audio.play().catch(() => {})` — 失败静默
- `audio.play()` 报 NotAllowedError（autoplay 未解锁）→ 等下次 unlock 后才能播
- audio 标签 HTML 没找到 → `audios[gameId]` 为 undefined → playForGame 直接 return

### R-7B.6 自测 252/252 通过

**步骤**：
```bash
cd ~/codex/beta_words
node current/scripts/stage.js  # 不破
```

加上手动测试：lobby → match 3x3 → 听 BGM → 答对一题听 TTS duck → 答错听 TTS duck → 完成 → 回 lobby → 听 BGM fadeOut

### R-7B.7 部署 + 截图

- `tar -cf - ... | (cd /home/alpha/apps/beta_words/current && tar -xf -)` 同步 6 个 MP3 + index.html + app.js + styles.css
- `systemctl --user restart beta-words.service`
- curl http://192.168.31.60:8091/ 验证 200
- 截图给主人体验（手机浏览器）

---

## ⚠️ 风险 / 约束

| 风险 | 兜底 |
|---|---|
| 浏览器 autoplay 政策：首次必须用户手势 | 首次任意 click → `audioUnlocked = true`；之后 audio.play() 允许 |
| speechSynthesis.onend 在 Safari/iOS 不稳定 | 兜底 timer（duck 后 8s 自动 restore） |
| BGM 音量过大盖住字音 | duck 到 0.1（25%），TTS 本身音量已经够大 |
| audio 标签在 tab 后台被暂停 | 浏览器行为，不可控；用户切回来会自动恢复 |
| MP3 文件大（21MB 总）影响首屏加载 | audio `preload="auto"` 让浏览器后台下载；首次 click 解锁才播 |
| 6 个 MP3 同时加载内存压力 | 现代浏览器 ≥100MB 内存，21MB 无压力 |
| audio 元素挂在 DOM 树里占层级 | `<audio>` 默认 display:none，不影响视觉 |

---

## 🔧 实施步骤

### Step 1: 写当前 plan（本文件）✅

### Step 2: index.html 加 6 个 `<audio>`

在 `</main>` + voice-picker 之前（或更靠后），加：
```html
<!-- Phase 7B: BGM 6 首 — 触发由 app.js bgmController 控制 -->
<audio id="bgm-lobby" src="assets/music/lobby.mp3" loop preload="auto"></audio>
<audio id="bgm-match" src="assets/music/match.mp3" loop preload="auto"></audio>
<audio id="bgm-memory" src="assets/music/memory.mp3" loop preload="auto"></audio>
<audio id="bgm-pinyinFriend" src="assets/music/pinyinFriend.mp3" loop preload="auto"></audio>
<audio id="bgm-listenCard" src="assets/music/listenCard.mp3" loop preload="auto"></audio>
<audio id="bgm-stroopTrain" src="assets/music/stroopTrain.mp3" loop preload="auto"></audio>
```

### Step 3: app.js 加 bgmController

在文件末尾加 IIFE（参考 stage.js 模式），暴露 `window.bgmController`：
```js
(function initBgmController() {
  const audios = {
    lobby: document.getElementById('bgm-lobby'),
    match: document.getElementById('bgm-match'),
    memory: document.getElementById('bgm-memory'),
    pinyinFriend: document.getElementById('bgm-pinyinFriend'),
    listenCard: document.getElementById('bgm-listenCard'),
    stroopTrain: document.getElementById('bgm-stroopTrain'),
  };
  const pref = localStorage.getItem('beta_words_bgm_pref');
  let enabled = pref === null ? true : pref === 'on';
  let audioUnlocked = false;
  let currentGameId = null;
  let volume = 0.3;
  let ducked = false;
  let duckTimer = null;

  function ramp(toVolume, ms, cb) {
    const from = volume;
    const start = performance.now();
    function step(now) {
      const t = Math.min(1, (now - start) / ms);
      const v = from + (toVolume - from) * t;
      if (currentGameId && audios[currentGameId]) {
        audios[currentGameId].volume = v;
      }
      if (t < 1) requestAnimationFrame(step);
      else { volume = toVolume; cb && cb(); }
    }
    requestAnimationFrame(step);
  }

  const api = {
    unlock() { audioUnlocked = true; },
    playForGame(gameId) {
      if (!enabled || !audioUnlocked) return;
      const a = audios[gameId];
      if (!a) return;
      if (currentGameId === gameId) return; // 已播
      // 停旧的
      if (currentGameId && audios[currentGameId]) {
        audios[currentGameId].pause();
        audios[currentGameId].currentTime = 0;
      }
      currentGameId = gameId;
      a.volume = 0;
      a.play().catch(() => { /* 静默 */ });
      ramp(0.3, 300);
    },
    stop() {
      if (currentGameId && audios[currentGameId]) {
        ramp(0, 300, () => {
          audios[currentGameId].pause();
          audios[currentGameId].currentTime = 0;
          currentGameId = null;
        });
      } else {
        currentGameId = null;
      }
      if (duckTimer) { clearTimeout(duckTimer); duckTimer = null; }
      ducked = false;
    },
    duck() {
      if (!currentGameId || ducked) return;
      ducked = true;
      ramp(0.1, 250);
      // 兜底 timer 8s 防卡死
      if (duckTimer) clearTimeout(duckTimer);
      duckTimer = setTimeout(() => api.restore(), 8000);
    },
    restore() {
      if (duckTimer) { clearTimeout(duckTimer); duckTimer = null; }
      if (!ducked) return;
      ducked = false;
      ramp(0.3, 500);
    },
    toggle(on) {
      enabled = !!on;
      localStorage.setItem('beta_words_bgm_pref', enabled ? 'on' : 'off');
      if (!enabled) api.stop();
    },
    isEnabled() { return enabled; },
  };
  window.bgmController = api;

  // 全局 click 委托：首次 click 解锁
  document.addEventListener('click', function unlockOnce() {
    api.unlock();
    document.removeEventListener('click', unlockOnce);
  }, { once: true });
})();
```

### Step 4: 接入游戏生命周期

在 `startGame` 末尾 + `leaveGame` 内 + `playVoice` 内调用 bgmController。

具体改动：
- `startGame` 最后一行（`playVoiceVariant("prompt.start", { replayable: false });` 之后）加 `bgmController.playForGame(state.game)`
- `leaveGame` 末尾加 `bgmController.stop()`
- `playVoice` 进入语音播放前加 `bgmController.duck()`，audio `ended` + speechSynthesis `onend` + 兜底 timer 加 `bgmController.restore()`

### Step 5: voice picker HTML/CSS/JS

- HTML 加 toggle row
- CSS 加 toggle switch 样式（复用主题色 token）
- JS 初始化 toggle 状态 + click handler

### Step 6: 测试 + 部署

- `mobile-one-screen-test.js` 跑过
- tar+ssh 同步到 apps/beta_words/current/
- 重启 beta-words.service

### Step 7: 截图 + 提示主人体验

---

## 🚦 验收 Checklist

Phase 7B 完成时：

- [ ] R-7B.1 6 个 `<audio>` 标签 HTML 已加
- [ ] R-7B.2 bgmController 模块实现完整（play/stop/duck/restore/toggle/unlock）
- [ ] R-7B.3 接入游戏生命周期（startGame / leaveGame / playVoice）
- [ ] R-7B.4 voice picker BGM toggle 完整（HTML/CSS/JS/localStorage）
- [ ] R-7B.5 静默 fallback 验证（audio 元素不存在 / play 失败不报错）
- [ ] R-7B.6 252/252 测试通过
- [ ] R-7B.7 部署本机 8091 + 截图给主人体验
- [ ] commit 已入 git
- [ ] 未追踪的 plan-plans 文件（phase-3 / phase-6 / phase-7a / phase-7b）都已 commit

完成后此文档标题状态改为 `✅ completed`，并附实际效果 / 主人反馈。