// 描红引擎契约测试。需要已启动的静态服务器：
// BASE_URL=http://127.0.0.1:4174/ node scripts/stroke-engine-test.js

const { chromium } = require('/tmp/node_modules/playwright/index.js');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4174/';
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

async function open(page, path) {
  const errors = [];
  const onError = (error) => errors.push(error.message);
  page.on('pageerror', onError);
  const response = await page.goto(new URL(path, BASE_URL).href, { waitUntil: 'networkidle' });
  page.off('pageerror', onError);
  check(response && response.status() === 200, `${path}: HTTP ${response && response.status()}`);
  check(errors.length === 0, `${path}: runtime error ${errors.join('; ')}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await open(page, 'engine/stroke/demo.html');
  await page.waitForFunction(() => window.__ready === true);
  const demo = await page.evaluate(() => {
    const zone = window.__demo.zone;
    const perStroke = zone.strokes.map((stroke) => {
      const guide = zone.getValidationGuide(stroke, 40);
      const good = new PenPath({ minDistance: 0 });
      good.begin(guide[0][0], guide[0][1], 0);
      guide.slice(1, -1).forEach((p) => good.extend(p[0], p[1]));
      good.end(guide[guide.length - 1][0], guide[guide.length - 1][1], 100);

      const fake = new PenPath({ minDistance: 0 });
      fake.begin(guide[0][0], guide[0][1], 0);
      fake.extend(0.10, 0.90);
      fake.extend(0.90, 0.10);
      fake.end(guide[guide.length - 1][0], guide[guide.length - 1][1], 100);
      return { guide: guide.length, good: good.validateGuide(guide), fake: fake.validateGuide(guide) };
    });

    // 第三笔曾因 fit 后仍以原始区域判定而被拒；这里以其真实可见起点触发事件。
    const pen = window.__demo.pen;
    const stroke = zone.strokes[2];
    const guide = zone.getValidationGuide(stroke);
    const [clientX, clientY] = zone.toScreen(guide[0][0], guide[0][1]);
    const events = [];
    pen.setStrokeIndex(2);
    pen.onStart = () => events.push('start');
    pen.onReject = (result) => events.push(`reject:${result.reason}`);
    zone._svg.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, pointerId: 71, pointerType: 'mouse', clientX, clientY, button: 0
    }));
    if (pen.active) {
      zone._svg.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true, pointerId: 71, pointerType: 'mouse', clientX, clientY, button: 0
      }));
    }
    return { perStroke, events };
  });
  check(demo.perStroke.length === 8, `demo: expected 8 strokes, got ${demo.perStroke.length}`);
  demo.perStroke.forEach((item, index) => {
    check(item.guide >= 2, `demo stroke ${index + 1}: no validation guide`);
    check(item.good.ok, `demo stroke ${index + 1}: exact median rejected (${item.good.reason})`);
    check(!item.fake.ok, `demo stroke ${index + 1}: off-path fake accepted`);
  });
  check(demo.events[0] === 'start', `demo stroke 3: visible start rejected (${demo.events.join(',')})`);

  await open(page, 'engine/stroke/test/pinyin.html');
  const pinyin = await page.evaluate(() => ({
    zones: document.querySelectorAll('.stroke-zone-svg').length,
    tones: document.querySelectorAll('.stroke-guide--tone').length,
    bad: [...document.querySelectorAll('[transform]')]
      .filter((node) => /NaN|Infinity/.test(node.getAttribute('transform') || '')).length
  }));
  check(pinyin.zones === 4, `pinyin: expected 4 zones, got ${pinyin.zones}`);
  check(pinyin.tones === 4, `pinyin: expected 4 tones, got ${pinyin.tones}`);
  check(pinyin.bad === 0, 'pinyin: invalid SVG transform');

  await open(page, 'engine/stroke/test/numbers.html');
  const numbers = await page.evaluate(() => ({
    zones: document.querySelectorAll('.stroke-zone-svg').length,
    withoutGuide: [...document.querySelectorAll('.stroke-zone-svg')]
      .filter((zone) => !zone.querySelector('.stroke-guide')).length,
    digits: Object.keys(window.__numberZones || {}).sort(),
    checks: Object.keys(window.__numberZones || {}).sort().flatMap((digit) => {
      const spec = window.TRACE_NUMBERS.getStrokeSpec(digit);
      const zone = window.__numberZones[digit];
      return zone.strokes.map((stroke, index) => {
        const guide = zone.getValidationGuide(stroke, 40);
        const good = new PenPath({ minDistance: 0 });
        good.begin(guide[0][0], guide[0][1], 0);
        guide.slice(1, -1).forEach((point) => good.extend(point[0], point[1]));
        good.end(guide[guide.length - 1][0], guide[guide.length - 1][1], 100);

        const fake = new PenPath({ minDistance: 0 });
        fake.begin(guide[0][0], guide[0][1], 0);
        fake.extend(0.08, 0.92);
        fake.extend(0.92, 0.08);
        fake.end(guide[guide.length - 1][0], guide[guide.length - 1][1], 100);

        const wrongStart = new PenPath({ minDistance: 0 });
        wrongStart.begin((guide[0][0] + 0.38) % 0.95, (guide[0][1] + 0.31) % 0.95, 0);
        wrongStart.extend(guide[0][0], guide[0][1]);
        guide.slice(1, -1).forEach((point) => wrongStart.extend(point[0], point[1]));
        wrongStart.end(guide[guide.length - 1][0], guide[guide.length - 1][1], 100);
        return {
          digit, index, guide: guide.length, median: stroke.medianPoints().length,
          source: spec.source, good: good.validateGuide(guide),
          fake: fake.validateGuide(guide), wrongStart: wrongStart.validateGuide(guide)
        };
      });
    })
  }));
  check(numbers.zones === 10, `numbers: expected 10 zones, got ${numbers.zones}`);
  check(numbers.withoutGuide === 0, `numbers: ${numbers.withoutGuide} zones lack a guide`);
  check(numbers.digits.join(',') === '1,10,2,3,4,5,6,7,8,9',
    `numbers: expected 1-10 zones, got ${numbers.digits.join(',')}`);
  numbers.checks.forEach((item) => {
    const name = `number ${item.digit} stroke ${item.index + 1}`;
    check(item.median >= 2, `${name}: missing authored median`);
    check(item.guide >= 2, `${name}: no validation guide`);
    check(item.source && item.source.verified && Number.isInteger(item.source.page),
      `${name}: missing verified textbook citation`);
    check(item.good.ok, `${name}: exact median rejected (${item.good.reason})`);
    check(!item.fake.ok, `${name}: off-path fake accepted`);
    check(!item.wrongStart.ok && item.wrongStart.reason === 'start',
      `${name}: wrong start was not rejected as start (${item.wrongStart.reason})`);
  });

  await browser.close();
  if (failures.length) {
    console.error(`FAIL (${failures.length})`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }
  console.log('PASS: Stroke engine contract checks (8 Hanzi strokes, pinyin, 1-10 numbers)');
})();
