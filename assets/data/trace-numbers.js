// =====================================================================
// trace-numbers.js — 田字格描红 · 数字池（阿拉伯数字 1-10）
//
// 数据源：教育部《义务教育数学课程标准》数字书写规范
// 内容：阿拉伯数字 1-10（不含 0，幼小衔接从 1 开始）
//
// 笔画模板坐标系：viewBox 0 0 1024 1024，**Y-up**（数学约定）
// 与 hanzi-writer-data / 拼音模板一致，渲染时由 .trace-flip <g> 翻转 Y 轴
// 单数字居中（中心 512,512）；"10" 由 "1" + "0" 左右并排
//
// 整理日期：2026-09-22
// =====================================================================

window.TRACE_NUMBERS = window.TRACE_NUMBERS || (function () {

  // Y-up 坐标：Y 大 = 屏幕上方，Y 小 = 屏幕下方
  // 单数字盒：上 872，下 152，左 152，右 872（720×720）

  const digits = {
    "1": {
      // 一笔：顶部斜钩 → 竖
      strokes: ["M 592 282 L 512 252 L 512 772"],
      medians: [[592, 742]]
    },
    "2": {
      // 一笔：顶弧 → 右下斜 → 底横
      strokes: ["M 712 332 712 282 612 282 L 412 282 312 282 312 382 312 482 512 582 L 712 772 L 312 772"],
      medians: [[712, 692]]
    },
    "3": {
      // 一笔：右弧两段（上半圆 + 下半圆）
      strokes: ["M 712 322 612 282 492 282 312 282 312 412 312 502 492 552 312 552 312 682 312 812 492 812 632 812 712 752"],
      medians: [[712, 702]]
    },
    "4": {
      // 两笔：横折（左 L）+ 竖（右竖）
      strokes: [
        "M 412 282 L 612 282 L 612 772",
        "M 412 282 L 412 772"
      ],
      medians: [[412, 742], [412, 742]]
    },
    "5": {
      // 一笔：横 → 竖 → 横折钩
      strokes: ["M 312 772 L 612 772 L 612 482 512 482 412 502 312 522 312 642 312 772 492 772 692 772 712 712"],
      medians: [[312, 252]]
    },
    "6": {
      // 一笔：右上弧（探出头）→ 左下 → 底圆
      strokes: ["M 412 322 712 322 712 532 712 772 512 772 312 772 312 632 312 502 412 502 612 502 612 632"],
      medians: [[412, 702]]
    },
    "7": {
      // 一笔：横 → 撇
      strokes: ["M 712 282 L 312 282 L 612 772"],
      medians: [[712, 742]]
    },
    "8": {
      // 两笔：上小圈 + 下大圈（人教版规范）
      strokes: [
        "M 412 432 412 282 512 282 612 282 612 432 612 532 512 532 412 532 412 432 Z",
        "M 312 712 312 532 412 532 512 532 612 532 712 532 712 712 712 812 512 812 312 812 312 712 Z"
      ],
      medians: [[412, 592], [312, 312]]
    },
    "9": {
      // 一笔：上圆 + 下竖
      strokes: ["M 412 762 312 762 312 632 312 432 412 332 512 232 612 332 712 432 712 632 712 762 612 762 512 762 512 632"],
      medians: [[412, 262]]
    },
    "0": {
      // 一笔：椭圆
      strokes: ["M 312 532 C 312 742, 712 742, 712 492 C 712 242, 312 242, 312 492 Z"],
      medians: [[312, 492]]
    },
    "10": {
      // 两笔：1 + 0 并排
      strokes: [
        "M 264 282 L 360 252 L 360 772",
        "M 452 532 C 452 742, 692 742, 692 492 C 692 242, 452 242, 452 492 Z"
      ],
      medians: [[264, 742], [452, 492]]
    }
  };

  // 笔画查找入口（与 TRACE_PINYIN.getStrokeSpec 同接口）
  function getStrokeSpec(charKey) {
    const tpl = digits[charKey];
    if (!tpl) return null;
    return {
      strokes: tpl.strokes.slice(),
      medians: tpl.medians.map(m => m.slice())
    };
  }

  const items = [
    { display: "1",  pinyin: "yī",  pool: "numbers", charKey: "1"  },
    { display: "2",  pinyin: "èr",  pool: "numbers", charKey: "2"  },
    { display: "3",  pinyin: "sān", pool: "numbers", charKey: "3"  },
    { display: "4",  pinyin: "sì",  pool: "numbers", charKey: "4"  },
    { display: "5",  pinyin: "wǔ",  pool: "numbers", charKey: "5"  },
    { display: "6",  pinyin: "liù", pool: "numbers", charKey: "6"  },
    { display: "7",  pinyin: "qī",  pool: "numbers", charKey: "7"  },
    { display: "8",  pinyin: "bā",  pool: "numbers", charKey: "8"  },
    { display: "9",  pinyin: "jiǔ", pool: "numbers", charKey: "9"  },
    { display: "10", pinyin: "shí", pool: "numbers", charKey: "10" }
  ];

  return {
    id: "numbers",
    name: "数字",
    subtitle: "1-10 / 阿拉伯数字",
    hint: "描一描阿拉伯数字，写一写",
    items,
    getStrokeSpec
  };
})();
