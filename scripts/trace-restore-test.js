// 描红专项验收：实际 Canvas 绘制命令 + 独立原数据 + 浏览器几何测量。
// 不通过像素估计边界；像素只用于确认灰字、红笔迹、彩色笔顺引导线各自存在。
//
// 笔顺引导层（2026-11）约定：
//   · 进场/换字自动播一遍演示，期间 .trace-stage.is-locked 锁住画布
//   · 演示结束后引导线与序号常驻，作为描红底稿
//   · 范字仍必须来自数据 path，主画布 fillText 只允许画序号数字
// BASE_URL=http://127.0.0.1:4174/ node scripts/trace-restore-test.js
const { chromium } = require('/tmp/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4174/';
const SHOTS = '/tmp/trace_restore_shots';
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'current/assets/data/trace-numbers.js'), 'utf8'), sandbox);
const references = { numbers: {}, hanzi: {} };
for (const item of sandbox.window.TRACE_NUMBERS.items) {
  references.numbers[item.charKey] = sandbox.window.TRACE_NUMBERS.getStrokeSpec(item.charKey);
}
for (const file of fs.readdirSync(path.join(ROOT, 'current/assets/data/hanzi-cache'))) {
  if (file.endsWith('.json')) references.hanzi[file.slice(0, -5)] = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'current/assets/data/hanzi-cache', file), 'utf8'));
}
const points = Object.values(references.hanzi).flatMap(data => data.medians.flat());
const xs = points.map(p => p[0]), ys = points.map(p => 1024 - p[1]);
references.hanziScale = 960 / (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) + 88);

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const errors = [], requests = [], report = { geometry: [], largeViewports: [], checks: [] };
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await context.addInitScript(() => {
      const native = window.Path2D;
      const sources = new WeakMap();
      window.Path2D = class extends native {
        constructor(source) {
          super(source);
          sources.set(this, typeof source === 'string'
            ? [{ d: source, matrix: [1, 0, 0, 1, 0, 0] }]
            : (sources.get(source) || []).map(s => ({ ...s })));
        }
        addPath(source, matrix) {
          super.addPath(source, matrix);
          const target = sources.get(this);
          for (const stroke of sources.get(source) || []) {
            const m = new DOMMatrix(matrix).multiply(new DOMMatrix(stroke.matrix));
            target.push({ d: stroke.d, matrix: [m.a, m.b, m.c, m.d, m.e, m.f] });
          }
        }
      };
      window.__traceDraws = [];
      window.__traceFrame = null;
      window.__traceTextCalls = 0;
      window.__traceTextLabels = [];
      const proto = CanvasRenderingContext2D.prototype;
      const matrixOf = ctx => { const m = ctx.getTransform(); return [m.a, m.b, m.c, m.d, m.e, m.f]; };
      for (const method of ['fill', 'stroke', 'fillText', 'strokeText', 'clearRect', 'strokeRect']) {
        const original = proto[method];
        proto[method] = function (...args) {
          const main = this.canvas.id === 'trace-canvas';
          if (main && method === 'clearRect') { window.__traceDraws = []; window.__traceFrame = null; }
          if ((main || this.canvas.closest('#trace-remaining')) && /Text$/.test(method)) {
            window.__traceTextCalls++;
            if (main) window.__traceTextLabels.push(String(args[0]));
          }
          if (main && sources.has(args[0])) {
            window.__traceDraws.push({
              method, paths: sources.get(args[0]), matrix: matrixOf(this),
              color: method === 'fill' ? this.fillStyle : this.strokeStyle, width: this.lineWidth
            });
          }
          if (main && method === 'strokeRect') window.__traceFrame = { rect: args.slice(0, 4), matrix: matrixOf(this) };
          return original.apply(this, args);
        };
      }
    });
    const page = await context.newPage();
    const observe = p => {
      p.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
      p.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
      p.on('request', r => requests.push(r.url()));
    };
    observe(page);
    const screenshot = name => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('.game-entry').count(), 9);
    await screenshot('01-lobby');
    await page.click('#open-trace-tian');
    assert.deepEqual(await page.locator('#setup .difficulty:visible').evaluateAll(es => es.map(e => +e.dataset.size)), [3, 5]);
    await screenshot('02-setup');

    const ready = () => page.waitForFunction(() => !document.querySelector('#trace-next').disabled &&
      document.querySelector('#trace-loading').hidden && !document.querySelector('.trace-stage').classList.contains('is-locked'));
    const pixels = () => page.evaluate(() => {
      const c = document.querySelector('#trace-canvas');
      const data = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let gray = 0, red = 0, blue = 0;
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = data.slice(i, i + 4);
        if (a < 100) continue;
        if (r === 176 && g === 176 && b === 176) gray++;
        // 只认孩子笔迹 #d86d4c 的核心色：金色引导线 (#A9761B) 与白底混合时
        // 也会落进「偏红」的宽松区间，必须收紧，否则会把引导线误判成笔迹。
        if (r >= 200 && r <= 235 && g >= 90 && g <= 130 && b >= 55 && b <= 100) red++;
        if (b > r + 20 && b > g + 10) blue++;
      }
      return { gray, red, blue };
    });
    const draw = async () => {
      const r = await page.locator('#trace-canvas').boundingBox();
      await page.mouse.move(r.x + r.width * .3, r.y + r.height * .4);
      await page.mouse.down();
      await page.mouse.move(r.x + r.width * .7, r.y + r.height * .6, { steps: 8 });
      await page.mouse.up();
      assert((await pixels()).red > 100, 'pointer 事件没有产生红色笔迹');
      const points = await page.evaluate(() => state.traceStrokes.at(-1).points);
      assert(Math.abs(points[0][0] - .3) < .002 && Math.abs(points.at(-1)[1] - .6) < .002,
        '缩放后的指针坐标与画布不一致');
    };

    // 从真实 Canvas 命令提取 Path2D 原文/矩阵，再在同一屏幕位置用浏览器 SVG 几何测量。
    // 这个 SVG 仅属测试探针，测完即删。格框来自实际 strokeRect 命令。
    const measureCurrent = () => page.evaluate(ref => {
      const item = state.traceItems[state.traceIndex];
      const source = ref[item.pool][item.charKey];
      const draws = window.__traceDraws;
      if (draws.length !== source.strokes.length) throw new Error(`${item.charKey}: 笔画数不符`);
      const hanzi = item.pool === 'hanzi';
      const expectedAdapt = hanzi ? [1, 0, 0, -1, 0, 1024] : [1, 0, 0, 1, 0, 0];
      draws.forEach((draw, i) => {
        if (draw.paths.length !== 1 || draw.paths[0].d !== source.strokes[i] ||
          JSON.stringify(draw.paths[0].matrix) !== JSON.stringify(expectedAdapt) ||
          draw.method !== (hanzi ? 'fill' : 'stroke') || draw.color !== '#b0b0b0') {
          throw new Error(`${item.charKey}: Canvas 字形/方向/颜色不等于独立原数据`);
        }
      });
      const canvas = document.querySelector('#trace-canvas');
      const cr = canvas.getBoundingClientRect();
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('viewBox', `0 0 ${canvas.width} ${canvas.height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.cssText = `position:fixed;left:${cr.left}px;top:${cr.top}px;width:${cr.width}px;height:${cr.height}px;visibility:hidden;pointer-events:none`;
      const glyph = document.createElementNS(ns, 'g');
      svg.appendChild(glyph);
      for (const draw of draws) {
        const group = document.createElementNS(ns, 'g');
        group.setAttribute('transform', `matrix(${draw.matrix.join(' ')})`);
        for (const src of draw.paths) {
          const p = document.createElementNS(ns, 'path');
          p.setAttribute('d', src.d);
          p.setAttribute('transform', `matrix(${src.matrix.join(' ')})`);
          group.appendChild(p);
        }
        glyph.appendChild(group);
      }
      const frame = window.__traceFrame;
      const lo = hanzi ? 32 : 152, hi = hanzi ? 992 : 872;
      const frameUnits = frame.rect.map((v, i) => v * frame.matrix[i % 2 === 0 ? 0 : 3] * 1024 / canvas.width);
      const expectedFrame = [lo, lo, hi - lo, hi - lo];
      if (frameUnits.some((v, i) => Math.abs(v - expectedFrame[i]) > 1e-6)) throw new Error('格线不是源数据约定的字符格');
      if (hanzi) {
        const actualScale = draws[0].matrix[0] * 1024 / canvas.width;
        if (Math.abs(actualScale - ref.hanziScale) > 1e-6) throw new Error('汉字未使用骨架并集统一尺度');
      }
      const cell = document.createElementNS(ns, 'rect');
      ['x', 'y', 'width', 'height'].forEach((key, i) => cell.setAttribute(key, frame.rect[i]));
      cell.setAttribute('transform', `matrix(${frame.matrix.join(' ')})`);
      svg.appendChild(cell);
      document.body.appendChild(svg);
      try {
        const gr = glyph.getBoundingClientRect(), fr = cell.getBoundingClientRect();
        const offset = [gr.x + gr.width / 2 - fr.x - fr.width / 2, gr.y + gr.height / 2 - fr.y - fr.height / 2];
        const margins = [gr.left - fr.left, fr.right - gr.right, gr.top - fr.top, fr.bottom - gr.bottom];
        let sourceOffset = null, extraOffset = null;
        if (!hanzi) {
          const raw = document.createElementNS(ns, 'g');
          for (const d of source.strokes) {
            const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); raw.appendChild(p);
          }
          svg.appendChild(raw);
          const rb = raw.getBBox();
          sourceOffset = [rb.x + rb.width / 2 - 512, rb.y + rb.height / 2 - 512];
          const unit = cr.width / 1024;
          extraOffset = offset.map((v, i) => v - sourceOffset[i] * unit);
          const m = draws[0].matrix;
          if (Math.abs(m[0] - canvas.width / 1024) > 1e-6 || m[0] !== m[3] || m[4] || m[5]) {
            throw new Error('数字没有保留 scale=1 和作者位置');
          }
        }
        return { pool: item.pool, char: item.charKey, offset, margins, sourceOffset, extraOffset,
          ink: { width: gr.width, height: gr.height }, cell: { width: fr.width, height: fr.height } };
      } finally { svg.remove(); }
    }, references);
    const checkGeometry = async () => {
      const m = await measureCurrent();
      assert(m.ink.width > 0 && m.ink.height > 0, `${m.char} 空轮廓`);
      assert(m.margins.every(v => v >= -.5), `${m.char} 出格: ${m.margins}`);
      if (m.pool === 'hanzi') assert(m.offset.every(v => Math.abs(v) <= 2), `${m.char} 字心未居中: ${m.offset}`);
      else assert(m.extraOffset.every(v => Math.abs(v) < .002), `${m.char} 渲染引入偏移: ${m.extraOffset}`);
      report.geometry.push(m);
      return m;
    };

    for (const size of [3, 5]) {
      await page.click(`.difficulty[data-size="${size}"]`);
      // 进场自动播一遍笔顺：演示期间画布锁定
      await page.waitForSelector('.trace-stage.is-locked', { timeout: 20000 });
      await ready();
      assert.equal((await page.locator('#hint').textContent()).trim(), '从数字圆点起笔，顺着细线描一描');
      assert.equal(await page.locator('#trace-order-svg').count(), 0);
      assert.equal(await page.locator('#trace-host svg').count(), 0);
      assert.equal(await page.locator('#trace-remaining canvas').count(), 10);
      // 范字必须来自数据 path；主画布仅允许序号圆点用 fillText（纯数字标签）。
      const labels = await page.evaluate(() => window.__traceTextLabels);
      assert(labels.length > 0, '笔顺序号点未绘制');
      assert(labels.every(t => /^\d+(·\d+)*$/.test(t)), `主画布出现非序号文字: ${JSON.stringify([...new Set(labels)])}`);
      const first = await pixels();
      // 引导层已恢复：灰字在、无红笔迹、彩色引导线存在（蓝是第 1 笔的颜色）
      assert(first.gray > 100 && first.red === 0 && first.blue > 0, `灰字/笔顺颜色异常: ${JSON.stringify(first)}`);
      await page.click('#trace-next');
      assert.equal(await page.evaluate(() => state.traceIndex), 0);
      assert.equal(await page.locator('#hint').textContent(), '先描几笔，再换下一个字');
      await page.waitForTimeout(400); // 等待拒绝空白切字的 shake 结束。
      for (let i = 0; i < 10; i++) {
        const m = await checkGeometry();
        if (i === 0 || (size === 3 && ['1', '7'].includes(m.char))) await screenshot(`pool-${size}-${m.char}-gray`);
        await draw();
        if (i === 0) {
          await screenshot(`pool-${size}-red-ink`);
          await page.click('#trace-clear');
          assert.equal((await pixels()).red, 0);
          assert((await pixels()).gray > 100);
          await draw();
          await page.setViewportSize({ width: 375, height: 667 });
          await page.waitForTimeout(100);
          assert((await pixels()).red > 100, 'resize 丢失笔迹');
          await page.setViewportSize({ width: 390, height: 844 });
          await page.waitForTimeout(100);
        }
        const loads = requests.filter(url => url.includes('/hanzi-cache/')).length;
        // 在 click 所在的同一 JS 调用栈检验同步切字，不给 Promise/动画机会。
        const next = await page.evaluate(() => {
          document.querySelector('#trace-next').click();
          return { index: state.traceIndex, disabled: document.querySelector('#trace-next').disabled,
            locked: document.querySelector('.trace-stage').classList.contains('is-locked'),
            loading: !document.querySelector('#trace-loading').hidden };
        });
        assert.equal(next.index, i + 1);
        assert(!next.loading, '下一字仍在加载');
        assert.equal(requests.filter(url => url.includes('/hanzi-cache/')).length, loads, '切字又加载数据');
        if (i < 9) assert.equal((await pixels()).red, 0, '切字未清空红色笔迹');
        // 换字后自动播新字的笔顺（is-locked），等演示结束再让孩子描。
        if (next.locked) await ready();
      }
      await page.locator('#complete-panel').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#complete-stats').textContent(), '描完 10 / 10 个字');
      await screenshot(`pool-${size}-complete`);
      await page.click('#play-again');
      await ready();
      assert.equal(await page.evaluate(() => state.traceIndex), 0);
      // 穷举所有源字形，防止抽样遗漏不居中/镜像/出格的字；不替代上面的真实交互流程。
      const keys = Object.keys(references[size === 3 ? 'numbers' : 'hanzi']);
      const saved = await page.evaluate(() => state.traceItems.map(item => ({ ...item })));
      await page.evaluate(poolSize => {
        state.traceItems = (poolSize === 3 ? window.TRACE_NUMBERS : window.TRACE_HANZI).items;
      }, size);
      for (const key of keys) {
        await page.evaluate(char => {
          state.traceIndex = state.traceItems.findIndex(item => item.charKey === char);
          state.traceStrokes = [];
          drawTraceStage();
        }, key);
        const m = await checkGeometry();
        if (size === 5 && ['中', '学', '书', '上'].includes(key)) {
          await page.evaluate(() => renderTraceRemaining());
          await screenshot(`hanzi-${key}-centered`);
        }
        if (size === 3 && ['1', '7'].includes(key)) {
          await page.evaluate(() => renderTraceRemaining());
          await screenshot(`number-${key}-source-position`);
        }
      }
      await page.evaluate(items => { state.traceItems = items; state.traceIndex = 0; renderTraceRemaining(); drawTraceStage(); }, saved);
      await page.click('[data-action="back-setup"]');
      assert.equal(await page.evaluate(() => state.traceGlyphs), null);
      console.log(`描红池 size=${size}: 完成/重玩/全部 ${keys.length} 字形几何 PASS`);
    }
    assert(!requests.some(url => /jsdelivr/i.test(url)), '发出了 jsdelivr CDN 请求');
    report.checks.push('9 个入口；数字/汉字可选、拼音隐藏；两池各描完10字并重玩；清除/resize/同步下一字；0系统字体范字；笔顺引导+序号常驻；0 CDN');

    // 大屏覆盖所有游戏，特别检查从描红返回后其它八个游戏的容器和 HUD。
    await page.click('[data-action="back-lobby"]');
    for (const viewport of [{ width: 1440, height: 900 }, { width: 844, height: 390 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport);
      const games = await page.locator('.game-entry').evaluateAll(es => es.map(e => e.id));
      for (const game of games) {
        await page.click(`#${game}`);
        await page.click('.difficulty[data-size="3"]');
        if (game === 'open-trace-tian') await ready();
        await page.waitForTimeout(150);
        const bounds = await page.evaluate(() => {
          const r = document.querySelector('.stage-canvas').getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, h: document.querySelector('.screen.active').scrollHeight,
            traceVisible: !document.querySelector('#trace-host').hidden };
        });
        assert(bounds.left >= -.5 && bounds.top >= -.5 && bounds.right <= viewport.width + .5 && bounds.bottom <= viewport.height + .5 && bounds.h <= 640,
          `${game} 大屏溢出 ${JSON.stringify(bounds)}`);
        assert.equal(bounds.traceVisible, game === 'open-trace-tian', `${game} 描红容器泄漏`);
        if (['open-trace-tian', 'open-match'].includes(game)) await screenshot(`${viewport.width}x${viewport.height}-${game}`);
        await page.click('[data-action="back-setup"]');
        await page.click('[data-action="back-lobby"]');
      }
      report.largeViewports.push({ ...viewport, games: games.length, passed: true });
    }
    assert.deepEqual(errors, []);
    report.consoleErrors = 0; report.pageErrors = 0; report.cdnRequests = 0;
    const hanzi = report.geometry.filter(m => m.pool === 'hanzi');
    const numbers = report.geometry.filter(m => m.pool === 'numbers');
    report.summary = {
      hanziUnique: new Set(hanzi.map(m => m.char)).size,
      hanziMaxCenterErrorPx: Math.max(...hanzi.flatMap(m => m.offset.map(Math.abs))),
      numberUnique: new Set(numbers.map(m => m.char)).size,
      numberMaxExtraOffsetPx: Math.max(...numbers.flatMap(m => m.extraOffset.map(Math.abs))),
      minimumMarginPx: Math.min(...report.geometry.flatMap(m => m.margins))
    };
    fs.writeFileSync(path.join(SHOTS, 'report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify({ summary: report.summary, largeViewports: report.largeViewports,
      checks: report.checks, consoleErrors: 0, pageErrors: 0, cdnRequests: 0, screenshots: SHOTS }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
