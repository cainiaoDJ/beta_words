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
    "0": { strokes: ["M 312 532 C 312 742, 712 742, 712 492 C 712 242, 312 242, 312 492 Z"], medians: [[312, 492]] },
    "1": { strokes: ["M 592 282 L 512 252 L 512 772"], medians: [[592, 742]] },
    "2": { strokes: ["M 712 332 712 282 612 282 L 412 282 312 282 312 382 312 482 512 582 L 712 772 L 312 772"], medians: [[712, 692]] },
    "3": { strokes: ["M 712 322 612 282 492 282 312 282 312 412 312 502 492 552 312 552 312 682 312 812 492 812 632 812 712 752"], medians: [[712, 702]] },
    "4": { strokes: ["M 412 282 L 612 282 L 612 772", "M 412 282 L 412 772"], medians: [[412, 742], [412, 742]] },
    "5": { strokes: ["M 312 772 L 612 772 L 612 482 512 482 412 502 312 522 312 642 312 772 492 772 692 772 712 712"], medians: [[312, 252]] },
    "6": { strokes: ["M 412 322 712 322 712 532 712 772 512 772 312 772 312 632 312 502 412 502 612 502 612 632"], medians: [[412, 702]] },
    "7": { strokes: ["M 712 282 L 312 282 L 612 772"], medians: [[712, 742]] },
    "8": { strokes: ["M 412 432 412 282 512 282 612 282 612 432 612 532 512 532 412 532 412 432 Z", "M 312 712 312 532 412 532 512 532 612 532 712 532 712 712 712 812 512 812 312 812 312 712 Z"], medians: [[412, 592], [312, 312]] },
    "10": {
      strokes: [
        "M 264 282 L 360 252 L 360 772",
        "M 452 532 C 452 742, 692 742, 692 492 C 692 242, 452 242, 452 492 Z"
      ],
      medians: [[264, 282], [452, 532]]
    },
    "9": { strokes: ["M 412 762 312 762 312 632 312 432 412 332 512 232 612 332 712 432 712 632 712 762 612 762 512 762 512 632"], medians: [[412, 262]] }
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
