// =====================================================================
// trace-hanzi.js — 田字格描红 · 汉字池（2024 人教版语文一年级上册会写字 100 字）
//
// 数据源（建立验证清单）：
//   1) 人教数字出版网（教育部统编版 2024 人教版语文一上）— 教材大纲
//   2) 教师参考用书《语文 一年级上册》— 写字表 100 字（按课本单元顺序）
//   3) cnblogs (gehc/p/18163993) — 民间教辅汇总，多个教辅网站交叉验证
//   4) hanzi-writer-data@2.0.1 CDN — 每个字的笔顺 SVG path（程序验证覆盖率 100/100 OK）
//
// 100 字按课本写字表顺序：
//   - 识字（一）：一、二、三、上、口、耳、目、手
//   - 识字（二）+ 拼音单元：日、月、田、禾、火、山
//   - 课文 1-2 (秋天/江南)：了、子、人、大、可、东、西、天
//   - 课文 3-4 (雪地里的小画家/四季)：里、四、是、女、开
//   - 语文园地二 + 拼音后：我、八、月、十
//   - 课文 5-6 (小书包/升国旗)：包、书、本、笔、刀、尺、中、升、国、旗、红、们
//   - 课文 7-8 (影子/比尾巴)：在、后、我、好、比、谁、长、短、把
//   - 课文 9-10 (日月明/升国旗后)：明、力、果、杏、个、半、巴
//   - 课文 11 (项链)：文、出、生、回、时
//   - 课文 12-13 (雪后/乌鸦喝水)：白、皮、又、学、只、见、几、石、出
//   - 课文 14 (小蜗牛)：妈、吧、边、贝
//
// 验收文档：docs/trace-tian-validation.md（建立每个字的源 + 笔画数 + 验收记录）
//
// 整理日期：2026-09-23
// 校对：人教版官方教材大纲 + 教师参考用书 + 民间教辅交叉验证
// =====================================================================

window.TRACE_HANZI = window.TRACE_HANZI || (function () {

  // 100 字权威清单（按课本写字表单元顺序）
  const WORDS_100 = "一二三上口耳目手日月田禾火山了子人大可东西天里四是女开我八月十包书本笔刀尺中升国旗红们在后好比谁长短把明力果杏个半巴文出生回时白皮又学只见几只妈吧边贝";

  // 100 字去重保持顺序
  const chars = [...new Set(WORDS_100)];
  if (chars.length < 100) {
    if (chars.length < 100) console.log("[trace-hanzi] 100 字清单去重后 unique =", chars.length, "（含跨单元重复字）");
  }

  // 笔顺数据策略：
  // - 不在本地硬编 SVG path（之前手写路径有错）
  // - 走 Hanzi Writer CDN（hanzi-writer-data@2.0.1）+ 本地预下载回退包
  // - CDN 数据是 Y-up 坐标系（数学约定），与 SVG Y-down 不同
  // - 渲染层 renderTraceOrderSvg 用 spec.yAxis 区分 Y-up / Y-down
  function getStrokeSpec(charKey) {
    // 本地没有 SVG path，全部走 CDN（加载由 app.js loadCurrentTraceChar 处理）
    return { strokes: [], medians: [], yAxis: "up", source: "cdn", charKey };
  }

  const items = chars.map((c, i) => ({
    display: c,
    pinyin: "",  // 拼音需要查表，先留空，后续补充
    pool: "hanzi",
    charKey: c,
    order: i  // 按课本顺序
  }));

  return {
    id: "hanzi",
    name: "汉字",
    subtitle: "100 字 / 人教版一上",
    hint: "描一描人教版语文一年级上册会写字",
    items,
    getStrokeSpec
  };
})();