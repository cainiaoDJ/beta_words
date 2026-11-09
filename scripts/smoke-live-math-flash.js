// 公网线上冒烟：直连 https://sophie520.top/games/ 验证算术闪卡新版本
// 这是部署验收脚本，留在仓库 scripts/ 下，下轮部署可复用
const { chromium } = require("/tmp/node_modules/playwright");

const BASE = process.env.BASE_URL || "https://sophie520.top/games/";

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("console.error: " + m.text()); });

  const fail = [];
  const chk = (n, c, e) => { console.log((c ? "  ok   " : "  FAIL ") + n + (c || e === undefined ? "" : "  << " + e)); if (!c) fail.push(n); };

  await page.goto(BASE, { waitUntil: "networkidle", timeout: 45000 });

  // ---- A. 新 API 在线上真的存在且可调用 ----
  const api = await page.evaluate(() => ({
    buildDeck: typeof window.MathFlashEngine?.buildDeck,
    calcStarsByTime: typeof window.MathFlashEngine?.calcStarsByTime,
    calcTrophyByStars: typeof window.MathFlashEngine?.calcTrophyByStars,
    getStarThresholds: typeof window.MathFlashEngine?.getStarThresholds,
    updateMathTimerDisplay: typeof window.updateMathTimerDisplay,
    // 旧 API 必须消失
    oldSubmitTimeout: typeof window.MathFlashEngine?.submitTimeout,
    oldCalcStars: typeof window.MathFlashEngine?.calcStars
  }));
  console.log("  线上 API: " + JSON.stringify(api));
  chk("buildDeck 可调用", api.buildDeck === "function");
  chk("calcStarsByTime 可调用", api.calcStarsByTime === "function");
  chk("calcTrophyByStars 可调用", api.calcTrophyByStars === "function");
  chk("getStarThresholds 可调用", api.getStarThresholds === "function");
  chk("updateMathTimerDisplay 可调用", api.updateMathTimerDisplay === "function");
  chk("旧 submitTimeout 已移除", api.oldSubmitTimeout === "undefined");
  chk("旧 calcStars(wrongCount) 已移除", api.oldCalcStars === "undefined");

  // ---- B. 线上引擎算出的牌堆与题量 ----
  const deck = await page.evaluate(() => {
    const E = window.MathFlashEngine;
    const out = {};
    for (const size of [3, 4, 5, 6]) {
      const d = E.buildDeck(size);
      const keys = new Set(d.map(c => c.a + "-" + c.b));
      out[size] = { len: d.length, uniq: keys.size };
    }
    out.thresholds = { s66: E.getStarThresholds(66), s45: E.getStarThresholds(45) };
    out.star45 = [89999, 90000, 90001].map(ms => E.calcStarsByTime(ms, 45));
    out.trophy = [1, 2, 3].map(s => E.calcTrophyByStars(s));
    out.levels = Object.fromEntries(Object.entries(E.LEVELS).map(([k, v]) => [k, v.sub]));
    return out;
  });
  console.log("  线上牌堆: " + JSON.stringify(deck));
  chk("L3 牌堆 66 张且不重复", deck[3].len === 66 && deck[3].uniq === 66);
  chk("L4 牌堆 66 张且不重复", deck[4].len === 66 && deck[4].uniq === 66);
  chk("L5 牌堆 45 张且不重复", deck[5].len === 45 && deck[5].uniq === 45);
  chk("L6 牌堆 45 张且不重复", deck[6].len === 45 && deck[6].uniq === 45);
  chk("阈值 66 张 132000/219978", deck.thresholds.s66.three === 132000 && deck.thresholds.s66.two === 219978);
  chk("阈值 45 张 90000/149985", deck.thresholds.s45.three === 90000 && deck.thresholds.s45.two === 149985);
  chk("评星边界 45 张 3/3/2", deck.star45.join(",") === "3,3,2", deck.star45.join(","));
  chk("奖杯 1/2/3 = bronze/silver/gold", deck.trophy.join(",") === "bronze,silver,gold", deck.trophy.join(","));
  chk("关卡文案含 66 题 / 45 题",
    deck.levels["3"].includes("66 题") && deck.levels["4"].includes("66 题") &&
    deck.levels["5"].includes("45 题") && deck.levels["6"].includes("45 题"),
    JSON.stringify(deck.levels));

  // ---- C. 移除项确实消失（feature retirement）----
  await page.click("#open-math-flash");
  await page.waitForTimeout(400);
  chk("困难模式行已从 DOM 移除", await page.locator("#math-hard-row").count() === 0);
  chk("困难模式开关已移除", await page.locator("#math-hard-toggle").count() === 0);
  chk("困难模式 localStorage key 不再写入", await page.evaluate(() =>
    !Object.keys(localStorage).some(k => k.includes("mathflash_hard"))));

  // ---- D. 真交互：选关 → 跑一整局 45 张 ----
  await page.click('#setup .difficulty[data-size="6"]');
  await page.waitForTimeout(500);
  chk("卡片计时条不可见（DOM 保留但 hidden）",
    await page.evaluate(() => {
      const el = document.querySelector(".math-card__timer");
      return !el || el.hidden || getComputedStyle(el).display === "none";
    }));

  const seen = [];
  for (let i = 0; i < 45; i++) {
    await page.waitForFunction(() => {
      const b = document.querySelectorAll("#math-options button");
      return b.length === 4 && ![...b].some(x => x.disabled);
    }, { timeout: 20000 });
    const eq = (await page.locator(".math-card:last-child .math-eq").innerText()).replace(/\s+/g, "");
    seen.push(eq);
    const nums = eq.match(/\d+/g).map(Number);
    const ans = eq.includes("+") ? nums[0] + nums[1] : nums[0] - nums[1];
    const btns = page.locator("#math-options button");
    for (let k = 0; k < 4; k++) {
      if (parseInt((await btns.nth(k).innerText()).trim(), 10) === ans) { await btns.nth(k).click(); break; }
    }
  }
  chk("线上整局出满 45 个算式", seen.length === 45, String(seen.length));
  chk("线上 45 个算式互不相同", new Set(seen).size === 45, String(new Set(seen).size));

  await page.waitForSelector("#complete-panel:not([hidden])", { timeout: 20000 });
  await page.waitForTimeout(900);   // 等星星/奖杯动画（200/400/600ms 延迟）

  const stats = (await page.locator("#complete-stats").innerText()).replace(/\s+/g, " ").trim();
  const rec = (await page.locator("#best-record").innerText()).trim();
  const title = (await page.locator(".complete-title").innerText()).trim();
  console.log("  线上完成统计: " + JSON.stringify(stats));
  console.log("  线上最佳记录: " + JSON.stringify(rec));
  console.log("  线上完成标题: " + JSON.stringify(title));
  chk("统计含 答对 45 / 45", stats.includes("答对 45 / 45"), stats);
  chk("统计含 用时", /用时 \d{2}:\d{2}/.test(stats), stats);
  chk("记录行含 错 N 题", /错 \d+ 题/.test(rec), rec);
  chk("标题是三档之一", ["完成啦！", "稳稳的！", "太快啦！"].includes(title), title);

  // 完成面板统计在 320px 小屏不折行
  // 注意：stage.js 对 360x640 设计画布做 transform: scale，getBoundingClientRect 返回的是
  // 缩放后的屏幕像素，必须除以 scale 才是逻辑布局宽度；行盒数与 offsetHeight 不受 transform 影响。
  const lay = await page.evaluate(() => {
    const el = document.querySelector("#complete-stats");
    const canvas = document.querySelector(".stage-canvas");
    // getComputedStyle 返回的是 matrix(a,b,c,d,e,f)，x 缩放 = a；不是 scale(...) 形式
    const tm = getComputedStyle(canvas).transform;
    const mm = /matrix\(([-\d.]+)/.exec(tm);
    const sf = mm ? parseFloat(mm[1]) : 1;
    const range = document.createRange();
    range.selectNodeContents(el);
    const boxes = [...range.getClientRects()].filter(b => b.width > 0);
    const tops = [...new Set(boxes.map(b => Math.round(b.top)))];
    const lh = parseFloat(getComputedStyle(el).lineHeight);
    return {
      sf,
      fs: getComputedStyle(el).fontSize,
      sw: el.scrollWidth, cw: el.clientWidth,
      offsetH: el.offsetHeight, lh,
      lineBoxes: tops.length,
      layoutLines: Math.round(el.offsetHeight / lh),
      logicalWidths: tops.map(t => Math.round(Math.max(...boxes.filter(b => Math.round(b.top) === t).map(b => b.width)) / sf))
    };
  });
  console.log("  线上统计布局: " + JSON.stringify(lay));
  chk("线上统计用 24px 专用字号", lay.fs === "24px", lay.fs);
  chk("线上统计不横向溢出", lay.sw <= lay.cw + 1, lay.sw + " > " + lay.cw);
  chk("线上统计为 2 行（未折行）", lay.lineBoxes === 2 && lay.layoutLines === 2, JSON.stringify(lay));
  chk("线上每行逻辑宽度未超容器", Math.max(...lay.logicalWidths) <= lay.cw, JSON.stringify(lay.logicalWidths) + " vs " + lay.cw);

  // ---- E. 其它游戏没被带坏（回归抽样）----
  await page.locator('[data-action="back-lobby"]:visible').last().click().catch(() => {});
  await page.waitForTimeout(500);
  await page.click("#open-match");
  await page.waitForTimeout(400);
  await page.click('#setup .difficulty[data-size="3"]');
  await page.waitForTimeout(700);
  const matchOk = await page.evaluate(() => {
    const b = document.querySelectorAll("#board button, .tile");
    return { board: b.length, bestRecordText: document.querySelector("#best-record").textContent.trim() };
  });
  console.log("  配对游戏: " + JSON.stringify(matchOk));
  chk("配对游戏棋盘正常渲染", matchOk.board > 0, String(matchOk.board));
  chk("玩别的游戏后记录行复位为 新纪录！", matchOk.bestRecordText === "新纪录！", matchOk.bestRecordText);

  chk("全程无 JS 错误", errors.length === 0, errors.join(" | "));

  await browser.close();
  console.log(fail.length === 0 ? "\n公网冒烟：全部通过 ✅" : "\n失败 " + fail.length + " 项 ❌: " + fail.join(", "));
  process.exit(fail.length === 0 ? 0 : 1);
})().catch(e => { console.error("异常:", e.message); process.exit(1); });
