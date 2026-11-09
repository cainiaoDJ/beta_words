// 浏览器端真实点击跑完 45 张退位减法牌堆，不跳过反馈或修改游戏状态。
const assert = require("node:assert/strict");
const { chromium } = require("/tmp/node_modules/playwright/index.js");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4174/";

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
    const pageErrors = [];
    const consoleErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page.goto(BASE_URL, { waitUntil: "networkidle" });
    await page.locator("#open-math-flash").click();
    assert.equal(await page.locator("#math-hard-row").count(), 0, "选关页不应保留困难模式");
    await page.locator('button.difficulty[data-size="6"]').click();
    const seen = new Set();
    for (let index = 0; index < 45; index++) {
      // 按真实题号和按钮可用状态轮询，避免在上一题反馈期间重复点击。
      await page.waitForFunction((number) => {
        const buttons = [...document.querySelectorAll("#math-options button")];
        return document.querySelector("#progress").textContent === `${number} / 45` &&
          buttons.length === 4 && buttons.every((button) => !button.disabled);
      }, index + 1);
      const card = page.locator("#math-host .math-card").last();
      const equation = (await card.locator(".math-eq").textContent()).replace(/\s/g, "");
      assert.ok(!seen.has(equation), `第 ${index + 1} 题重复：${equation}`);
      seen.add(equation);
      const match = equation.match(/^(\d+)−(\d+)=\?$/);
      assert.ok(match, `算式格式错误：${equation}`);
      assert.ok(!(await card.locator(".math-card__badge").textContent()).includes("困难"));
      assert.equal(await card.locator(".math-card__timer").isVisible(), false);
      const answer = Number(match[1]) - Number(match[2]);
      await page.locator(`#math-options button[data-value="${answer}"]`).click();
    }
    await page.locator("#complete-panel").waitFor({ state: "visible" });
    assert.equal(seen.size, 45);
    const expected = new Set();
    for (let answer = 1; answer <= 9; answer++) {
      for (let a = 10; a <= answer + 9; a++) expected.add(`${a}−${a - answer}=?`);
    }
    assert.deepEqual([...seen].sort(), [...expected].sort(), "整局必须恰好出完教材表全集");
    const stats = await page.locator("#complete-stats").textContent();
    assert.ok(stats.includes("答对 45 / 45（100%）"));
    assert.equal(await page.locator("#best-record").isVisible(), true);
    const record = await page.locator("#best-record").textContent();
    assert.match(record, /^(?:最快 |新纪录！)\d{2}:\d{2} · 错 0 题$/);
    assert.deepEqual(pageErrors, [], "页面运行错误");
    assert.deepEqual(consoleErrors, [], "控制台错误");
    console.log("✅ 整局跑通：45 / 45 个不同算式，与教材表全集一致");
    console.log(`✅ 完成统计：${stats.replace(/\n/g, "；")}`);
    console.log(`✅ 最佳记录：${record}`);
    console.log("✅ 无困难模式行，badge 无困难，卡片计时条不可见，HUD 进度为 N / 45");
    console.log(`✅ pageerror: ${pageErrors.length}，console.error: ${consoleErrors.length}`);
    console.log("整局测试：通过，失败 0");
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(`❌ 整局测试失败：${error.stack || error.message}`);
  process.exitCode = 1;
});
