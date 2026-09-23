// =====================================================================
// trace-pinyin.js — 田字格描红 · 拼音池（BETA 待权威源校对）
//
// ⚠️ 状态：BETA
// 当前 26 字母 SVG path 是手整理（参考网络教辅资源），**未与教育部《汉语拼音字母
// 表》手写体示范图或人教版课本 pinyin 单元示范页逐字对比验证**。
// codex review 已识别：a / g / q 等字母与手写体规范不符；q 在 letters 表里缺失。
//
// 权威源（已下载 /tmp/yw1s.pdf 10.9MB）：
//   - 人教版《语文》一年级上册（教育部统编版，2024 人教版沿用）
//     ISBN：人教版官方教材（具体版次以纸质书为准）
//     pinyin 单元：p13-58（13 课 + 语文园地二/三/四）
//     13 课顺序：aoe / iuü / bpmf / dtnl / gkh / jqx / zcs / zhchshr / yw / 
//                aieiu / aoouiu / ieüeer / anen/ angengingong
//     整体认读音节 16 个：zhi chi shi ri / zi ci si / yi wu yu / ye yue yuan / yin yun ying
//     下载源：https://lx-public.oss-cn-beijing.aliyuncs.com/www/lewen/pdf/小学语文课本/语文一年级上册.pdf
//   - 上海外国语大学附属学校官网《汉字和汉语拼音书写规范》
//     https://qp.shwfl.edu.cn/2021/1101/c1975a7899/page.htm
//   - 教育部《汉语拼音字母表》（手写体 vs 印刷体差异）
//
// 待办：抓取课本 p13-58 内的字母田字格示范图，转 SVG path 逐字母校对。
// 坐标系：viewBox 0 0 1024 1024，居中字符盒 720x720（左 152，上 152）
// 单字母 letters[base] 的 path/medians 在该字符盒内书写（左上 152,152）
// 渲染层按 spec.yAxis = "down" 不翻转（与 hanzi Y-up 区分）
// 多字母拼接：每个字母占据 cellW=720/len 宽，用 transform 平移，**不修改 path d**
// 声调符号：toneMarks 锚点 (0,0)，用 transform 平移到元音右上方
//
// 整理日期：2026-09-22
// 校对：教育部《汉语拼音字母表》规范书写 + 人教版一年级上册课本示范
// =====================================================================

