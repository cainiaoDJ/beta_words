// scripts/mobile-one-screen-test.js
//
// 验证所有游戏状态在 7 个手机 viewport 下都一屏内可见、无滚动。
//
// 【2026-07-29 架构变更】UI 改用 GameStage 等比缩放（设计画布 360×640 + transform: scale(sf)）。
// 旧断言 document.documentElement.scrollHeight <= window.innerHeight 已失效：
//   - body { height: 100%; overflow: hidden } → docScrollH 恒等于 innerHeight，trivial pass
//   - 任何 UI 溢出都会被遮蔽但 docH 不会变
//
// 新断言（两个，必须同时满足才算通过）：
//   1. canvas fit viewport：.stage-canvas 的 getBoundingClientRect 完全在 [0,0,vpW,vpH] 内
//      （即缩放后的设计画布完整 fit 进实际视口，无超出屏幕）
//   2. 内部无溢出：.screen.active 的 scrollHeight <= 640（设计画布高度）
//      （即内部内容在设计坐标系下不溢出，缩放后不会被裁掉）
//
// 通过条件：上面两个都满足（任一失败 → 该状态 fail）。

const { chromium } = require('/tmp/node_modules/playwright/index.js');

// 直接用 viewport 不用 devices（避免 Playwright headless device profile 失效）
const TESTS = [
  { name: 'iPhone 13     (390x844)',  vp: { width: 390, height: 844 } },
  { name: 'iPhone SE 2nd (375x667)',  vp: { width: 375, height: 667 } },
  { name: 'iPhone 12 mini(375x812)',  vp: { width: 375, height: 812 } },
  { name: 'iPhone 8      (375x667)',  vp: { width: 375, height: 667 } },
  { name: 'Pixel 5       (393x851)',  vp: { width: 393, height: 851 } },
  { name: 'Small phone   (360x640)',  vp: { width: 360, height: 640 } },
  { name: 'Tiny phone    (320x568)',  vp: { width: 320, height: 568 } },
];
const GAMES = ['open-match', 'open-memory', 'open-pinyin-friend', 'open-listen-card', 'open-stroop-train'];
const DESIGN_W = 360;
const DESIGN_H = 640;

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const t of TESTS) {
    const ctx = await browser.newContext({
      viewport: t.vp,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.goto('http://192.168.31.60:8091/', { waitUntil: 'networkidle' });

    const measure = (label) => page.evaluate((args) => {
      const canvas = document.querySelector('.stage-canvas');
      const screen = document.querySelector('.screen.active');
      if (!canvas) return { label: args.label, error: 'no .stage-canvas' };
      const cr = canvas.getBoundingClientRect();
      return {
        label: args.label,
        vpW: window.innerWidth,
        vpH: window.innerHeight,
        canvasH: cr.height,
        canvasW: cr.width,
        canvasTop: cr.top,
        canvasBottom: cr.bottom,
        canvasLeft: cr.left,
        canvasRight: cr.right,
        screenH_design: screen ? screen.scrollHeight : 0,
        designH: args.designH,
      };
    }, { label, designH: DESIGN_H });

    results.push({ device: t.name, ...(await measure('lobby')) });
    for (const g of GAMES) {
      await page.click('#' + g);
      await page.waitForTimeout(250);
      results.push({ device: t.name, ...(await measure(`setup:${g.replace('open-','')}`)) });

      // 测 3x3 / 5x5 / 7x7
      for (const sz of [3, 5, 7]) {
        await page.click(`button.difficulty[data-size="${sz}"]`);
        await page.waitForTimeout(500);
        results.push({ device: t.name, ...(await measure(`play:${g.replace('open-','')}:${sz}`)) });

        // 触发 complete panel（fixed overlay，不影响 .screen.active 高度）
        await page.evaluate(() => {
          document.querySelector('#complete-panel').hidden = false;
          document.querySelector('#complete-time').textContent = '本次用时 00:42';
        });
        await page.waitForTimeout(150);
        results.push({ device: t.name, ...(await measure(`play:${g.replace('open-','')}:${sz}:complete`)) });

        await page.click('button[data-action="back-setup"]');
        await page.waitForTimeout(150);
      }
      await page.click('button[data-action="back-lobby"]');
      await page.waitForTimeout(150);
    }
    await ctx.close();
  }
  await browser.close();

  // 输出
  console.log('=== Real Mobile Test Result (GameStage, 2026-07-29 新断言) ===');
  const fails = [];
  for (const r of results) {
    if (r.error) {
      console.log(`❌ ${r.label.padEnd(40)} [${r.device}] ERROR: ${r.error}`);
      fails.push(r);
      continue;
    }
    const EPS = 0.5; // 半像素容忍
    const fitTop    = r.canvasTop >= -EPS;
    const fitBottom = r.canvasBottom <= r.vpH + EPS;
    const fitLeft   = r.canvasLeft >= -EPS;
    const fitRight  = r.canvasRight <= r.vpW + EPS;
    const fitOK     = fitTop && fitBottom && fitLeft && fitRight;
    const designOK  = r.screenH_design <= r.designH;
    const ok        = fitOK && designOK;

    const mark = ok ? '✅' : '❌';
    const detail = ok ? '' :
      (!fitOK ? ` fitFail top=${r.canvasTop.toFixed(1)} bot=${r.canvasBottom.toFixed(1)}/vpH=${r.vpH} left=${r.canvasLeft.toFixed(1)} right=${r.canvasRight.toFixed(1)}/vpW=${r.vpW}` : '') +
      (!designOK ? ` designOverflow=${r.screenH_design}/${r.designH}` : '');

    console.log(`${mark} [${r.device.padEnd(20)}] ${r.label.padEnd(36)} canvas=${r.canvasW.toFixed(0)}x${r.canvasH.toFixed(0)} vpH=${r.vpH} designH=${r.screenH_design}/${r.designH}${detail}`);
    if (!ok) fails.push(r);
  }
  console.log('---');
  console.log(`Total: ${results.length}, Failed: ${fails.length}`);
  if (fails.length) {
    console.log('\n=== FAILS ===');
    for (const f of fails) {
      console.log(`  [${f.device}] ${f.label}`);
      if (f.error) console.log(`    error: ${f.error}`);
      else {
        if (f.canvasTop < -0.5 || f.canvasBottom > f.vpH + 0.5 || f.canvasLeft < -0.5 || f.canvasRight > f.vpW + 0.5) {
          console.log(`    fit: top=${f.canvasTop.toFixed(1)} bot=${f.canvasBottom.toFixed(1)} left=${f.canvasLeft.toFixed(1)} right=${f.canvasRight.toFixed(1)} / vp ${f.vpW}x${f.vpH}`);
        }
        if (f.screenH_design > f.designH) {
          console.log(`    design overflow: ${f.screenH_design} > ${f.designH} (overflow ${f.screenH_design - f.designH})`);
        }
      }
    }
  }
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
