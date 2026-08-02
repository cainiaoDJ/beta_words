const WORDS = [
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
  "人", "口", "手", "足", "目", "耳", "头", "心", "大", "小",
  "上", "下", "左", "右", "中", "里", "外", "前", "后", "来",
  "去", "天", "地", "日", "月", "星", "云", "风", "雨", "雪",
  "山", "水", "田", "土", "石", "火", "木", "林", "花", "草",
  "苗", "叶", "果", "鸟", "鱼", "虫", "牛", "羊", "马", "犬",
  "猫", "兔", "鸡", "鸭", "鹅", "家", "门", "窗", "床", "桌",
  "椅", "灯", "书", "包", "笔", "尺", "纸", "画", "字", "本",
  "衣", "帽", "鞋", "袜", "米", "面", "饭", "菜", "汤", "肉",
  "蛋", "奶", "瓜", "豆", "红", "黄", "蓝", "绿", "白", "黑",
  "明", "亮", "早", "晚", "多", "少", "长", "短", "高", "低",
  "快", "慢", "好", "笑", "哭", "走", "跑", "跳", "坐", "立",
  "看", "听", "说", "读", "写", "唱", "拍", "拿", "放", "开",
  "关", "吃", "喝", "玩", "学", "问", "答", "爱", "亲", "朋",
  "友", "爸", "妈", "爷", "婆", "哥", "姐", "弟", "妹", "老",
  "师", "同", "生", "园", "校", "车", "船", "桥", "路", "街",
  "钟", "旗", "球", "鼓", "乐", "歌", "院", "房", "城", "国",
  "春", "夏", "秋", "冬", "冷", "热", "晴", "阴", "新", "旧",
  "平", "安", "正", "反", "轻", "重", "香", "甜", "圆", "方",
  "半", "全", "每", "只", "个", "片", "条", "朵", "双", "两"
];

const GAMES = {
  match: {
    id: "match",
    name: "识字消消乐",
    title: "找到相同的字",
    boardLabel: "识字消消乐棋盘",
    startHint: "点一个字，听一听",
    recordPrefix: "beta_words_match_best"
  },
  memory: {
    id: "memory",
    name: "识字翻翻乐",
    title: "翻出相同的字",
    boardLabel: "识字翻翻乐棋盘",
    startHint: "先记住这些字",
    recordPrefix: "beta_words_memory_best"
  },
  pinyinFriend: {
    id: "pinyinFriend",
    name: "拼音找朋友",
    title: "选出这个字的拼音",
    boardLabel: "拼音找朋友题目",
    startHint: "听一听，选拼音",
    recordPrefix: "beta_words_pinyin_friend_best"
  },
  listenCard: {
    id: "listenCard",
    name: "听音点卡",
    title: "听音，点拼音",
    boardLabel: "听音点卡题目",
    startHint: "听一听，点拼音",
    recordPrefix: "beta_words_listen_card_best"
  },
  stroopTrain: {
    id: "stroopTrain",
    name: "看字识颜色",
    title: "字是什么颜色",
    boardLabel: "看字识颜色棋盘",
    startHint: "看字，选颜色",
    recordPrefix: "beta_words_stroop_train_best"
  }
};

// 斯特鲁普训练用色卡
// 选色原则：
//   - 避开纯白/纯黑（避免字色和字本身识别不清）
//   - 颜色覆盖幼小衔接常见认知（红黄蓝绿 + 紫橙扩展）
//   - 黄字加细描边（见 styles.css .stroop-word）解决浅色字在浅底的对比度问题
//   - 英文名用于 TTS 朗读（en-US）
const STROOP_COLORS = [
  { name: "红", english: "red",    css: "#e94f4f" },
  { name: "黄", english: "yellow", css: "#f5cd2f" },
  { name: "蓝", english: "blue",   css: "#2f80e9" },
  { name: "绿", english: "green",  css: "#2fa84f" },
  { name: "紫", english: "purple", css: "#8a4fd6" },
  { name: "橙", english: "orange", css: "#f08c3a" }
];

// 看字识颜色难度：颜色种类 + 棋盘总格数
// 颜色种类跟着级别走（3=3 色基础 → 6=6 色全开）；
// 7 级保持 6 色（避免与 6 级颜色维度重复），靠总格数提升难度。
const STROOP_SETTINGS = {
  3: { boardSize: 3, colorCount: 3 },
  4: { boardSize: 4, colorCount: 4 },
  5: { boardSize: 5, colorCount: 5 },
  6: { boardSize: 6, colorCount: 6 },
  7: { boardSize: 6, colorCount: 6 }
};

const MEMORY_SECONDS = {
  3: 5,
  4: 8,
  5: 12,
  6: 16,
  7: 20
};

const QUIZ_SETTINGS = {
  3: { questionCount: 6, optionCount: 2 },
  4: { questionCount: 8, optionCount: 3 },
  5: { questionCount: 10, optionCount: 4 },
  6: { questionCount: 12, optionCount: 4 },
  7: { questionCount: 15, optionCount: 4 }
};

const PINYIN_WORDS = [
  { word: "妈", pinyin: "ma" },
  { word: "爸", pinyin: "ba" },
  { word: "马", pinyin: "ma" },
  { word: "大", pinyin: "da" },
  { word: "米", pinyin: "mi" },
  { word: "木", pinyin: "mu" },
  { word: "土", pinyin: "tu" },
  { word: "水", pinyin: "shui" },
  { word: "火", pinyin: "huo" },
  { word: "山", pinyin: "shan" },
  { word: "人", pinyin: "ren" },
  { word: "口", pinyin: "kou" },
  { word: "手", pinyin: "shou" },
  { word: "天", pinyin: "tian" },
  { word: "月", pinyin: "yue" },
  { word: "日", pinyin: "ri" },
  { word: "云", pinyin: "yun" },
  { word: "雨", pinyin: "yu" },
  { word: "风", pinyin: "feng" },
  { word: "花", pinyin: "hua" },
  { word: "草", pinyin: "cao" },
  { word: "鸟", pinyin: "niao" },
  { word: "鱼", pinyin: "yu" },
  { word: "牛", pinyin: "niu" },
  { word: "羊", pinyin: "yang" },
  { word: "猫", pinyin: "mao" },
  { word: "犬", pinyin: "quan" },
  { word: "车", pinyin: "che" },
  { word: "书", pinyin: "shu" },
  { word: "家", pinyin: "jia" }
];

const state = {
  game: GAMES.match.id,
  phase: "playing",
  size: 3,
  tiles: [],
  questions: [],
  questionIndex: 0,
  currentQuestion: null,
  options: [],
  selectedId: null,
  locked: false,
  matchedCount: 0,
  totalTargets: 0,
  timerStarted: false,
  timerStartTime: null,
  timerInterval: null,
  memoryCountdownInterval: null,
  memoryRevealTimeout: null,
  replayVoiceKey: null,
  replayText: null,
  lastVoiceKey: null,
  lastSpoken: "识字消消乐",
  // 看字识颜色专用
  stroopQuestions: [],
  stroopFilledColors: [],   // 玩家逐格填入的颜色（null = 还未填）
  stroopCursor: 0,          // 当前待填 idx
  stroopCorrectCount: 0,    // 已判定且正确
  stroopLocked: false       // 提交后短期锁定防双击
};

