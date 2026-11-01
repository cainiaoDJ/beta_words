// 算术闪卡纯逻辑：出题、选项、会话推进与按错题数评星。
(function (global) {
  "use strict";

  const LEVELS = {
    3: { name: "10 以内加法", sub: "10 题 · 入门", op: "+", minAnswer: 2, maxAnswer: 10 },
    4: { name: "10 以内减法", sub: "10 题 · 熟练", op: "−", minAnswer: 0, maxAnswer: 9 },
    5: { name: "20 以内加法", sub: "10 题 · 进位", op: "+", minAnswer: 11, maxAnswer: 20 },
    6: { name: "20 以内减法", sub: "10 题 · 退位", op: "−", minAnswer: 2, maxAnswer: 19 }
  };

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
      size: Number(size), questions: [], cursor: 0, correctCount: 0,
      wrongCount: 0, locked: false, current: null, options: []
    };
  }

  function createQuestion(size) {
    const level = LEVELS[size];
    const pool = [];
    // 穷举合法题池后随机抽取，避免边界条件下反复重试。
    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 10; b++) {
        const answer = level.op === "+" ? a + b : a - b;
        const valid = size === 3 ? a <= 9 && b <= 9 && answer <= 10
          : size === 4 ? a >= 2 && a <= 10 && b <= a
          : size === 5 ? a <= 10 && answer >= 11
          : a >= 11 && b <= 9 && a % 10 < b;
        if (valid && answer >= level.minAnswer && answer <= level.maxAnswer) {
          pool.push({ a, b, op: level.op, answer });
        }
      }
    }
    return pool[Math.floor(Math.random() * pool.length)];
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
    if (session.locked || session.cursor >= 10 || session.current) return session;
    session.current = createQuestion(session.size);
    session.questions.push(session.current);
    session.options = createOptions(session.current.answer, LEVELS[session.size]);
    return session;
  }

  function submitAnswer(session, value) {
    if (session.locked || !session.current || session.cursor >= 10) return null;
    const correct = value === session.current.answer;
    if (correct) session.correctCount += 1;
    else session.wrongCount += 1;
    session.locked = true;
    return { correct, answer: session.current.answer };
  }

  function submitTimeout(session) {
    if (session.locked || !session.current || session.cursor >= 10) return null;
    session.wrongCount += 1;
    session.locked = true;
    return { correct: false, answer: session.current.answer };
  }

  // 返回 true 表示十题已完成；未提交时不允许跳题。
  function nextQuestion(session) {
    if (session.cursor >= 10) return true;
    if (!session.locked) return false;
    session.cursor += 1;
    session.locked = false;
    session.current = null;
    session.options = [];
    return session.cursor >= 10;
  }

  function calcStars(wrongCount) {
    if (wrongCount === 0) return 3;
    if (wrongCount <= 3) return 2;
    if (wrongCount < 10) return 1;
    return 0;
  }

  function calcTrophy(wrongCount) {
    return [null, "bronze", "silver", "gold"][calcStars(wrongCount)];
  }

  function calcTitle(stars) {
    return ["再试一次", "差一点点", "算得不错！", "全对啦！"][stars];
  }

  const MathFlashEngine = {
    LEVELS, createSession, startQuestion, submitAnswer, submitTimeout,
    nextQuestion, calcStars, calcTrophy, calcTitle
  };
  global.MathFlashEngine = MathFlashEngine;
})(typeof window !== "undefined" ? window : this);
