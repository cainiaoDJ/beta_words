const { chromium } = require('/tmp/node_modules/playwright/index.js');

// 直接用 viewport 不用 devices（避免 Playwright headless device profile 失效）
const TESTS = [
  { name: 'iPhone 13     (390x664)',  vp: { width: 390, height: 844 } },
  { name: 'iPhone SE 2nd (375x667)',  vp: { width: 375, height: 667 } },
  { name: 'iPhone 12 mini(375x812)',  vp: { width: 375, height: 812 } },
  { name: 'iPhone 8      (375x667)',  vp: { width: 375, height: 667 } },
  { name: 'Pixel 5       (393x851)',  vp: { width: 393, height: 851 } },
  { name: 'Small phone   (360x640)',  vp: { width: 360, height: 640 } },
  { name: 'Tiny phone    (320x568)',  vp: { width: 320, height: 568 } },
];
const GAMES = ['open-match', 'open-memory', 'open-pinyin-friend', 'open-listen-card', 'open-stroop-train'];
const SIZES = [3, 4, 5, 6, 7];

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

    const measure = (label) => page.evaluate((l) => ({
      label: l,
      d: document.documentElement.scrollHeight,
      v: window.innerHeight,
    }), label);

    results.push(await measure('lobby'));
    for (const g of GAMES) {
      await page.click('#' + g);
      await page.waitForTimeout(250);
      results.push(await measure(`setup:${g.replace('open-','')}`));

      // 测 3x3 / 5x5 / 7x7
      for (const sz of [3, 5, 7]) {
        await page.click(`button.difficulty[data-size="${sz}"]`);
        await page.waitForTimeout(500);
        results.push(await measure(`play:${g.replace('open-','')}:${sz}`));

        // 触发 complete panel
        await page.evaluate(() => {
          document.querySelector('#complete-panel').hidden = false;
          document.querySelector('#complete-time').textContent = '本次用时 00:42';
        });
        await page.waitForTimeout(150);
        results.push(await measure(`play:${g.replace('open-','')}:${sz}:complete`));

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
  console.log('=== Real Mobile Test Result ===');
  const fails = [];
  for (const r of results) {
    const ok = r.d <= r.v;
    const mark = ok ? '✅' : '❌';
    const overflow = r.d - r.v;
    console.log(`${mark} ${r.label.padEnd(40)} docH=${String(r.d).padStart(4)} vpH=${String(r.v).padStart(4)} overflow=${overflow}`);
    if (!ok) fails.push(r);
  }
  console.log('---');
  console.log(`Total: ${results.length}, Failed: ${fails.length}`);
  if (fails.length) {
    console.log('\n=== FAILS (按设备分组) ===');
    const byDevice = {};
    fails.forEach(f => {
      // 从 label 反推不出 device，我们用全局顺序
    });
    // 简单按 fails 的 device 信息（embedded in label 不行），改成：结果合并 device 信息
  }
})().catch(e => { console.error(e); process.exit(1); });