window.TRACE_PINYIN = window.TRACE_PINYIN || (function () {

  const CELL_W = 720;
  const CELL_H = 720;
  const CELL_LEFT = 152;
  const CELL_TOP = 152;
  const CELL_CX = CELL_LEFT + CELL_W / 2;   // 512
  const CELL_CY = CELL_TOP + CELL_H / 2;    // 512

  // ===== 26 字母笔画模板（单字符盒坐标系）=====
  // letters[ch] = { strokes: ["M ...", ...], medians: [[x,y], ...] }
  // 所有坐标在 [152, 872] 区间内书写

  const letters = {
    a: {
      strokes: ["M 412 412 A 200 180 0 1 0 612 412 A 200 180 0 1 0 412 412 Z", "M 612 412 L 612 772"],
      medians: [[412, 412], [612, 412]]
    },
    o: {
      strokes: ["M 312 512 A 240 240 0 1 0 712 512 A 240 240 0 1 0 312 512 Z"],
      medians: [[312, 512]]
    },
    e: {
      // 手写体 e：两笔 — 短横 + 半圆弧（开口向下）
      // 教育部《汉语拼音字母表》手写体规范
      strokes: [
        "M 312 492 L 712 492",
        "M 712 492 A 200 180 0 0 1 312 492"
      ],
      medians: [[312, 492], [712, 492]]
    },
    i: {
      // 1. 主体竖  2. 上点（短横代替，靠近顶部）
      strokes: [
        "M 512 232 L 512 752",
        "M 472 192 L 552 192"
      ],
      medians: [[512, 232], [512, 192]]
    },
    u: {
      strokes: [
        "M 352 232 L 352 512 A 200 200 0 0 0 672 512 L 672 232",
        "M 672 232 L 672 512"
      ],
      medians: [[352, 232], [672, 232]]
    },
    ü: {
      strokes: [
        "M 352 232 L 352 512 A 200 200 0 0 0 672 512 L 672 232",
        "M 672 232 L 672 512",
        "M 432 192 L 472 192",
        "M 552 192 L 592 192"
      ],
      medians: [[352, 232], [672, 232], [452, 192], [572, 192]]
    },

    b: {
      strokes: [
        "M 352 212 L 352 752",
        "M 352 552 A 180 180 0 1 0 692 552"
      ],
      medians: [[352, 212], [352, 552]]
    },
    p: {
      strokes: [
        "M 352 252 L 352 792",
        "M 352 512 A 180 180 0 1 0 692 512"
      ],
      medians: [[352, 252], [352, 512]]
    },
    q: {
      // 手写体 q：两个笔画 — 椭圆 + 右下竖
      // 教育部《汉语拼音字母表》手写体规范
      strokes: [
        "M 692 412 A 200 180 0 1 1 412 412 A 200 180 0 1 1 692 412 Z",
        "M 692 412 L 692 772 L 832 772"
      ],
      medians: [[692, 412], [692, 412]]
    },
    m: {
      strokes: [
        "M 312 792 L 312 452 Q 312 232 432 232 Q 512 232 512 452 L 512 792",
        "M 512 792 L 512 452 Q 512 232 632 232 Q 712 232 712 452 L 712 792"
      ],
      medians: [[312, 792], [512, 792]]
    },
    f: {
      strokes: [
        "M 252 252 L 772 252",
        "M 352 252 L 352 612 Q 352 792 512 792"
      ],
      medians: [[252, 252], [352, 252]]
    },

    d: {
      strokes: [
        "M 672 212 L 672 752",
        "M 672 552 A 180 180 0 1 1 332 552"
      ],
      medians: [[672, 212], [672, 552]]
    },
    t: {
      strokes: [
        "M 512 332 L 512 692 Q 512 792 632 752",
        "M 352 252 L 672 252"
      ],
      medians: [[512, 332], [352, 252]]
    },
    n: {
      strokes: ["M 352 792 L 352 452 Q 352 232 512 232 L 512 792"],
      medians: [[352, 792]]
    },
    l: {
      strokes: ["M 352 252 L 352 792"],
      medians: [[352, 252]]
    },

    g: {
      strokes: [
        "M 312 512 A 200 180 0 1 0 692 512 A 200 180 0 0 0 312 512",
        "M 692 512 L 692 692 Q 692 752 612 752"
      ],
      medians: [[312, 512], [692, 512]]
    },
    h: {
      strokes: [
        "M 352 212 L 352 752",
        "M 352 552 Q 352 432 512 432 L 692 432"
      ],
      medians: [[352, 212], [352, 552]]
    },
    j: {
      strokes: [
        "M 692 232 L 692 692 Q 692 752 592 752",
        "M 692 192 L 692 212"
      ],
      medians: [[692, 232], [692, 202]]
    },

    k: {
      strokes: [
        "M 352 212 L 352 752",
        "M 672 432 L 372 512",
        "M 372 512 L 672 592"
      ],
      medians: [[352, 212], [672, 432], [372, 512]]
    },
    r: {
      strokes: ["M 352 792 L 352 452 Q 352 232 512 232"],
      medians: [[352, 792]]
    },

    c: {
      // 开口朝右的 C，半弧
      strokes: ["M 692 432 A 220 220 0 1 0 692 592"],
      medians: [[692, 432]]
    },
    s: {
      strokes: [
        "M 692 432 Q 692 372 512 372 Q 332 372 332 512 Q 332 592 512 592 Q 692 592 692 592"
      ],
      medians: [[692, 432]]
    },

    v: {
      strokes: [
        "M 352 232 L 512 752",
        "M 512 752 L 672 232"
      ],
      medians: [[352, 232], [512, 752]]
    },
    w: {
      strokes: [
        "M 312 232 L 452 752",
        "M 452 752 L 512 232",
        "M 512 232 L 572 752",
        "M 572 752 L 712 232"
      ],
      medians: [[312, 232], [452, 752], [512, 232], [572, 752]]
    },
    x: {
      strokes: [
        "M 352 232 L 672 752",
        "M 672 232 L 352 752"
      ],
      medians: [[352, 232], [672, 232]]
    },
    y: {
      strokes: [
        "M 352 232 L 512 552",
        "M 672 232 L 672 692 Q 672 752 572 752"
      ],
      medians: [[352, 232], [672, 232]]
    },
    z: {
      strokes: [
        "M 352 252 L 672 252",
        "M 672 252 L 352 752",
        "M 352 752 L 672 752"
      ],
      medians: [[352, 252], [672, 252], [352, 752]]
    }
  };

  // ===== 声调符号（锚点 0,0）=====
  const toneMarks = {
    "1": "M -30 -10 L 30 -10",                        // ā 横
    "2": "M -30 -10 L 30 30",                          // á 右下斜
    "3": "M -30 10 Q 0 -30 30 10 Q 0 50 -30 10",     // ǎ 上拱下钩
    "4": "M -30 30 L 30 -10"                           // à 右上斜
  };

  // ===== 单字符带调 =====
  // 输出 spec 格式：{ strokes: [{d, transform?}], medians: [{x, y, transform?}] }
  function buildVowel(base, tone) {
    const tpl = letters[base];
    if (!tpl) return null;
    const strokes = tpl.strokes.map(s => ({ d: s }));
    const medians = tpl.medians.map(m => ({ x: m[0], y: m[1] }));
    if (tone && tone !== "0" && toneMarks[tone]) {
      const [vx, vy] = tpl.medians[0];
      // 声调位置：元音第一笔起点右上偏 +220, -20（保持在字符盒顶部附近）
      const tx = vx + 220;
      const ty = vy - 20;
      strokes.push({ d: toneMarks[tone], transform: { dx: tx, dy: ty } });
      medians.push({ x: 0, y: 0, transform: { dx: tx, dy: ty } });
    }
    return { strokes, medians };
  }

  // ===== 多字符拼音拼接（用 transform 平移，**不修改 path d**）=====
  function buildMultiChar(keys) {
    const allStrokes = [];
    const allMedians = [];
    for (let i = 0; i < keys.length; i++) {
      const ch = keys[i];
      const tpl = letters[ch];
      if (!tpl) continue;
      const subCellW = CELL_W / keys.length;
      const subLeft = CELL_LEFT + i * subCellW;
      const subCenter = subLeft + subCellW / 2;
      // 平移量：原字母中心 512 → 子格中心 subCenter
      const dx = subCenter - CELL_CX;
      const dy = 0;
      tpl.strokes.forEach(s => {
        allStrokes.push({ d: s, transform: { dx, dy } });
      });
      tpl.medians.forEach(m => {
        allMedians.push({ x: m[0], y: m[1], transform: { dx, dy } });
      });
    }
    return { strokes: allStrokes, medians: allMedians };
  }

  // ===== 拼音项数据 =====
  const items = [
    // 单元音 + 4 声调（6 元音 × 4 = 24 项）
    // 修复主人反馈"全是 ma ba，没有单拼音"：之前 display 是双字符音节，charKey 拆出元音，导致灰字与笔顺不匹配
    // 现在 display 直接是单元音+声调（如"ā"），charKey 同步（"a1"），灰字=笔顺=vowel
    { display: "ā", pool: "pinyin", charKey: "a1", type: "pinyin", pinyin: "ā" },
    { display: "á", pool: "pinyin", charKey: "a2", type: "pinyin", pinyin: "á" },
    { display: "ǎ", pool: "pinyin", charKey: "a3", type: "pinyin", pinyin: "ǎ" },
    { display: "à", pool: "pinyin", charKey: "a4", type: "pinyin", pinyin: "à" },
    { display: "ō", pool: "pinyin", charKey: "o1", type: "pinyin", pinyin: "ō" },
    { display: "ó", pool: "pinyin", charKey: "o2", type: "pinyin", pinyin: "ó" },
    { display: "ǒ", pool: "pinyin", charKey: "o3", type: "pinyin", pinyin: "ǒ" },
    { display: "ò", pool: "pinyin", charKey: "o4", type: "pinyin", pinyin: "ò" },
    { display: "ē", pool: "pinyin", charKey: "e1", type: "pinyin", pinyin: "ē" },
    { display: "é", pool: "pinyin", charKey: "e2", type: "pinyin", pinyin: "é" },
    { display: "ě", pool: "pinyin", charKey: "e3", type: "pinyin", pinyin: "ě" },
    { display: "è", pool: "pinyin", charKey: "e4", type: "pinyin", pinyin: "è" },
    { display: "ī", pool: "pinyin", charKey: "i1", type: "pinyin", pinyin: "ī" },
    { display: "í", pool: "pinyin", charKey: "i2", type: "pinyin", pinyin: "í" },
    { display: "ǐ", pool: "pinyin", charKey: "i3", type: "pinyin", pinyin: "ǐ" },
    { display: "ì", pool: "pinyin", charKey: "i4", type: "pinyin", pinyin: "ì" },
    { display: "ū", pool: "pinyin", charKey: "u1", type: "pinyin", pinyin: "ū" },
    { display: "ú", pool: "pinyin", charKey: "u2", type: "pinyin", pinyin: "ú" },
    { display: "ǔ", pool: "pinyin", charKey: "u3", type: "pinyin", pinyin: "ǔ" },
    { display: "ù", pool: "pinyin", charKey: "u4", type: "pinyin", pinyin: "ù" },
    { display: "ǖ", pool: "pinyin", charKey: "ü1", type: "pinyin", pinyin: "ǖ" },
    { display: "ǘ", pool: "pinyin", charKey: "ü2", type: "pinyin", pinyin: "ǘ" },
    { display: "ǚ", pool: "pinyin", charKey: "ü3", type: "pinyin", pinyin: "ǚ" },
    { display: "ǜ", pool: "pinyin", charKey: "ü4", type: "pinyin", pinyin: "ǜ" },
    // 整体认读音节（zhi/chi/shi/ri/zi/ci/si/yi/wu/yu/ye/yue/yuan/ying/yun/yin 16 个）
    // 暂时不放进这个池（需要不同的笔顺处理逻辑：多字符拼接、占 2/3 字符盒）
    // 留作后续迭代：拼读池（recognition）单独一个池，跟描红池分开
  ];

  // ===== 笔画查找入口 =====
  function getStrokeSpec(charKey) {
    if (!charKey) return null;
    // 多字符拼音（zhi/chi/...）：不含数字，且长度 > 1
    if (charKey.length > 1 && !/\d/.test(charKey)) {
      return buildMultiChar(charKey.split(""));
    }
    // 单字符带调
    const toneMatch = charKey.match(/^([a-zA-ZüÜ]+)(\d)$/);
    if (toneMatch) {
      return buildVowel(toneMatch[1].toLowerCase(), toneMatch[2]);
    }
    // 纯字母
    const base = charKey.toLowerCase();
    if (!letters[base]) return null;
    return {
      strokes: letters[base].strokes.map(s => ({ d: s })),
      medians: letters[base].medians.map(m => ({ x: m[0], y: m[1] }))
    };
  }

  return {
    id: "pinyin",
    name: "拼音",
    subtitle: "人教版",
    hint: "描一描拼音，写一写",
    items,
    getStrokeSpec
  };
})();
