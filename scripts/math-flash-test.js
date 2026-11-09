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

for (const size of [3, 4, 5, 6]) {
  test(`关卡 ${size}：会话结构、从牌堆取题、提交锁定和整局结束`, () => {
    const session = engine.createSession(size);
    const deck = session.deck;
    assert.deepEqual(session, {
      size, deck, cursor: 0, correctCount: 0,
      wrongCount: 0, locked: false, current: null, options: []
    });
    assert.equal(deck.length, size < 5 ? 66 : 45);
    assert.equal("questions" in session, false);
    assert.equal(engine.submitAnswer(session, 0), null, "未出题不能提交");
    assert.equal(engine.nextQuestion(session), false, "未作答不能跳题");
    const seen = new Set();
    for (let i = 0; i < deck.length; i++) {
      assert.equal(engine.startQuestion(session), session);
      const question = session.current;
      assert.equal(question, deck[i], "必须取出当前牌堆位置的卡");
      const key = `${question.a}-${question.b}`;
      assert.ok(!seen.has(key), "答错的卡也不能重出");
      seen.add(key);
      engine.startQuestion(session);
      assert.equal(session.current, question, "重复开始不能重新抽题");
      assert.equal(session.options.length, 4);
      assert.ok(session.options.includes(question.answer));
      assert.equal(engine.nextQuestion(session), false, "未提交不能推进");
      const correct = i % 2 === 0;
      const value = correct ? question.answer : session.options.find((v) => v !== question.answer);
      assert.deepEqual(engine.submitAnswer(session, value), { correct, answer: question.answer });
      assert.equal(session.correctCount, Math.floor(i / 2) + 1);
      assert.equal(session.wrongCount, Math.floor((i + 1) / 2));
      assert.equal(session.locked, true);
      assert.equal(engine.submitAnswer(session, question.answer), null, "重复点击不能计数");
      engine.startQuestion(session);
      assert.equal(session.current, question, "已判定时不能换卡");
      assert.equal(engine.nextQuestion(session), i === deck.length - 1);
      assert.equal(session.cursor, i + 1);
      assert.equal(session.locked, false);
      assert.equal(session.current, null);
      assert.deepEqual(session.options, []);
      assert.equal(session.deck, deck, "整局不能重新构建牌堆");
    }
    assert.equal(seen.size, deck.length);
    engine.startQuestion(session);
    assert.equal(session.current, null, "出完不能继续取牌");
    assert.equal(engine.submitAnswer(session, 0), null);
    assert.equal(engine.nextQuestion(session), true);
    assert.equal(session.cursor, deck.length, "结束后不能继续推进");
    // 即使外部残留了 current，提交边界也必须以牌堆长度为准。
    session.current = deck[0];
    assert.equal(engine.submitAnswer(session, deck[0].answer), null);
  });
}

test("随机源控制下牌堆与选项发生变化，会话支持数字字符串，非法关卡被拒绝", () => {
  const originalRandom = Math.random;
  try {
    for (const size of [3, 4, 5, 6]) {
      Math.random = () => 0;
      const first = engine.startQuestion(engine.createSession(size));
      Math.random = () => 0.999999;
      const last = engine.startQuestion(engine.createSession(size));
      assert.notDeepEqual(first.deck, last.deck, `关卡 ${size} 未洗牌`);
      assert.notDeepEqual(first.options, last.options, `关卡 ${size} 选项未随机变化`);
    }
  } finally {
    Math.random = originalRandom;
  }
  assert.equal(engine.createSession("3").size, 3);
  assert.throws(() => engine.createSession(7), /无效关卡/);
});

console.log(`逻辑单测：通过 ${passed}，失败 ${failed}`);
process.exitCode = failed ? 1 : 0;