const AUDIO_MAP = window.BETA_WORDS_AUDIO || {};
let currentAudio = null;

// === Design System v2 Phase C — 多邻国化助手（feat/design-system-v2，2026-07-31） ===
// 7 个 base prompt key × 3-6 个变体，每次调用随机选一个变体朗读 (Duolingo 式随机赞美/鼓励)
// SOP 第 6 条播放优先级保持: manifest[KEY] → SpeechSynthesis fallback.
const VOICE_VARIANTS = {
  "prompt.start": [
    { key: "prompt.start.1", text: "开始" },
    { key: "prompt.start.2", text: "准备好啦" },
    { key: "prompt.start.3", text: "出发" },
    { key: "prompt.start.4", text: "加油" },
  ],
  "prompt.bonus": [
    { key: "prompt.bonus.1", text: "真棒" },
    { key: "prompt.bonus.2", text: "哇，太好了" },
    { key: "prompt.bonus.3", text: "厉害呀" },
  ],
  "prompt.correct": [
    { key: "prompt.correct.1", text: "找对了" },
    { key: "prompt.correct.2", text: "太棒了" },
    { key: "prompt.correct.3", text: "答得真好" },
    { key: "prompt.correct.4", text: "完美" },
    { key: "prompt.correct.5", text: "厉害" },
    { key: "prompt.correct.6", text: "哇，找到了" },
  ],
  "prompt.tryAgain": [
    { key: "prompt.tryAgain.1", text: "再试一次" },
    { key: "prompt.tryAgain.2", text: "没关系" },
    { key: "prompt.tryAgain.3", text: "再想想" },
    { key: "prompt.tryAgain.4", text: "差一点了" },
  ],
  "prompt.complete": [
    { key: "prompt.complete.1", text: "都找到了" },
    { key: "prompt.complete.2", text: "完成啦" },
    { key: "prompt.complete.3", text: "太厉害啦" },
    { key: "prompt.complete.4", text: "好极了" },
    { key: "prompt.complete.5", text: "完美通关" },
    { key: "prompt.complete.6", text: "哇，你赢了" },
  ],
  "prompt.remember": [
    { key: "prompt.remember.1", text: "先记住这些字" },
    { key: "prompt.remember.2", text: "看清楚啦" },
    { key: "prompt.remember.3", text: "记住这些字" },
    { key: "prompt.remember.4", text: "看好咯" },
  ],
  "prompt.flip": [
    { key: "prompt.flip.1", text: "开始翻牌" },
    { key: "prompt.flip.2", text: "来翻牌吧" },
    { key: "prompt.flip.3", text: "准备好了吗" },
  ],
};

function playVoiceVariant(baseKey, options = {}) {
  const variants = VOICE_VARIANTS[baseKey];
  if (!variants || variants.length === 0) {
    playVoice(baseKey, baseKey, options);
    return;
  }
  const pick = variants[Math.floor(Math.random() * variants.length)];
  playVoice(pick.key, pick.text, options);
}

// Mascot 4 状态切换（用 <img class="mascot-host"> src 切换 + .bounce 动画触发）
// 重要：DOM 里有多个 .mascot-host（大厅 + 游戏区），必须全部同步，否则 querySelector
// 只返回第一个（大厅那个被隐藏的），游戏区始终停在 wave.svg。
function setMascotState(state, bounce = true) {
  const states = {
    wave: "assets/mascot-wave.svg",
    happy: "assets/mascot-happy.svg",
    sad: "assets/mascot-sad.svg",
    celebrate: "assets/mascot-celebrate.svg",
  };
  if (!states[state]) return;
  const mascotImgs = document.querySelectorAll(".mascot-host");
  if (!mascotImgs.length) return;
  mascotImgs.forEach((mascotImg) => {
    mascotImg.src = states[state];
    if (bounce) {
      mascotImg.classList.remove("bounce");
      void mascotImg.offsetWidth; // force reflow to restart animation
      mascotImg.classList.add("bounce");
    }
  });
}

