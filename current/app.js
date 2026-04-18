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
  }
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
  lastSpoken: "识字消消乐"
};

const AUDIO_MAP = window.BETA_WORDS_AUDIO || {};
let currentAudio = null;

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

const BEST_RECORD_TTL = 365 * 24 * 60 * 60 * 1000;

document.querySelector("#open-match").addEventListener("click", () => chooseGame(GAMES.match.id));
document.querySelector("#open-memory").addEventListener("click", () => chooseGame(GAMES.memory.id));
document.querySelector("#open-pinyin-friend").addEventListener("click", () => chooseGame(GAMES.pinyinFriend.id));
document.querySelector("#play-again").addEventListener("click", () => startGame(state.size));
document.querySelector("#replay-sound").addEventListener("click", () => playReplayVoice());
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

window.addEventListener("resize", calcTileFont);
window.visualViewport?.addEventListener("resize", calcTileFont);
new ResizeObserver(() => calcTileFont).observe(document.querySelector("#board"));

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function leaveGame() {
  stopMemoryCountdown();
  stopTimer();
  state.locked = false;
  state.selectedId = null;
  state.currentQuestion = null;
  state.options = [];
}

function chooseGame(gameId) {
  state.game = gameId;
  const game = getCurrentGame();
  setupTitle.textContent = `${game.name} · 选择难度`;
  showScreen("setup");
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
  const isQuizGame = state.game === GAMES.pinyinFriend.id;
  board.hidden = isQuizGame;
  quiz.hidden = !isQuizGame;
  optionGrid.innerHTML = "";
  quizMain.innerHTML = "";

  if (isQuizGame) {
    startPinyinFriendGame(size);
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
  playVoice("prompt.start", "开始", { replayable: false });
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
    playVoice("prompt.bonus", "真棒", { replayable: false });
    markTile(tileId, "matched");
    setHint("奖励星星");
    checkComplete();
    return;
  }

  playVoice(getWordVoiceKey(tile.value), tile.value);

  if (!state.selectedId) {
    state.selectedId = tileId;
    startTimer();
    markTile(tileId, "selected");
    setHint(`再找一个“${tile.value}”`);
    return;
  }

  if (state.selectedId === tileId) {
    state.selectedId = null;
    markTile(tileId, "selected", false);
    setHint("点一个字，听一听");
    return;
  }

  const selectedTile = state.tiles.find((item) => item.id === state.selectedId);
  const selectedButton = getTileButton(state.selectedId);

  if (selectedTile && selectedTile.value === tile.value) {
    state.locked = true;
    tile.matched = true;
    selectedTile.matched = true;
    state.matchedCount += 2;
    markTile(tileId, "selected");
    setHint("找对了");

    window.setTimeout(() => {
      markTile(tileId, "matched");
      markTile(selectedTile.id, "matched");
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 220);
  } else {
    state.locked = true;
    markTile(tileId, "selected");
    setHint("再试一次");
    window.setTimeout(() => {
      markTile(tileId, "selected", false);
      selectedButton?.classList.remove("selected");
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
  markTile(tileId, "selected");
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
    setHint("找对了");

    window.setTimeout(() => {
      markTile(tile.id, "selected", false);
      markTile(selectedId, "selected", false);
      markTile(tile.id, "memory-matched");
      markTile(selectedId, "memory-matched");
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 220);
  } else {
    state.locked = true;
    setHint("再试一次");
    window.setTimeout(() => {
      tile.revealed = false;
      if (selectedTile) {
        selectedTile.revealed = false;
      }
      markTile(tile.id, "selected", false);
      markTile(selectedId, "selected", false);
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      setHint("翻出两个一样的字");
    }, 680);
  }
}

function startPinyinFriendGame(size) {
  const settings = QUIZ_SETTINGS[size] || QUIZ_SETTINGS[3];
  state.questions = createPinyinQuestions(settings.questionCount);
  state.totalTargets = state.questions.length;
  state.matchedCount = 0;
  updateProgress();
  setHint(getCurrentGame().startHint);
  showPinyinQuestion();
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

function showPinyinQuestion() {
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
  const word = document.createElement("div");
  word.className = "quiz-word";
  word.textContent = question.word;
  word.setAttribute("aria-label", `汉字 ${question.word}`);
  quizMain.appendChild(word);

  optionGrid.innerHTML = "";
  state.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option;
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", `拼音 ${option}`);
    button.addEventListener("click", () => handlePinyinOptionClick(option, button));
    optionGrid.appendChild(button);
  });

  setHint("听一听，选拼音");
  playVoice(question.audioKey, question.fallbackText);
}

function createPinyinOptions(question, optionCount) {
  const distractors = uniqueValues(PINYIN_WORDS.map((item) => item.pinyin))
    .filter((pinyin) => pinyin !== question.pinyin);
  return shuffle([question.pinyin, ...shuffle(distractors).slice(0, optionCount - 1)]);
}

function uniqueValues(items) {
  return [...new Set(items)];
}

function handlePinyinOptionClick(option, button) {
  if (state.locked || !state.currentQuestion) return;

  if (option === state.currentQuestion.pinyin) {
    state.locked = true;
    button.classList.add("correct");
    state.matchedCount += 1;
    updateProgress();
    setHint("找对了");
    playVoice("prompt.correct", "找对了", { replayable: false });

    window.setTimeout(() => {
      state.questionIndex += 1;
      showPinyinQuestion();
    }, 520);
    return;
  }

  button.classList.add("wrong");
  setHint("再试一次");
  playVoice("prompt.tryAgain", "再试一次", { replayable: false });
  window.setTimeout(() => {
    button.classList.remove("wrong");
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
  playVoice("prompt.complete", "都找到了", { replayable: false });
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
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
  playVoice("prompt.remember", "先记住这些字", { replayable: false });

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
    playVoice("prompt.flip", "开始翻牌", { replayable: false });
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
  playVoice("prompt.complete", "都找到了", { replayable: false });
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
  }, 260);
}

function getCurrentGame() {
  return GAMES[state.game] || GAMES.match;
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

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  stopCurrentAudio();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  utterance.pitch = 1.08;

  const voice = window.speechSynthesis
    .getVoices()
    .find((item) => item.lang.toLowerCase().startsWith("zh"));
  if (voice) {
    utterance.voice = voice;
  }

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
