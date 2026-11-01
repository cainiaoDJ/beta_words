// 纯 Node 逻辑单测，不依赖浏览器或 Playwright。
const assert = require("node:assert/strict");
const { MathFlashEngine: engine } = require("../current/engine/math-flash.js");
let passed = 0;
let failed = 0;

function test(name, run) {
  try {
    run();
    passed += 1;
    console.log(`✅ ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`❌ ${name}：${error.message}`);
  }
}

test("错题数对应星级、奖杯和完成标题", () => {
  const cases = [
    [0, 3, "gold"], [1, 2, "silver"], [3, 2, "silver"],
    [4, 1, "bronze"], [9, 1, "bronze"], [10, 0, null]
  ];
  cases.forEach(([wrong, stars, trophy]) => {
    assert.equal(engine.calcStars(wrong), stars, `错 ${wrong} 题星级错误`);
    assert.equal(engine.calcTrophy(wrong), trophy, `错 ${wrong} 题奖杯错误`);
  });
  ["再试一次", "差一点点", "算得不错！", "全对啦！"].forEach((title, stars) => {
    assert.equal(engine.calcTitle(stars), title, `${stars} 星标题错误`);
  });
});

// 以独立的规格区间校验，不从引擎配置取预期值。
const bounds = { 3: [2, 10], 4: [0, 9], 5: [11, 20], 6: [2, 19] };
for (const size of [3, 4, 5, 6]) {
  test(`关卡 ${size}：100 局 × 10 题的运算、区间、进退位和干扰项`, () => {
    for (let round = 0; round < 100; round++) {
      const session = engine.createSession(size);
      for (let cursor = 0; cursor < 10; cursor++) {
        engine.startQuestion(session);
        const { a, b, op, answer } = session.current;
        const label = `关卡 ${size} 第 ${cursor + 1} 题 ${a}${op}${b}`;
        const inRange = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
        assert.ok(inRange(answer, ...bounds[size]), `${label} 答案越界`);
        assert.equal(op, size === 3 || size === 5 ? "+" : "−", `${label} 运算符错误`);
        assert.equal(answer, op === "+" ? a + b : a - b, `${label} 计算错误`);
        if (size === 3) {
          assert.ok(inRange(a, 1, 9) && inRange(b, 1, 9) && a + b <= 10, `${label} 不符合入门加法`);
        } else if (size === 4) {
          assert.ok(inRange(a, 2, 10) && inRange(b, 1, a) && a - b >= 0, `${label} 不符合十以内减法`);
        } else if (size === 5) {
          assert.ok(inRange(a, 1, 10) && inRange(b, 1, 10) && a + b >= 11, `${label} 未满足进位规则`);
        } else {
          assert.ok(inRange(a, 11, 20) && inRange(b, 1, 9) && a % 10 < b, `${label} 未满足退位规则`);
        }
        assert.equal(session.options.length, 4, `${label} 选项数量不是 4`);
        assert.equal(new Set(session.options).size, 4, `${label} 选项重复`);
        assert.equal(session.options.filter((v) => v === answer).length, 1, `${label} 正确选项数量错误`);
        assert.ok(session.options.every((v) => inRange(v, ...bounds[size])), `${label} 干扰项越界`);
        // 优先选取最接近答案的三个合法干扰项。
        const expected = [-1, 1, -2, 2, -3, 3, -10, 10, -5, 5]
          .map((offset) => answer + offset)
          .filter((v) => inRange(v, ...bounds[size])).slice(0, 3);
        assert.deepEqual(session.options.filter((v) => v !== answer).sort((a, b) => a - b),
          expected.sort((a, b) => a - b), `${label} 干扰项优先级错误`);
        engine.submitAnswer(session, answer);
        assert.equal(engine.nextQuestion(session), cursor === 9, `${label} 结束时机错误`);
      }
      assert.equal(session.questions.length, 10, "一局必须恰好十题");
      assert.equal(session.correctCount, 10, "全对计数错误");
    }
  });
}

test("会话正确/错误提交、锁定、防重复计数及十题结束", () => {
  const session = engine.createSession(3);
  assert.deepEqual(session, {
    size: 3, questions: [], cursor: 0, correctCount: 0,
    wrongCount: 0, locked: false, current: null, options: []
  });
  engine.nextQuestion(session);
  assert.equal(session.cursor, 0, "未作答不能跳题");
  for (let i = 0; i < 10; i++) {
    engine.startQuestion(session);
    const question = session.current;
    engine.startQuestion(session);
    assert.equal(session.current, question, "同一题不能重复生成");
    const correct = i % 2 === 0;
    const value = correct ? question.answer : session.options.find((v) => v !== question.answer);
    assert.deepEqual(engine.submitAnswer(session, value), { correct, answer: question.answer });
    assert.equal(session.correctCount, Math.floor(i / 2) + 1, "答对计数错误");
    assert.equal(session.wrongCount, Math.floor((i + 1) / 2), "答错计数错误");
    assert.equal(session.locked, true, "提交后未锁定");
    assert.equal(engine.submitAnswer(session, question.answer), null, "重复答题应被忽略");
    assert.equal(engine.submitTimeout(session), null, "已提交后不应再次超时计数");
    assert.equal(engine.nextQuestion(session), i === 9, "结束标记错误");
    assert.equal(session.cursor, i + 1, "题号未推进");
    assert.equal(session.locked, false, "推进后未解锁");
  }
  engine.startQuestion(session);
  assert.equal(session.current, null, "结束后不应生成第十一题");
  assert.equal(engine.nextQuestion(session), true);
  assert.equal(session.cursor, 10, "结束后不能继续推进");
});

test("超时算错且后续点击/超时不能重复计数", () => {
  const session = engine.createSession(6);
  engine.startQuestion(session);
  const answer = session.current.answer;
  assert.deepEqual(engine.submitTimeout(session), { correct: false, answer });
  assert.equal(session.wrongCount, 1, "超时未计错题");
  assert.equal(session.locked, true, "超时未锁输入");
  engine.submitAnswer(session, answer);
  engine.submitTimeout(session);
  assert.equal(session.wrongCount, 1, "超时重复计数");
  assert.equal(session.correctCount, 0, "超时后答对不应计数");
});

test("随机源控制下题目与选项确实发生变化，非法关卡被拒绝", () => {
  const originalRandom = Math.random;
  try {
    for (const size of [3, 4, 5, 6]) {
      Math.random = () => 0;
      const first = engine.startQuestion(engine.createSession(size));
      Math.random = () => 0.999999;
      const last = engine.startQuestion(engine.createSession(size));
      assert.notDeepEqual(first.current, last.current, `关卡 ${size} 出题未使用随机源`);
      assert.notDeepEqual(first.options, last.options, `关卡 ${size} 选项未随机变化`);
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.throws(() => engine.createSession(7), /无效关卡/);
});

console.log(`逻辑单测：通过 ${passed}，失败 ${failed}`);
process.exitCode = failed ? 1 : 0;