// Confetti 粒子（多邻国式完成撒花）
function spawnConfetti(count = 24) {
  const host = document.createElement("div");
  host.className = "confetti-host";
  document.body.appendChild(host);
  const colors = ["#2F8C73", "#F7D75C", "#E94F4F", "#5DADE2"];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 300}ms`;
    host.appendChild(piece);
  }
  setTimeout(() => host.remove(), 1500);
}

const screens = {
  lobby: document.querySelector("#lobby"),
  setup: document.querySelector("#setup"),
  game: document.querySelector("#game")
};

const board = document.querySelector("#board");
const progress = document.querySelector("#progress");
const timer = document.querySelector("#timer");
const hint = document.querySelector("#hint");
const completePanel = document.querySelector("#complete-panel");
const completeTime = document.querySelector("#complete-time");
const bestRecord = document.querySelector("#best-record");
const gameSubtitle = document.querySelector("#game-subtitle");
const gameTitle = document.querySelector("#game-title");
const setupTitle = document.querySelector("#setup-title");
const quiz = document.querySelector("#quiz");
const quizMain = document.querySelector("#quiz-main");
const optionGrid = document.querySelector("#option-grid");
const stroopHost = document.querySelector("#stroop-host");
const stroopBoard = document.querySelector("#stroop-board");
const stroopSelect = document.querySelector("#stroop-select");
const stroopPalette = document.querySelector("#stroop-palette");

const BEST_RECORD_TTL = 365 * 24 * 60 * 60 * 1000;

document.querySelector("#open-match").addEventListener("click", () => chooseGame(GAMES.match.id));
document.querySelector("#open-memory").addEventListener("click", () => chooseGame(GAMES.memory.id));
document.querySelector("#open-pinyin-friend").addEventListener("click", () => chooseGame(GAMES.pinyinFriend.id));
document.querySelector("#open-listen-card").addEventListener("click", () => chooseGame(GAMES.listenCard.id));
document.querySelector("#open-stroop-train").addEventListener("click", () => chooseGame(GAMES.stroopTrain.id));
document.querySelector("#play-again").addEventListener("click", () => startGame(state.size));
document.querySelector("#replay-sound").addEventListener("click", () => playReplayVoice());
// “再听一遍” 按钮在听音点卡 + 看字识颜色 中隐藏（不依赖读音重播）

// 页面初始化：默认 lobby 主题（即使还没点任何卡，body 也有正确 data-game）
syncTheme("lobby");

// Voice picker：齿轮打开 / 点 backdrop 或 ✕ 关闭
document.querySelector("#open-voice-picker")?.addEventListener("click", () => {
  waitForVoices().then(openVoicePicker);
});
document.querySelectorAll('[data-close="voice-picker"]').forEach((el) => {
  el.addEventListener("click", closeVoicePicker);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("voice-picker").hidden) {
    closeVoicePicker();
  }
});
// 提前把 voices 拉一遍（让首答时不要等）
waitForVoices();
function syncReplayVisibility() {
  const replayBtn = document.querySelector("#replay-sound");
  if (!replayBtn) return;
  const needsReplay = state.game !== GAMES.stroopTrain.id;
  replayBtn.hidden = !needsReplay;
}

// 看字识颜色：计时器保留（结算页新纪录判定依赖 elapsedMs），进度靠视觉感知故隐藏
function syncStroopHud() {
  const isStroop = state.game === GAMES.stroopTrain.id;
  const hudTimer = document.querySelector(".hud-timer");
  const hudProgress = document.querySelector(".hud-progress");
  if (hudTimer) hudTimer.hidden = false;
  if (hudProgress) hudProgress.hidden = isStroop;
}
document.querySelector("#next-board").addEventListener("click", () => {
  const next = nextSize(state.size);
  if (next) startGame(next);
});

document.querySelectorAll(".difficulty").forEach((button) => {
  button.addEventListener("click", () => startGame(Number(button.dataset.size)));
});

document.querySelectorAll("[data-action='back-lobby']").forEach((button) => {
  button.addEventListener("click", () => {
    leaveGame();
    showScreen("lobby");
  });
});

document.querySelectorAll("[data-action='back-setup']").forEach((button) => {
  button.addEventListener("click", () => {
    leaveGame();
    showScreen("setup");
  });
});

// Game Stage Engine：初始化设计画布 + 等比缩放
const stage = new GameStage(document.querySelector(".stage"));

window.addEventListener("resize", () => { stage.update(); calcTileFont(); calcStroopFont(); });
window.visualViewport?.addEventListener("resize", () => { stage.update(); calcTileFont(); calcStroopFont(); });
new ResizeObserver(() => calcTileFont).observe(document.querySelector("#board"));
if (stroopBoard) new ResizeObserver(() => calcStroopFont()).observe(stroopBoard);

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  // 返回 lobby 时重置主题色（默认进 setup 不走这个，因为 chooseGame 会主动设）
  if (name === "lobby") syncTheme(null);
}

// Per-game 主题色同步（Phase 1A，2026-08-01 立）
// gameId 传 null / undefined / 'lobby' → 默认 lobby 主题
function syncTheme(gameId) {
  document.body.dataset.game = gameId || "lobby";
}

function leaveGame() {
  stopMemoryCountdown();
  stopTimer();
  state.locked = false;
  state.selectedId = null;
  state.currentQuestion = null;
  state.options = [];
  state.stroopQuestions = [];
  state.stroopFilledColors = [];
  state.stroopCursor = 0;
  state.stroopCorrectCount = 0;
  state.stroopLocked = false;
}

function chooseGame(gameId) {
  state.game = gameId;
  const game = getCurrentGame();
  setupTitle.textContent = `${game.name} · 选择难度`;
  syncTheme(gameId);  // 同步主题色到 body[data-game]
  syncReplayVisibility();
  syncStroopHud();
  setRecommendedDifficulty(gameId);  // Phase 2A.2：按游戏标记推荐难度
  showScreen("setup");
}

// Phase 2A.2：每个游戏的"黄金难度"（详见 docs/phase-plans/phase-2-lobby-setup.md）
const RECOMMENDED_SIZE = {
  match: 4,        // 4×4 黄金难度
  memory: 4,       // 4×4
  pinyinFriend: 4, // 4×4（setup 没有 6 题选项，取最近意思）
  listenCard: 4,   // 4×4
  stroopTrain: 3,  // 3×3 入门（颜色字少不晕）
};

function setRecommendedDifficulty(gameId) {
  const size = RECOMMENDED_SIZE[gameId];
  document.querySelectorAll('#setup .difficulty').forEach((btn) => {
    btn.removeAttribute('data-recommended');
    if (parseInt(btn.dataset.size, 10) === size) {
      btn.setAttribute('data-recommended', 'true');
    }
  });
}

function startGame(size) {
  stopMemoryCountdown();
  resetTimer();
  state.size = size;
  state.phase = state.game === GAMES.memory.id ? "preview" : "playing";
  state.selectedId = null;
  state.locked = false;
  state.matchedCount = 0;
  state.questions = [];
  state.questionIndex = 0;
  state.currentQuestion = null;
  state.options = [];
  state.replayVoiceKey = null;
  state.replayText = null;
  completePanel.hidden = true;
  bestRecord.hidden = true;
  completeTime.textContent = "本次用时 00:00";
  const game = getCurrentGame();
  gameSubtitle.textContent = `${game.name} ${size} x ${size}`;
  gameTitle.textContent = game.title;
  board.setAttribute("aria-label", game.boardLabel);
  board.classList.toggle("memory", state.game === GAMES.memory.id);
  const isQuizGame = isCurrentQuizGame();
  const isStroopGame = state.game === GAMES.stroopTrain.id;
  if (isStroopGame) {
    board.hidden = true;
    quiz.hidden = true;
    if (stroopHost) stroopHost.hidden = false;
  } else {
    board.hidden = isQuizGame;
    quiz.hidden = !isQuizGame;
    if (stroopHost) stroopHost.hidden = true;
  }
  syncStroopHud();
  optionGrid.innerHTML = "";
  quizMain.innerHTML = "";

  if (isQuizGame) {
    startQuizGame(size);
    showScreen("game");
    return;
  }

  if (state.game === GAMES.stroopTrain.id) {
    startStroopGame(size);
    showScreen("game");
    return;
  }

  state.tiles = createTiles(size);
  if (state.game === GAMES.memory.id) {
    state.tiles.forEach((tile) => {
      tile.revealed = true;
      if (tile.kind === "bonus") {
        tile.matched = true;
      }
    });
  }
  state.totalTargets = state.tiles.filter((tile) => tile.kind === "word").length;
  board.style.setProperty("--size", size);
  renderBoard();
  updateProgress();
  showScreen("game");
  calcTileFont();

  if (state.game === GAMES.memory.id) {
    startMemoryPreview(size);
    return;
  }

  setHint(game.startHint);
  playVoiceVariant("prompt.start", { replayable: false });
}

function calcTileFont() {
  if (screens.game.classList.contains("active") === false) return;
  const boardEl = document.querySelector("#board");
  if (!boardEl) return;
  const boardW = boardEl.offsetWidth;
  const style = getComputedStyle(boardEl);
  const gap = parseFloat(style.gap) || 8;
  const tileSize = (boardW - gap * (state.size - 1)) / state.size;
  const fontSize = tileSize * (state.size >= 6 ? 0.54 : 0.62);
  board.style.setProperty("--tile-font", `${Math.max(12, Math.floor(fontSize))}px`);
}

// 看字识颜色棋盘：随格子实际大小自动调字号，避免 6×6/7×7 字溢出
function calcStroopFont() {
  if (!stroopBoard) return;
  const boardW = stroopBoard.offsetWidth;
  const style = getComputedStyle(stroopBoard);
  const gap = parseFloat(style.gap) || 4;
  // 用实际 boardSize（state.size=7 时仍渲染 6×6，见 STROOP_SETTINGS），不用 state.size
  const sizeVar = parseInt(stroopBoard.style.getPropertyValue("--size"), 10) || 3;
  const cellSize = (boardW - gap * (sizeVar - 1)) / sizeVar;
  const ratio = sizeVar >= 6 ? 0.45 : 0.5;
  const fontSize = Math.max(10, Math.floor(cellSize * ratio));
  stroopBoard.style.setProperty("--stroop-cell-font", `${fontSize}px`);
  // 同步到待选格
  if (stroopSelect) stroopSelect.style.setProperty("--stroop-cell-font", `${fontSize}px`);
}


function createTiles(size) {
  const cellCount = size * size;
  const pairCount = Math.floor(cellCount / 2);
  const picked = shuffle([...WORDS]).slice(0, pairCount);
  const tiles = picked.flatMap((word) => [
    createTile("word", word),
    createTile("word", word)
  ]);

  if (cellCount % 2 === 1) {
    tiles.push(createTile("bonus", "星"));
  }

  return shuffle(tiles).map((tile, index) => ({ ...tile, id: `tile-${index}` }));
}

function createTile(kind, value) {
  return {
    kind,
    value,
    revealed: false,
    matched: false
  };
}

function renderBoard() {
  board.innerHTML = "";
  state.tiles.forEach((tile, index) => {
    const button = document.createElement("button");
    button.className = `tile ${tile.kind === "bonus" ? "bonus" : ""}`;
    button.type = "button";
    button.dataset.id = tile.id;
    button.setAttribute("role", "gridcell");
    updateTileButton(button, tile);
    button.style.transitionDelay = `${Math.min(index * 8, 80)}ms`;
    button.addEventListener("click", () => handleTileClick(tile.id));
    board.appendChild(button);
  });
}

function handleTileClick(tileId) {
  if (state.game === GAMES.memory.id) {
    handleMemoryTileClick(tileId);
    return;
  }

  handleMatchTileClick(tileId);
}

function handleMatchTileClick(tileId) {
  if (state.locked) return;

  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.matched) return;

  if (tile.kind === "bonus") {
    tile.matched = true;
    playVoiceVariant("prompt.bonus", { replayable: false });
    markTile(tileId, "is-bonus");
    setHint("奖励星星");
    setMascotState("happy");
    checkComplete();
    return;
  }

  playVoice(getWordVoiceKey(tile.value), tile.value);

  if (!state.selectedId) {
    state.selectedId = tileId;
    startTimer();
    markTile(tileId, "is-selected");
    setHint(`再找一个“${tile.value}”`);
    return;
  }

  if (state.selectedId === tileId) {
    state.selectedId = null;
    markTile(tileId, "is-selected", false);
    setHint("点一个字，听一听");
    return;
  }

  const selectedTile = state.tiles.find((item) => item.id === state.selectedId);
  const selectedButton = getTileButton(state.selectedId);

  if (selectedTile && selectedTile.value === tile.value) {
    const firstId = state.selectedId;
    const secondId = tileId;
    state.locked = true;
    tile.matched = true;
    selectedTile.matched = true;
    state.matchedCount += 2;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    markTile(firstId, "is-correct");
    markTile(secondId, "is-correct");
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });

    window.setTimeout(() => {
      markTile(firstId, "is-correct", false);
      markTile(secondId, "is-correct", false);
      markTile(firstId, "matched");  // 旧 class alias: 触发 fade-out
      markTile(secondId, "matched");
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 520);
  } else {
    state.locked = true;
    // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景
    markTile(tileId, "is-wrong");
    setHint("再试一次");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    setMascotState("sad");
    playVoice("sfx.wrong-buzz", "", { replayable: false });

    window.setTimeout(() => {
      markTile(tileId, "is-wrong", false);
      selectedButton?.classList.remove("is-selected");
      state.selectedId = null;
      state.locked = false;
      setHint("点一个字，听一听");
    }, 420);
  }
}

function handleMemoryTileClick(tileId) {
  if (state.locked || state.phase !== "playing") return;

  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.matched || tile.revealed) return;

  tile.revealed = true;
  playVoice(getWordVoiceKey(tile.value), tile.value);
  markTile(tileId, "is-selected");
  updateTile(tileId);

  if (!state.selectedId) {
    state.selectedId = tileId;
    setHint(`再翻一个“${tile.value}”`);
    return;
  }

  const selectedTile = state.tiles.find((item) => item.id === state.selectedId);
  const selectedId = state.selectedId;

  if (selectedTile && selectedTile.value === tile.value) {
    state.locked = true;
    tile.matched = true;
    selectedTile.matched = true;
    state.matchedCount += 2;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    markTile(tile.id, "is-correct");
    markTile(selectedId, "is-correct");
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });

    window.setTimeout(() => {
      markTile(tile.id, "is-correct", false);
      markTile(selectedId, "is-correct", false);
      // memory 风格: 保留显示 (旧 class alias .memory-matched 保留绿底显示)
      markTile(tile.id, "memory-matched");
      markTile(selectedId, "memory-matched");
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 520);
  } else {
    state.locked = true;
    // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景 (两张都错)
    markTile(tile.id, "is-wrong");
    markTile(selectedId, "is-wrong");
    setHint("再试一次");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    setMascotState("sad");
    playVoice("sfx.wrong-buzz", "", { replayable: false });

    window.setTimeout(() => {
      tile.revealed = false;
      if (selectedTile) {
        selectedTile.revealed = false;
      }
      markTile(tile.id, "is-wrong", false);
      markTile(selectedId, "is-wrong", false);
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      setHint("翻出两个一样的字");
    }, 680);
  }
}

function startQuizGame(size) {
  const settings = QUIZ_SETTINGS[size] || QUIZ_SETTINGS[3];
  state.questions = createPinyinQuestions(settings.questionCount);
  state.totalTargets = state.questions.length;
  state.matchedCount = 0;
  updateProgress();
  setHint(getCurrentGame().startHint);
  showQuizQuestion();
  startTimer();
}

function createPinyinQuestions(count) {
  return shuffle(PINYIN_WORDS).slice(0, count).map((question, index) => ({
    ...question,
    id: `pinyin-question-${index}`,
    audioKey: getWordVoiceKey(question.word),
    fallbackText: question.word
  }));
}

function showQuizQuestion() {
  const question = state.questions[state.questionIndex];
  if (!question) {
    completeQuizGame();
    return;
  }

  const settings = QUIZ_SETTINGS[state.size] || QUIZ_SETTINGS[3];
  state.currentQuestion = question;
  state.options = createPinyinOptions(question, settings.optionCount);
  state.locked = false;

  quizMain.innerHTML = "";
  renderQuizMain(question);

  optionGrid.innerHTML = "";
  state.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option;
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", `拼音 ${option}`);
    button.addEventListener("click", () => handleQuizOptionClick(option, button));
    optionGrid.appendChild(button);
  });

  setHint(getCurrentGame().startHint);
  playVoice(question.audioKey, question.fallbackText);
}

function renderQuizMain(question) {
  if (state.game === GAMES.listenCard.id) {
    const prompt = document.createElement("div");
    prompt.className = "listen-prompt";
    prompt.setAttribute("aria-label", "听音题目");

    const mark = document.createElement("span");
    mark.className = "listen-mark";
    mark.textContent = "听";

    const copy = document.createElement("span");
    copy.className = "listen-copy";
    copy.textContent = "听一听";

    prompt.appendChild(mark);
    prompt.appendChild(copy);
    quizMain.appendChild(prompt);
    return;
  }

  const word = document.createElement("div");
  word.className = "quiz-word";
  word.textContent = question.word;
  word.setAttribute("aria-label", `汉字 ${question.word}`);
  quizMain.appendChild(word);
}

function createPinyinOptions(question, optionCount) {
  const distractors = uniqueValues(PINYIN_WORDS.map((item) => item.pinyin))
    .filter((pinyin) => pinyin !== question.pinyin);
  return shuffle([question.pinyin, ...shuffle(distractors).slice(0, optionCount - 1)]);
}

function uniqueValues(items) {
  return [...new Set(items)];
}

function handleQuizOptionClick(option, button) {
  if (state.locked || !state.currentQuestion) return;

  if (option === state.currentQuestion.pinyin) {
    state.locked = true;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    button.classList.add("is-correct");
    state.matchedCount += 1;
    updateProgress();
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });  // 多邻国式随机赞美
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });

    window.setTimeout(() => {
      button.classList.remove("is-correct");
      state.questionIndex += 1;
      showQuizQuestion();
    }, 520);
    return;
  }

  // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景
  button.classList.add("is-wrong");
  setHint("再试一次");
  playVoiceVariant("prompt.tryAgain", { replayable: false });  // 多邻国式随机鼓励
  setMascotState("sad");
  playVoice("sfx.wrong-buzz", "", { replayable: false });

  window.setTimeout(() => {
    button.classList.remove("is-wrong");
  }, 520);
}

function completeQuizGame() {
  state.currentQuestion = null;
  state.options = [];
  state.locked = true;
  setHint("完成");
  stopTimer();
  const elapsedMs = getElapsedTime();
  const best = getBestRecord(state.size);
  const isNewRecord = !best || elapsedMs < best.elapsedMs;
  updateTimerDisplay(elapsedMs);
  completeTime.textContent = `本次用时 ${formatTime(elapsedMs)}`;
  bestRecord.hidden = !isNewRecord;
  if (isNewRecord) {
    saveBestRecord(state.size, elapsedMs);
  }
  setMascotState("celebrate");  // 多邻国式 mascot 庆祝
  playVoiceVariant("prompt.complete", { replayable: false });  // 随机赞美
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
    spawnConfetti(28);  // 多邻国式撒花
  }, 260);
}

function markTile(tileId, className, enabled = true) {
  const button = getTileButton(tileId);
  if (!button) return;
  button.classList.toggle(className, enabled);
}

function getTileButton(tileId) {
  return board.querySelector(`[data-id="${tileId}"]`);
}

function updateTile(tileId) {
  const tile = state.tiles.find((item) => item.id === tileId);
  const button = getTileButton(tileId);
  if (!tile || !button) return;
  updateTileButton(button, tile);
}

function updateTileButton(button, tile) {
  const isMemory = state.game === GAMES.memory.id;
  const isHidden = isMemory && tile.kind === "word" && !tile.revealed && !tile.matched;
  button.classList.toggle("hidden-face", isHidden);
  button.classList.toggle("memory-matched", isMemory && tile.kind === "word" && tile.matched);
  button.setAttribute("aria-label", getTileLabel(tile, isHidden));
  button.textContent = getTileText(tile, isHidden);
}

function getTileText(tile, isHidden) {
  if (tile.kind === "bonus") return "★";
  return isHidden ? "?" : tile.value;
}

function getTileLabel(tile, isHidden) {
  if (tile.kind === "bonus") return "奖励星星";
  return isHidden ? "未翻开的字牌" : tile.value;
}

function updateProgress() {
  progress.textContent = `${state.matchedCount} / ${state.totalTargets}`;
}

function resetTimer() {
  stopTimer();
  state.timerStarted = false;
  state.timerStartTime = null;
  updateTimerDisplay(0);
}

function startTimer() {
  if (state.timerStarted) return;
  state.timerStarted = true;
  state.timerStartTime = Date.now();
  updateTimerDisplay(0);
  state.timerInterval = window.setInterval(() => {
    updateTimerDisplay(getElapsedTime());
  }, 250);
}

function stopTimer() {
  if (state.timerInterval) {
    window.clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function getElapsedTime() {
  if (!state.timerStartTime) return 0;
  return Date.now() - state.timerStartTime;
}

function updateTimerDisplay(elapsedMs) {
  timer.textContent = formatTime(elapsedMs);
}

function formatTime(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startMemoryPreview(size) {
  const seconds = MEMORY_SECONDS[size] || 10;
  let remaining = seconds;
  state.locked = true;
  setHint(`记住这些字：${String(remaining).padStart(2, "0")}`);
  timer.textContent = `00:${String(remaining).padStart(2, "0")}`;
  playVoiceVariant("prompt.remember", { replayable: false });  // 随机变体

  state.memoryCountdownInterval = window.setInterval(() => {
    remaining -= 1;
    setHint(`记住这些字：${String(Math.max(remaining, 0)).padStart(2, "0")}`);
    timer.textContent = `00:${String(Math.max(remaining, 0)).padStart(2, "0")}`;
  }, 1000);

  state.memoryRevealTimeout = window.setTimeout(() => {
    stopMemoryCountdown();
    hideMemoryTiles();
    state.phase = "playing";
    state.locked = false;
    state.selectedId = null;
    resetTimer();
    startTimer();
    setHint("翻出两个一样的字");
    playVoiceVariant("prompt.flip", { replayable: false });  // 随机变体
  }, seconds * 1000);
}

function stopMemoryCountdown() {
  if (state.memoryCountdownInterval) {
    window.clearInterval(state.memoryCountdownInterval);
    state.memoryCountdownInterval = null;
  }

  if (state.memoryRevealTimeout) {
    window.clearTimeout(state.memoryRevealTimeout);
    state.memoryRevealTimeout = null;
  }
}

function hideMemoryTiles() {
  state.tiles.forEach((tile) => {
    if (tile.kind === "word" && !tile.matched) {
      tile.revealed = false;
      updateTile(tile.id);
    }
  });
}

function getBestRecordKey(size) {
  return `${getCurrentGame().recordPrefix}_${size}`;
}

function getLegacyBestRecordKey(size) {
  return state.game === GAMES.match.id ? `beta_words_best_${size}` : null;
}

function getBestRecord(size) {
  const key = getBestRecordKey(size);

  try {
    const legacyKey = getLegacyBestRecordKey(size);
    const raw = window.localStorage.getItem(key) || (legacyKey ? window.localStorage.getItem(legacyKey) : null);
    if (!raw) return null;

    const record = JSON.parse(raw);
    if (!record || typeof record.elapsedMs !== "number" || typeof record.timestamp !== "number") {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - record.timestamp > BEST_RECORD_TTL) {
      window.localStorage.removeItem(key);
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

function saveBestRecord(size, elapsedMs) {
  try {
    window.localStorage.setItem(
      getBestRecordKey(size),
      JSON.stringify({
        elapsedMs,
        timestamp: Date.now()
      })
    );
  } catch {
    // Ignore storage errors so completing a board still works.
  }
}

function setHint(text) {
  hint.textContent = text;
}

function checkComplete() {
  // 看字识颜色：按 stroopCursor / stroopFilledColors 判定
  if (state.game === GAMES.stroopTrain.id) {
    const total = state.stroopQuestions.length;
    const filledCount = state.stroopFilledColors.filter((c) => c !== null).length;
    if (filledCount < total) return;
    setHint("完成");
    stopTimer();
    const correct = state.stroopCorrectCount;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsedMs = getElapsedTime();
    const best = getBestRecord(state.size);
    const isNewRecord = !best || elapsedMs < best.elapsedMs;
    updateTimerDisplay(elapsedMs);
    completeTime.textContent = `用时 ${formatTime(elapsedMs)} · 成功率 ${correct} / ${total}（${rate}%）`;
    bestRecord.hidden = !isNewRecord;
    if (isNewRecord) {
      saveBestRecord(state.size, elapsedMs);
    }
    setMascotState("celebrate");  // 多邻国式 mascot 庆祝
    playVoiceVariant("prompt.complete", { replayable: false });  // 随机赞美
    // 隐藏 stroop-host 避免与 complete-panel 同时出现造成 823 > 640 溢出
    if (stroopHost) stroopHost.hidden = true;
    window.setTimeout(() => {
      completePanel.hidden = false;
      // 与其他游戏一致：3→4→…→7 提供“下一关”（7 到头隐藏），新棋盘重新生成颜色+字序
      const next = nextSize(state.size);
      document.querySelector("#next-board").hidden = !next;
      spawnConfetti(28);  // 多邻国式撒花
    }, 260);
    return;
  }

  const allDone = state.tiles.every((tile) => tile.kind !== "word" || tile.matched);
  if (!allDone) return;

  setHint("完成");
  stopTimer();
  const elapsedMs = getElapsedTime();
  const best = getBestRecord(state.size);
  const isNewRecord = !best || elapsedMs < best.elapsedMs;
  updateTimerDisplay(elapsedMs);
  completeTime.textContent = `本次用时 ${formatTime(elapsedMs)}`;
  bestRecord.hidden = !isNewRecord;
  if (isNewRecord) {
    saveBestRecord(state.size, elapsedMs);
  }
  setMascotState("celebrate");  // 多邻国式 mascot 庆祝
  playVoiceVariant("prompt.complete", { replayable: false });  // 随机赞美
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
    spawnConfetti(28);  // 多邻国式撒花
  }, 260);
}

// ============================================================
// 看字识颜色 (stroopTrain) 游戏逻辑
// ============================================================
//
// 棋盘 n×n：棋子是带颜色的颜色字（红黄蓝绿紫橙），颜色与字义错位形成 Stroop 干扰。
// 待选 n×n：初始完全空，底层田字格背景作为草稿纸；玩家依次填入棋盘每一格的
//           “字颜色”。
// 颜色条：一行 6 个色字 + 颜色背景的可点击按钮。
//
// 流程：
//   1. 按棋盘 (0,0) → (n-1,n-1) row-major 顺序逐格处理。
//   2. 当前 cursor 格可点；其他棋盘格 + 未 cursor 的待选格不可点。
//   3. 点棋盘 cursor 格 → 该格点亮为“待选色”状态。
//   4. 点颜色条某色 → 填入待选 cursor 格 → 系统判定：
//      - 一致（待选色 == 字实际颜色）→ 待选格变绿 + 读汉字读音 + 读英文读音
//      - 不一致 → 待选格变红
//   5. 判定后 cursor 推进一格，不可反悔。
//   6. 全部判定完成后显示成功率（X / N + %），隐藏“下一关”按钮。

function startStroopGame(size) {
  const settings = STROOP_SETTINGS[size] || STROOP_SETTINGS[3];
  const boardSize = settings.boardSize;
  const colorCount = settings.colorCount;
  const total = boardSize * boardSize;

  state.size = size;
  state.stroopQuestions = createStroopQuestions(total, colorCount);
  state.stroopFilledColors = new Array(total).fill(null);
  state.stroopCursor = 0;
  state.stroopCorrectCount = 0;
  state.stroopLocked = false;
  state.totalTargets = total;
  state.matchedCount = 0;

  // 渲染三个区：棋盘 + 待选 + 颜色条
  if (stroopBoard) stroopBoard.style.setProperty("--size", boardSize);
  if (stroopSelect) stroopSelect.style.setProperty("--size", boardSize);
  renderStroopBoard();
  calcStroopFont();
  renderStroopSelectPanel();
  renderStroopColorBar();

  setStroopActive();
  updateProgress();
  setHint(getCurrentGame().startHint);
  playVoiceVariant("prompt.start", { replayable: false });
  startTimer();
}

// 生成 Stroop 题目。
// 棋盘 total 格，每格一个颜色字 + 1 个错位颜色。
// 关键约束：colorIdx !== wordIdx（字色 ≠ 字义），否则不构成 Stroop 冲突。
function createStroopQuestions(total, colorCount) {
  const colors = STROOP_COLORS.slice(0, colorCount);
  const questions = [];
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / Math.sqrt(total));
    const col = i % Math.sqrt(total);
    const wordIdx = Math.floor(Math.random() * colors.length);
    let colorIdx = Math.floor(Math.random() * colors.length);
    let attempts = 0;
    while (colorIdx === wordIdx && attempts < 8) {
      colorIdx = Math.floor(Math.random() * colors.length);
      attempts += 1;
    }
    if (colorIdx === wordIdx) {
      colorIdx = (wordIdx + 1) % colors.length;
    }
    const wordColor = colors[wordIdx];
    const displayColor = colors[colorIdx];
    questions.push({
      id: `stroop-cell-${i}`,
      row,
      col,
      word: wordColor.name,        // 字本身（颜色字，如「红」）
      wordEnglish: wordColor.english, // 字英文名（"red"）
      colorName: displayColor.name,  // 字实际显示的颜色（可能与字义不同）
      colorCss: displayColor.css
    });
  }
  return questions;
}

// 渲染棋盘：n×n Stroop 错位字
function renderStroopBoard() {
  if (!stroopBoard) return;
  stroopBoard.innerHTML = "";
  state.stroopQuestions.forEach((q, idx) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "tile stroop-cell";
    tile.dataset.idx = String(idx);
    tile.style.setProperty("--cell-color", q.colorCss);
    tile.setAttribute("role", "gridcell");

    const wordEl = document.createElement("span");
    wordEl.className = "stroop-cell-word";
    wordEl.textContent = q.word;
    tile.appendChild(wordEl);

    tile.addEventListener("click", () => handleStroopCellClick(idx));
    stroopBoard.appendChild(tile);
  });
}

// 渲染待选 n×n：初始完全空，底层米字格背景
function renderStroopSelectPanel() {
  if (!stroopSelect) return;
  stroopSelect.innerHTML = "";
  state.stroopQuestions.forEach((q, idx) => {
    const cell = document.createElement("div");
    cell.className = "stroop-select-cell";
    cell.dataset.idx = String(idx);
    cell.setAttribute("role", "gridcell");
    stroopSelect.appendChild(cell);
  });
}

// 渲染颜色条：一行 N 个颜色按钮（colorCount 个）
function renderStroopColorBar() {
  if (!stroopPalette) return;
  stroopPalette.innerHTML = "";
  const settings = STROOP_SETTINGS[state.size] || STROOP_SETTINGS[3];
  const colors = STROOP_COLORS.slice(0, settings.colorCount);
  colors.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stroop-color-btn";
    btn.style.setProperty("--btn-color", c.css);
    btn.textContent = c.name;
    btn.dataset.colorName = c.name;
    btn.setAttribute("aria-label", `选颜色 ${c.name}（${c.english}）`);
    btn.addEventListener("click", () => applyStroopColor(state.stroopCursor, c.name));
    stroopPalette.appendChild(btn);
  });
}

// 点亮 cursor 所在棋盘 + 待选格，其他格变淡不可点
function setStroopActive() {
  if (!stroopBoard || !stroopSelect) return;
  const cursor = state.stroopCursor;
  const total = state.stroopQuestions.length;

  // 重置 (统一状态类 .is-active / .is-disabled)
  stroopBoard.querySelectorAll(".stroop-cell").forEach((el) => {
    el.classList.remove("is-active", "is-disabled");
  });
  stroopSelect.querySelectorAll(".stroop-select-cell").forEach((el) => {
    el.classList.remove("is-active", "is-disabled");
  });

  if (cursor >= total) return;

  // cursor 格子点亮 (统一状态类)
  const boardCell = stroopBoard.querySelector(`[data-idx="${cursor}"]`);
  if (boardCell) boardCell.classList.add("is-active");
  const selectCell = stroopSelect.querySelector(`[data-idx="${cursor}"]`);
  if (selectCell) selectCell.classList.add("is-active");

  // 其他格子变淡 + 不可点 (统一状态类 .is-disabled)
  stroopBoard.querySelectorAll(".stroop-cell").forEach((el) => {
    if (el.dataset.idx !== String(cursor)) el.classList.add("is-disabled");
  });
  stroopSelect.querySelectorAll(".stroop-select-cell").forEach((el) => {
    if (el.dataset.idx !== String(cursor)) el.classList.add("is-disabled");
  });
}

// 棋盘点击：仅 cursor 格接受点击 → 高亮 cursor（视觉反馈）
function handleStroopCellClick(idx) {
  if (state.stroopLocked) return;
  if (idx !== state.stroopCursor) return; // 顺序保护
  // 点击棋盘格本身不填色，只是提示玩家“该填这格了”。
  // 填色动作在玩家点颜色条后才发生。
  // 点 cursor 格不需额外状态切换，但可以闪一下反馈。
}

// 颜色条点击：在 cursor 处填色 + 判定 + 推进
function applyStroopColor(idx, colorName) {
  if (state.stroopLocked) return;
  if (idx !== state.stroopCursor) return;
  if (idx >= state.stroopQuestions.length) return;

  const question = state.stroopQuestions[idx];
  const isCorrect = colorName === question.colorName;
  state.stroopFilledColors[idx] = colorName;

  // 在待选格填色 + 标对错 (统一状态类 .is-correct / .is-wrong)
  const selectCell = stroopSelect.querySelector(`[data-idx="${idx}"]`);
  if (selectCell) {
    const colorMeta = STROOP_COLORS.find((c) => c.name === colorName);
    if (colorMeta) selectCell.style.setProperty("--cell-color", colorMeta.css);
    selectCell.textContent = colorName;
    selectCell.classList.remove("is-active");
    selectCell.classList.add(isCorrect ? "is-correct" : "is-wrong");

    // 多邻国式反馈: 视觉 + mascot + 音效
    if (isCorrect) {
      setMascotState("happy");
      playVoice("sfx.correct-ding", "", { replayable: false });
    } else {
      setMascotState("sad");
      playVoice("sfx.wrong-buzz", "", { replayable: false });
    }
  }

  if (isCorrect) {
    state.stroopCorrectCount += 1;
    state.matchedCount += 1;
  }

  // 读音反馈 (颜色名 TTS, 双语强化)
  playStroopFeedback(isCorrect, colorName, question);

  // 短期锁定避免双击
  state.stroopLocked = true;
  window.setTimeout(() => {
    state.stroopLocked = false;
    state.stroopCursor += 1;
    if (state.stroopCursor >= state.stroopQuestions.length) {
      updateProgress();
      checkComplete();
      return;
    }
    setStroopActive();
    updateProgress();
  }, 320);
}

// 读音反馈：正确 → 中文颜色名；错误 → 仅错误提示
function playStroopFeedback(isCorrect, colorName, question) {
  if (isCorrect) {
    // 中文颜色名（确认答对了 → "蓝色"），强化“颜色”不是“字”
    speak(colorName);
  } else {
    setHint(`是${question.colorName}，不是${colorName}`);
    playVoiceVariant("prompt.tryAgain", { replayable: false });  // 多邻国式随机鼓励
  }
}

function getCurrentGame() {
  return GAMES[state.game] || GAMES.match;
}

function isCurrentQuizGame() {
  return state.game === GAMES.pinyinFriend.id || state.game === GAMES.listenCard.id;
}

function playReplayVoice() {
  const key = state.replayVoiceKey || state.lastVoiceKey;
  const text = state.replayText || state.lastSpoken;
  playVoice(key, text, { replayable: false });
}

function playVoice(key, fallbackText, options = {}) {
  state.lastVoiceKey = key || null;
  state.lastSpoken = fallbackText;
  if (options.replayable !== false) {
    state.replayVoiceKey = key || null;
    state.replayText = fallbackText;
  }

  const src = key ? AUDIO_MAP[key] : null;
  if (!src) {
    speak(fallbackText);
    return;
  }

  stopCurrentAudio();
  window.speechSynthesis?.cancel();

  currentAudio = new Audio(src);
  currentAudio.play().catch(() => {
    speak(fallbackText);
  });
}

function stopCurrentAudio() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

function getWordVoiceKey(word) {
  const codePoints = Array.from(word)
    .map((char) => `u${char.codePointAt(0).toString(16)}`)
    .join("-");
  return `word.${codePoints}`;
}

// === Voice picker：跨平台优先列表 + localStorage 记忆 ===
// 优先级：localStorage 用户选定的 → 跨平台童声/年轻女声 → 任何 zh
const VOICE_PREFER = [
  /Tingting/i,            // macOS 婷婷 (童声友好女声)
  /Yaoyao/i,              // Win Microsoft 瑶瑶 (年轻女声)
  /Microsoft Huihui/i,    // Win Microsoft 慧慧 (成熟女声)
  /Mei-Jia/i,             // macOS 美佳 (台湾普通话)
  /Microsoft HanHan/i,    // Win Microsoft 涵涵 (台湾)
  /Microsoft Kangkang/i,  // Win Microsoft 康康 (男声)
];
const STORAGE_VOICE_KEY = "beta_words_voice_pref";
const VOICE_SAMPLE = "准备好啦，太棒了！";

// 仅过滤中文普通话 zh-CN (不含 zh-TW/zh-HK 等台湾粤语)
function listChineseVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => {
      const lang = (v.lang || "").toLowerCase();
      return lang === "zh-cn" || lang.startsWith("zh-cn-");
    });
}

// 推断 voice 平台 / 类型 / 语言区 / 品质。返回 { kind, subtitle }
// subtitle 拼接: "平台 · 语言区[ · 品质]"  例: "macOS 内置 · 大陆普通话 · 自然音"
function detectQuality(name) {
  if (/\bNatural\b/i.test(name)) return "自然音";
  if (/\bNeural\b/i.test(name)) return "Neural";
  if (/\bEnhanced\b/i.test(name)) return "增强";
  if (/\bPremium\b/i.test(name)) return "高级";
  if (/\bStandard\b/i.test(name)) return "标准";
  return "";
}

function detectRegion(lang) {
  const l = (lang || "").toLowerCase();
  if (l === "zh-cn" || l.startsWith("zh-cn-")) return "大陆普通话";
  if (l.startsWith("zh-tw")) return "台湾国语";
  if (l.startsWith("zh-hk")) return "粤语";
  return "普通话";
}

function describeVoice(v) {
  let platform;
  if (!v.localService) platform = "在线服务";
  else if (/Microsoft/i.test(v.name)) platform = "Windows 系统";
  else platform = "macOS 内置";
  const region = detectRegion(v.lang);
  const quality = detectQuality(v.name);
  let subtitle = `${platform} · ${region}`;
  if (quality) subtitle += ` · ${quality}`;
  return { kind: !v.localService ? "online" : "local", subtitle };
}

// 精简 voice.name 方便显示（去 Microsoft 前缀、China 后缀）
function cleanVoiceName(name) {
  const m = name.match(/^Microsoft\s+(.+?)\s*-\s*Chinese/);
  if (m) return m[1];
  return name;
}

function pickBestVoice() {
  const voices = listChineseVoices();
  if (!voices.length) return null;
  // 1. localStorage 选定的
  try {
    const saved = localStorage.getItem(STORAGE_VOICE_KEY);
    if (saved) {
      const v = voices.find((x) => x.name === saved);
      if (v) return v;
    }
  } catch (_) {}
  // 2. 偏好列表第一个匹配的
  for (const re of VOICE_PREFER) {
    const v = voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  // 3. 第一个中文
  return voices[0];
}

function buildVoiceRow(voice, savedName) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "voice-option";
  row.setAttribute("role", "listitem");
  if (savedName === voice.name) row.classList.add("is-selected");

  const title = document.createElement("span");
  title.className = "voice-name";
  title.textContent = cleanVoiceName(voice.name);

  const sub = document.createElement("span");
  sub.className = "voice-sub";
  sub.textContent = describeVoice(voice).subtitle;

  row.append(title, sub);
  row.addEventListener("click", () => previewAndSelectVoice(voice, row));
  return row;
}

function buildVoiceSection(label, voices, savedName) {
  const section = document.createElement("div");
  section.className = "voice-section";
  const h = document.createElement("h3");
  h.className = "voice-section-title";
  h.textContent = label;
  section.appendChild(h);
  voices.forEach((v) => section.appendChild(buildVoiceRow(v, savedName)));
  return section;
}

function openVoicePicker() {
  const modal = document.getElementById("voice-picker");
  if (!modal) return;
  const list = document.getElementById("voice-list");
  list.innerHTML = "";
  const voices = listChineseVoices();
  if (!voices.length) {
    const empty = document.createElement("p");
    empty.className = "voice-modal-hint";
    empty.textContent = "浏览器里没有找到普通话声音，请检查系统设置。";
    list.appendChild(empty);
  } else {
    const saved = (() => { try { return localStorage.getItem(STORAGE_VOICE_KEY); } catch (_) { return null; } })();
    const local = voices.filter((v) => v.localService);
    const online = voices.filter((v) => !v.localService);
    if (local.length) list.appendChild(buildVoiceSection("本地", local, saved));
    if (online.length) list.appendChild(buildVoiceSection("在线", online, saved));
  }
  modal.hidden = false;
}

function previewAndSelectVoice(voice, row) {
  try { localStorage.setItem(STORAGE_VOICE_KEY, voice.name); } catch (_) {}
  document.querySelectorAll(".voice-option.is-selected").forEach((el) => el.classList.remove("is-selected"));
  row.classList.add("is-selected");
  // 试听示例句
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(VOICE_SAMPLE);
  u.lang = voice.lang || "zh-CN";
  u.voice = voice;
  u.rate = 0.95;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

function closeVoicePicker() {
  const modal = document.getElementById("voice-picker");
  if (modal) modal.hidden = true;
  window.speechSynthesis.cancel();
}

// 确保 voices 列表加载完（chromium 异步）
function waitForVoices(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    if (window.speechSynthesis.getVoices().length) return resolve(window.speechSynthesis.getVoices());
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", finish);
    setTimeout(finish, timeoutMs);
  });
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  stopCurrentAudio();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.95;
  utterance.pitch = 1.12;
  const picked = pickBestVoice();
  if (picked) utterance.voice = picked;
  window.speechSynthesis.speak(utterance);
}

function nextSize(current) {
  const sizes = [3, 4, 5, 6, 7];
  const idx = sizes.indexOf(current);
  return idx >= 0 && idx < sizes.length - 1 ? sizes[idx + 1] : null;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}
