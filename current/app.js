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

const state = {
  size: 3,
  tiles: [],
  selectedId: null,
  locked: false,
  matchedCount: 0,
  totalTargets: 0,
  timerStarted: false,
  timerStartTime: null,
  timerInterval: null,
  lastSpoken: "识字消消乐"
};

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

const BEST_RECORD_TTL = 365 * 24 * 60 * 60 * 1000;

document.querySelector("#open-match").addEventListener("click", () => showScreen("setup"));
document.querySelector("#play-again").addEventListener("click", () => startGame(state.size));
document.querySelector("#replay-sound").addEventListener("click", () => speak(state.lastSpoken));
document.querySelector("#next-board").addEventListener("click", () => {
  const next = nextSize(state.size);
  if (next) startGame(next);
});

document.querySelectorAll(".difficulty").forEach((button) => {
  button.addEventListener("click", () => startGame(Number(button.dataset.size)));
});

document.querySelectorAll("[data-action='back-lobby']").forEach((button) => {
  button.addEventListener("click", () => showScreen("lobby"));
});

document.querySelectorAll("[data-action='back-setup']").forEach((button) => {
  button.addEventListener("click", () => showScreen("setup"));
});

window.addEventListener("resize", calcTileFont);
window.visualViewport?.addEventListener("resize", calcTileFont);
new ResizeObserver(() => calcTileFont).observe(document.querySelector("#board"));

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
}

function startGame(size) {
  resetTimer();
  state.size = size;
  state.selectedId = null;
  state.locked = false;
  state.matchedCount = 0;
  completePanel.hidden = true;
  bestRecord.hidden = true;
  completeTime.textContent = "本次用时 00:00";
  gameSubtitle.textContent = `识字消消乐 ${size} x ${size}`;

  state.tiles = createTiles(size);
  state.totalTargets = state.tiles.filter((tile) => tile.kind === "word").length;
  board.style.setProperty("--size", size);
  renderBoard();
  updateProgress();
  setHint("点一个字，听一听");
  showScreen("game");
  speak("开始");
  calcTileFont();
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
    button.setAttribute("aria-label", tile.kind === "bonus" ? "奖励星星" : tile.value);
    button.textContent = tile.kind === "bonus" ? "★" : tile.value;
    button.style.transitionDelay = `${Math.min(index * 8, 80)}ms`;
    button.addEventListener("click", () => handleTileClick(tile.id));
    board.appendChild(button);
  });
}

function handleTileClick(tileId) {
  if (state.locked) return;

  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.matched) return;

  if (tile.kind === "bonus") {
    tile.matched = true;
    speak("真棒");
    markTile(tileId, "matched");
    setHint("奖励星星");
    checkComplete();
    return;
  }

  speak(tile.value);

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

function markTile(tileId, className, enabled = true) {
  const button = getTileButton(tileId);
  if (!button) return;
  button.classList.toggle(className, enabled);
}

function getTileButton(tileId) {
  return board.querySelector(`[data-id="${tileId}"]`);
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

function getBestRecordKey(size) {
  return `beta_words_best_${size}`;
}

function getBestRecord(size) {
  const key = getBestRecordKey(size);

  try {
    const raw = window.localStorage.getItem(key);
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
  const allDone = state.tiles.every((tile) => tile.matched);
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
  speak("都找到了");
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
  }, 260);
}

function speak(text) {
  state.lastSpoken = text;
  if (!("speechSynthesis" in window)) return;

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
