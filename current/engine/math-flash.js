// 算术闪卡纯逻辑：全量牌堆、选项、会话推进与按整局用时评星。
(function (global) {
  "use strict";

  const LEVELS = {
    3: { name: "10 以内加法", sub: "66 题 · 入门", op: "+", minAnswer: 0, maxAnswer: 10 },
    4: { name: "10 以内减法", sub: "66 题 · 熟练", op: "−", minAnswer: 0, maxAnswer: 10 },
    5: { name: "20 以内加法", sub: "45 题 · 进位", op: "+", minAnswer: 10, maxAnswer: 18 },
    6: { name: "20 以内减法", sub: "45 题 · 退位", op: "−", minAnswer: 1, maxAnswer: 9 }
  };

  const STAR_MS_PER_QUESTION = { three: 2000, two: 3333 };

  function shuffle(values) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  function createSession(size) {
    if (!LEVELS[size]) throw new Error(`算术闪卡：无效关卡 ${size}`);
    return {
      size: Number(size), deck: buildDeck(size), cursor: 0, correctCount: 0,
      wrongCount: 0, locked: false, current: null, options: []
    };
  }

  function isValidCard(size, a, b, answer) {
    const level = LEVELS[size];
    if (!level || !Number.isInteger(a) || !Number.isInteger(b)) return false;
    if (answer !== (level.op === "+" ? a + b : a - b)) return false;
    switch (Number(size)) {
      case 3: return a >= 0 && b >= 0 && a <= 10 && b <= 10 && answer <= 10;
      case 4: return a >= 0 && b >= 0 && b <= a && a <= 10;
      case 5: return a >= 1 && b >= 1 && a <= 9 && b <= 9 && answer >= 10 && answer <= 18;
      case 6: return a >= 10 && a <= 18 && b >= 1 && b <= 9 && answer >= 1 && answer <= 9;
      default: return false;
    }
  }

  function buildDeck(size) {
    const level = LEVELS[size];
    if (!level) throw new Error(`算术闪卡：无效关卡 ${size}`);
    const seen = new Set();
    const cards = [];
    // 含 0 的教材表边界题也必须完整入堆。
    for (let a = 0; a <= 20; a++) {
      for (let b = 0; b <= 10; b++) {
        const answer = level.op === "+" ? a + b : a - b;
        if (!isValidCard(size, a, b, answer)) continue;
        const key = `${a}-${b}`;
        if (seen.has(key)) continue;
        seen.add(key);
        cards.push({ a, b, op: level.op, answer });
      }
    }
    return shuffle(cards);
  }

  function createOptions(answer, level) {
    const options = [answer];
    const offsets = [-1, 1, -2, 2, -3, 3, -10, 10, -5, 5];
    for (const offset of offsets) {
      const value = answer + offset;
      if (value >= level.minAnswer && value <= level.maxAnswer && !options.includes(value)) {
        options.push(value);
      }
      if (options.length === 4) break;
    }
    if (options.length < 4) {
      const remaining = [];
      for (let value = level.minAnswer; value <= level.maxAnswer; value++) {
        if (!options.includes(value)) remaining.push(value);
      }
      options.push(...shuffle(remaining).slice(0, 4 - options.length));
    }
    return shuffle(options);
  }

  function startQuestion(session) {
    if (session.locked || session.cursor >= session.deck.length || session.current) return session;
    session.current = session.deck[session.cursor];
    session.options = createOptions(session.current.answer, LEVELS[session.size]);
    return session;
  }

  function submitAnswer(session, value) {
    if (session.locked || !session.current || session.cursor >= session.deck.length) return null;
    const correct = value === session.current.answer;
    if (correct) session.correctCount += 1;
    else session.wrongCount += 1;
    session.locked = true;
    return { correct, answer: session.current.answer };
  }

  // 返回 true 表示牌堆已出完；未提交时不允许跳题。
  function nextQuestion(session) {
    if (session.cursor >= session.deck.length) return true;
    if (!session.locked) return false;
    session.cursor += 1;
    session.locked = false;
    session.current = null;
    session.options = [];
    return session.cursor >= session.deck.length;
  }

  function getStarThresholds(deckSize) {
    return {
      three: deckSize * STAR_MS_PER_QUESTION.three,
      two: deckSize * STAR_MS_PER_QUESTION.two
    };
  }

  function calcStarsByTime(elapsedMs, deckSize) {
    const thresholds = getStarThresholds(deckSize);
    if (elapsedMs <= thresholds.three) return 3;
    if (elapsedMs <= thresholds.two) return 2;
    return 1;
  }

  function calcTrophyByStars(stars) {
    return [null, "bronze", "silver", "gold"][stars];
  }

  function calcTitle(stars) {
    return ["完成啦！", "完成啦！", "稳稳的！", "太快啦！"][stars];
  }

  const MathFlashEngine = {
    LEVELS, STAR_MS_PER_QUESTION, isValidCard, buildDeck, createOptions,
    createSession, startQuestion, submitAnswer, nextQuestion,
    getStarThresholds, calcStarsByTime, calcTrophyByStars, calcTitle
  };
  global.MathFlashEngine = MathFlashEngine;
})(typeof window !== "undefined" ? window : this);
