// scripts/mobile-one-screen-test.js
//
// 验证所有游戏状态在 7 个手机 viewport 下都一屏内可见、无滚动 + Zone Framework 应用正确。
//
// 断言（三个，必须同时满足才算通过）：
//   1. canvas fit viewport：.stage-canvas 的 getBoundingClientRect 完全在 [0,0,vpW,vpH] 内
//      （即缩放后的设计画布完整 fit 进实际视口，无超出屏幕）
//   2. 内部无溢出：.screen.active 的 scrollHeight <= 640（设计画布高度）
//      （即内部内容在设计坐标系下不溢出，缩放后不会被裁掉）
//   3. 【Zone 维度】play 状态下：
//      - .zone-primary 必须存在且数量符合游戏预期（match/memory/quiz/stroop 各异）
//      - .zone-primary 必须 visible（width/height > 0）
//      - .zone-primary 必须 fit canvas（不超出画布边界）
//
// Zone Framework 详见 AGENTS.md《迭代开发方法论》feat/unified-game-zones。
// Zone 预期数量（与 index.html 各游戏的 DOM 结构对应）：
//   match/memory/stroop/quiz 都至少 1 个 .zone-primary（棋盘或题目卡）
//   quiz 类（pinyin-friend + listen-card）多 1 个 .zone-secondary（选项网格）
//   stroop-train 多 1 个 .zone-secondary（待选区）+ 1 个 .zone-toolbar（颜色条）

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

// Zone 预期数量（按游戏）
const ZONE_EXPECT = {
  'match':         { primary: 1, secondary: 0, toolbar: 0 },
  'memory':        { primary: 1, secondary: 0, toolbar: 0 },
  'pinyin-friend': { primary: 1, secondary: 1, toolbar: 0 },
  'listen-card':   { primary: 1, secondary: 1, toolbar: 0 },
  'stroop-train':  { primary: 1, secondary: 1, toolbar: 1 },
};

