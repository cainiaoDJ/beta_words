// =====================================================================
// trace-numbers.js — 田字格描红 · 数字池（BETA 待权威源校对）
//
// ⚠️ 状态：BETA
// 当前 0-9 + 10 的 SVG path 是手整理（参考网络教辅资源），**未与教育部《义务教育
// 数学课程标准》或人教版《数学》一年级上册数字示范页逐字对比验证**。
// codex review 已识别：之前的"教育部《义务教育数学课程标准》数字书写规范"声明
// 没有可追溯的出处 / 页码 / 教材版本，仅是猜测性陈述，已删除。
//
// 权威源（已下载 /tmp/math1s.pdf 50MB）：
//   - 人教版《数学》一年级上册（教育部统编版，2024 人教版沿用）
//     ISBN 978-7-107-36922-3（课本版权页已抓到）
//     版次：2022 年 8 月第 2 版
//     数字单元：p14-72（5以内 + 6-10 + 11-20 各数的认识）
//     下载源：https://github.com/TapXWorld/ChinaTextbook/blob/master/小学/数学/人教版/义务教育教科书%20%C2%B7%20数学一年级上册.pdf
//   - 教育部《义务教育数学课程标准》（2011 版 + 2022 修订）
//
// 待办：抓取课本 p14-72 内的数字田字格示范图，转 SVG path 逐数字校对。
// 笔画模板坐标系：viewBox 0 0 1024 1024，Y-down（SVG 默认）
// 渲染层按 spec.yAxis = "down" 不翻转（与 hanzi Y-up 区分）
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
      // 一笔：横 → 竖 → 横折钩（从顶部起笔到右下）
      strokes: ["M 312 252 L 612 252 L 612 482 L 312 482 Q 312 752 432 752 Q 612 752 612 632"],
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
        "M 512 332 A 100 100 0 1 1 512 532 A 100 100 0 1 1 512 332 Z",
        "M 512 492 A 200 140 0 1 1 512 772 A 200 140 0 1 1 512 492 Z"
      ],
      medians: [[512, 332], [512, 492]]
    },
    },
    "9": {
      // 一笔：上圆 + 下竖（从顶部起笔，顺时针画圆后下竖）
      strokes: ["M 512 332 Q 412 332 412 632 Q 612 632 612 332 L 612 772"],
      medians: [[512, 332]]
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
