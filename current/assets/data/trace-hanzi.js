// =====================================================================
// trace-hanzi.js — 田字格描红 · 第 3 池（"更多字"，setup 文字覆写为 "汉字 / 一年级上"）
//
// 数据源：人教版小学数学一年级上册数字教学单元（0-9 全部）
// 内容：阿拉伯数字 0-9（与 size=3 的 1-10 互补，方便覆盖到 0）
//
// 笔画模板与 trace-numbers.js 共用 digits 定义（避免重复）。
// 坐标系：viewBox 0 0 1024 1024，Y-up（数学约定），渲染时由 .trace-flip <g> 翻转 Y 轴
//
// 整理日期：2026-09-22
// =====================================================================

window.TRACE_HANZI = window.TRACE_HANZI || (function () {

  // 与 trace-numbers.js 复用 digits 模板（直接拷贝相同定义，确保独立模块也能工作）
  const digits = {
    "0": { strokes: ["M 312 492 C 312 742, 712 742, 712 492 C 712 242, 312 242, 312 492 Z"], medians: [[312, 492]] },
    "1": { strokes: ["M 592 742 L 512 772 L 512 252"], medians: [[592, 742]] },
    "2": { strokes: ["M 712 692 Q 712 742 612 742 L 412 742 Q 312 742 312 642 Q 312 542 512 442 L 712 252 L 312 252"], medians: [[712, 692]] },
    "3": { strokes: ["M 712 702 Q 612 742 492 742 Q 312 742 312 612 Q 312 522 492 472 Q 312 472 312 342 Q 312 212 492 212 Q 632 212 712 272"], medians: [[712, 702]] },
    "4": { strokes: ["M 412 742 L 612 742 L 612 252", "M 412 742 L 412 252"], medians: [[412, 742], [412, 742]] },
    "5": { strokes: ["M 312 252 L 612 252 L 612 542 Q 512 542 412 522 Q 312 502 312 382 Q 312 252 492 252 Q 692 252 712 312"], medians: [[312, 252]] },
    "6": { strokes: ["M 412 702 Q 712 702 712 492 Q 712 252 512 252 Q 312 252 312 392 Q 312 522 412 522 Q 612 522 612 392"], medians: [[412, 702]] },
    "7": { strokes: ["M 712 742 L 312 742 L 612 252"], medians: [[712, 742]] },
    "8": { strokes: ["M 412 592 Q 412 742 512 742 Q 612 742 612 592 Q 612 492 512 492 Q 412 492 412 592 Z", "M 312 312 Q 312 492 412 492 Q 512 492 612 492 Q 712 492 712 312 Q 712 212 512 212 Q 312 212 312 312 Z"], medians: [[412, 592], [312, 312]] },
    "9": { strokes: ["M 412 262 Q 312 262 312 392 Q 312 592 412 692 Q 512 792 612 692 Q 712 592 712 392 Q 712 262 612 262 Q 512 262 512 392"], medians: [[412, 262]] }
  };

  function getStrokeSpec(charKey) {
    const tpl = digits[charKey];
    if (!tpl) return null;
    return {
      strokes: tpl.strokes.slice(),
      medians: tpl.medians.map(m => m.slice())
    };
  }

  const items = [
    { display: "0", pinyin: "líng", pool: "hanzi", charKey: "0" },
    { display: "1", pinyin: "yī",   pool: "hanzi", charKey: "1" },
    { display: "2", pinyin: "èr",   pool: "hanzi", charKey: "2" },
    { display: "3", pinyin: "sān",  pool: "hanzi", charKey: "3" },
    { display: "4", pinyin: "sì",   pool: "hanzi", charKey: "4" },
    { display: "5", pinyin: "wǔ",   pool: "hanzi", charKey: "5" },
    { display: "6", pinyin: "liù",  pool: "hanzi", charKey: "6" },
    { display: "7", pinyin: "qī",   pool: "hanzi", charKey: "7" },
    { display: "8", pinyin: "bā",   pool: "hanzi", charKey: "8" },
    { display: "9", pinyin: "jiǔ",  pool: "hanzi", charKey: "9" }
  ];

  return {
    id: "hanzi",
    name: "汉字",
    subtitle: "0-9 / 阿拉伯数字",
    hint: "描一描阿拉伯数字 0-9",
    items,
    getStrokeSpec
  };
})();
