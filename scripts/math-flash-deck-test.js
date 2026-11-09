// 牌堆全集和计时评星的纯 Node 单测。
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

// 用独立的分组方式列出预期全集，避免复用引擎合法性判断。
function expectedDeck(size) {
  const cards = [];
  const add = (a, b, op) => cards.push({ a, b, op, answer: op === "+" ? a + b : a - b });
  if (size === 3) {
    for (let sum = 0; sum <= 10; sum++) {
      for (let a = 0; a <= sum; a++) add(a, sum - a, "+");
    }
  } else if (size === 4) {
    for (let a = 0; a <= 10; a++) {
      for (let b = 0; b <= a; b++) add(a, b, "−");
    }
  } else if (size === 5) {
    for (let sum = 10; sum <= 18; sum++) {
      for (let a = sum - 9; a <= 9; a++) add(a, sum - a, "+");
    }
  } else {
    for (let answer = 1; answer <= 9; answer++) {
      for (let a = 10; a <= answer + 9; a++) add(a, a - answer, "−");
    }
  }
  return cards;
}
const sorted = (cards) => cards.map((card) => JSON.stringify(card)).sort();
const bounds = { 3: [0, 10], 4: [0, 10], 5: [10, 18], 6: [1, 9] };
const boundaryCards = { 3: [[0, 0, 0], [10, 0, 10]], 4: [[10, 0, 10], [3, 3, 0]], 5: [[9, 1, 10]], 6: [[10, 1, 9]] };
for (const size of [3, 4, 5, 6]) {
  test(`关卡 ${size}：题量、唯一性、全集、答案区间和教材表边界`, () => {
    const deck = engine.buildDeck(size);
    assert.equal(deck.length, size < 5 ? 66 : 45);
    assert.equal(new Set(deck.map(({ a, b }) => `${a}-${b}`)).size, deck.length);
    assert.deepEqual(sorted(deck), sorted(expectedDeck(size)));
    const [min, max] = bounds[size];
    assert.equal(engine.LEVELS[size].minAnswer, min);
    assert.equal(engine.LEVELS[size].maxAnswer, max);
    for (const card of deck) {
      assert.ok(card.answer >= min && card.answer <= max);
      assert.equal(engine.isValidCard(size, card.a, card.b, card.answer), true);
    }
    for (const [a, b, answer] of boundaryCards[size]) {
      assert.ok(deck.some((card) => card.a === a && card.b === b && card.answer === answer));
    }
  });
  test(`关卡 ${size}：每张卡的四个选项互异、含正确答案且在区间内`, () => {
    const [min, max] = bounds[size];
    for (const card of engine.buildDeck(size)) {
      const options = engine.createOptions(card.answer, engine.LEVELS[size]);
      assert.equal(options.length, 4);
      assert.equal(new Set(options).size, 4);
      assert.ok(options.includes(card.answer));
      assert.ok(options.every((v) => Number.isInteger(v) && v >= min && v <= max));
      const expected = [-1, 1, -2, 2, -3, 3, -10, 10, -5, 5]
        .map((offset) => card.answer + offset).filter((v) => v >= min && v <= max).slice(0, 3);
      assert.deepEqual(options.filter((v) => v !== card.answer).sort((a, b) => a - b), expected.sort((a, b) => a - b));
    }
  });
}

test("合法性函数拒绝越界操作数、错误答案和非法关卡", () => {
  for (const [size, a, b, answer] of [
    [3, -1, 1, 0], [3, 10, 1, 11], [3, 0.5, 0.5, 1], [3, 1, 1, 3],
    [4, 1, 2, -1], [4, 11, 0, 11], [5, 0, 10, 10], [5, 1, 8, 9],
    [5, 10, 1, 11], [6, 9, 1, 8], [6, 18, 8, 10], [6, 10, 10, 0], [7, 1, 1, 2]
  ]) assert.equal(engine.isValidCard(size, a, b, answer), false);
  assert.throws(() => engine.buildDeck(7), /无效关卡/);
});

for (const [deckSize, three, two] of [[45, 90000, 149985], [66, 132000, 219978]]) {
  test(`${deckSize} 张：整数毫秒阈值与所有星级边界（最低一星）`, () => {
    assert.deepEqual(engine.STAR_MS_PER_QUESTION, { three: 2000, two: 3333 });
    assert.deepEqual(engine.getStarThresholds(deckSize), { three, two });
    for (const [ms, stars] of [[0, 3], [three - 1, 3], [three, 3], [three + 1, 2], [two - 1, 2], [two, 2], [two + 1, 1], [3600000, 1]]) {
      assert.equal(engine.calcStarsByTime(ms, deckSize), stars, `${ms}ms 星级错误`);
    }
  });
}

test("星级对应奖杯与完成标题", () => {
  for (const [stars, trophy, title] of [[1, "bronze", "完成啦！"], [2, "silver", "稳稳的！"], [3, "gold", "太快啦！"]]) {
    assert.equal(engine.calcTrophyByStars(stars), trophy);
    assert.equal(engine.calcTitle(stars), title);
  }
  assert.equal(typeof engine.calcTitle(0), "string");
});

console.log(`牌堆单测：通过 ${passed}，失败 ${failed}`);
process.exitCode = failed ? 1 : 0;