// 从 label 解析 phase/game/size
function parseLabel(label) {
  if (label === 'lobby') return { phase: 'lobby' };
  if (label.startsWith('setup:')) return { phase: 'setup', game: label.slice(6) };
  const m = label.match(/^play:(\w+):(\d+)(?::(\w+))?$/);
  if (m) return { phase: 'play', game: m[1], size: +m[2], sub: m[3] || null };
  return null;
}

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
      // 只统计可见的 zone（hidden 父容器的子元素也要排除）
      const isVisible = (el) => {
        if (!el) return false;
        if (el.hidden) return false;
        // 检查祖先链是否有 hidden 的父
        let p = el.parentElement;
        while (p && p !== document.body) {
          if (p.hidden) return false;
          p = p.parentElement;
        }
        return el.offsetWidth > 0 && el.offsetHeight > 0;
      };
      const visZones = (sel) => {
        if (!screen) return [];
        return [...screen.querySelectorAll(sel)].filter(isVisible);
      };
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: r.width, h: r.height, l: r.left, r: r.right, t: r.top, b: r.bottom };
      };
      const primaryV   = visZones('.zone-primary');
      const secondaryV = visZones('.zone-secondary');
      const toolbarV   = visZones('.zone-toolbar');
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
        primaryCount:   primaryV.length,
        secondaryCount: secondaryV.length,
        toolbarCount:   toolbarV.length,
        primaryRect:    primaryV[0]   ? rect(primaryV[0])   : null,
        secondaryRect:  secondaryV[0] ? rect(secondaryV[0]) : null,
        toolbarRect:    toolbarV[0]   ? rect(toolbarV[0])   : null,
      };
    }, { label, designH: DESIGN_H });

    results.push({ device: t.name, ...(await measure('lobby')) });
    for (const g of GAMES) {
      await page.click('#' + g);
      await page.waitForTimeout(250);
      results.push({ device: t.name, ...(await measure(`setup:${g.replace('open-','')}`)) });

      for (const sz of [3, 5, 7]) {
        await page.click(`button.difficulty[data-size="${sz}"]`);
        await page.waitForTimeout(500);
        results.push({ device: t.name, ...(await measure(`play:${g.replace('open-','')}:${sz}`)) });

        // 触发 complete panel（fixed overlay，不影响 .screen.active 高度和 zone 结构）
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
  console.log('=== Real Mobile Test Result (GameStage + Zone, 2026-07-29) ===');
  const fails = [];
  for (const r of results) {
    if (r.error) {
      console.log(`❌ ${r.label.padEnd(40)} [${r.device}] ERROR: ${r.error}`);
      fails.push(r);
      continue;
    }
    const EPS = 0.5;

    // 断言 1: canvas fit viewport
    const fitTop    = r.canvasTop    >= -EPS;
    const fitBottom = r.canvasBottom <= r.vpH + EPS;
    const fitLeft   = r.canvasLeft   >= -EPS;
    const fitRight  = r.canvasRight  <= r.vpW + EPS;
    const fitOK     = fitTop && fitBottom && fitLeft && fitRight;

    // 断言 2: 内部无溢出
    const designOK = r.screenH_design <= r.designH;

    // 断言 3: Zone 维度
    let zoneOK = true;
    const zoneFails = [];
    const parsed = parseLabel(r.label);
    if (parsed && parsed.phase === 'play' && parsed.game && ZONE_EXPECT[parsed.game]) {
      const exp = ZONE_EXPECT[parsed.game];
      if (r.primaryCount !== exp.primary) {
        zoneOK = false;
        zoneFails.push(`primaryCount=${r.primaryCount} expected=${exp.primary}`);
      }
      if (exp.secondary > 0 && r.secondaryCount !== exp.secondary) {
        zoneOK = false;
        zoneFails.push(`secondaryCount=${r.secondaryCount} expected=${exp.secondary}`);
      }
      if (exp.toolbar > 0 && r.toolbarCount !== exp.toolbar) {
        zoneOK = false;
        zoneFails.push(`toolbarCount=${r.toolbarCount} expected=${exp.toolbar}`);
      }
      // primary 必须可见且 fit canvas
      if (exp.primary > 0 && r.primaryRect) {
        if (r.primaryRect.w === 0 || r.primaryRect.h === 0) {
          zoneOK = false;
          zoneFails.push(`primary zero size ${r.primaryRect.w}x${r.primaryRect.h}`);
        } else if (r.primaryRect.l < r.canvasLeft - EPS || r.primaryRect.r > r.canvasRight + EPS) {
          zoneOK = false;
          zoneFails.push(`primary outside canvas L=${r.primaryRect.l.toFixed(1)} R=${r.primaryRect.r.toFixed(1)} / canvas L=${r.canvasLeft.toFixed(1)} R=${r.canvasRight.toFixed(1)}`);
        }
      }
    }

    const ok = fitOK && designOK && zoneOK;
    const mark = ok ? '✅' : '❌';

    // zone info
    const zoneInfo = parsed && parsed.phase === 'play' && r.primaryRect
      ? ` zone[p${r.primaryCount},s${r.secondaryCount},t${r.toolbarCount} ${r.primaryRect.w.toFixed(0)}x${r.primaryRect.h.toFixed(0)}]`
      : (parsed && parsed.phase === 'play' ? ` zone[p${r.primaryCount},s${r.secondaryCount},t${r.toolbarCount} null]` : '');

    let detail = '';
    if (!fitOK) detail += ` fitFail top=${r.canvasTop.toFixed(1)} bot=${r.canvasBottom.toFixed(1)}/vpH=${r.vpH} left=${r.canvasLeft.toFixed(1)} right=${r.canvasRight.toFixed(1)}/vpW=${r.vpW}`;
    if (!designOK) detail += ` designOverflow=${r.screenH_design}/${r.designH}`;
    if (!zoneOK) detail += ` zoneFail: ${zoneFails.join('; ')}`;

    console.log(`${mark} [${r.device.padEnd(20)}] ${r.label.padEnd(36)} canvas=${r.canvasW.toFixed(0)}x${r.canvasH.toFixed(0)} vpH=${r.vpH} designH=${r.screenH_design}/${r.designH}${zoneInfo}${detail}`);
    if (!ok) fails.push(r);
  }
  console.log('---');
  console.log(`Total: ${results.length}, Failed: ${fails.length}`);
  if (fails.length) {
    console.log('\n=== FAILS ===');
    for (const f of fails) {
      console.log(`  [${f.device}] ${f.label}`);
      if (f.error) {
        console.log(`    error: ${f.error}`);
      } else {
        if (f.canvasTop < -0.5 || f.canvasBottom > f.vpH + 0.5 || f.canvasLeft < -0.5 || f.canvasRight > f.vpW + 0.5) {
          console.log(`    fit: top=${f.canvasTop.toFixed(1)} bot=${f.canvasBottom.toFixed(1)} left=${f.canvasLeft.toFixed(1)} right=${f.canvasRight.toFixed(1)} / vp ${f.vpW}x${f.vpH}`);
        }
        if (f.screenH_design > f.designH) {
          console.log(`    design overflow: ${f.screenH_design} > ${f.designH} (overflow ${f.screenH_design - f.designH})`);
        }
        const parsed = parseLabel(f.label);
        if (parsed && parsed.phase === 'play' && parsed.game && ZONE_EXPECT[parsed.game]) {
          const exp = ZONE_EXPECT[parsed.game];
          if (f.primaryCount !== exp.primary) console.log(`    zone primaryCount=${f.primaryCount} expected=${exp.primary}`);
          if (exp.secondary > 0 && f.secondaryCount !== exp.secondary) console.log(`    zone secondaryCount=${f.secondaryCount} expected=${exp.secondary}`);
          if (exp.toolbar > 0 && f.toolbarCount !== exp.toolbar) console.log(`    zone toolbarCount=${f.toolbarCount} expected=${exp.toolbar}`);
          if (exp.primary > 0 && f.primaryRect) {
            if (f.primaryRect.w === 0 || f.primaryRect.h === 0) {
              console.log(`    zone primary zero size`);
            } else if (f.primaryRect.l < f.canvasLeft - 0.5 || f.primaryRect.r > f.canvasRight + 0.5) {
              console.log(`    zone primary outside canvas: L=${f.primaryRect.l.toFixed(1)} R=${f.primaryRect.r.toFixed(1)} / canvas L=${f.canvasLeft.toFixed(1)} R=${f.canvasRight.toFixed(1)}`);
            }
          }
        }
      }
    }
  }
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
