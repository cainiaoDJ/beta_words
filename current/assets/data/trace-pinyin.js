// =====================================================================
// trace-pinyin.js — 田字格描红 · 拼音池（人手整理笔画模板）
//
// 数据源：
//   - 人教版小学语文一年级上册「汉语拼音」13 课
//   - 教育部《汉语拼音字母表》（2017 修订版）
//   - 整体认读音节 16 个
//
// 坐标系：viewBox 0 0 1024 1024，居中字符盒 720x720（左 152，上 152）
// 单字母 letters[base] 的 path/medians 在该字符盒内书写（左上 152,152）
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
      strokes: ["M 352 552 A 200 180 0 1 0 712 552 A 200 180 0 1 0 352 552 Z"],
      medians: [[352, 552]]
    },
    o: {
      strokes: ["M 312 512 A 240 240 0 1 0 712 512 A 240 240 0 1 0 312 512 Z"],
      medians: [[312, 512]]
    },
    e: {
      strokes: [
        "M 232 512 L 792 512",
        "M 312 492 A 200 180 0 1 0 712 492 A 200 180 0 0 0 312 492"
      ],
      medians: [[232, 512], [312, 492]]
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
    // 声母带调（单字符 + 声调）
    { display: "bā", pool: "pinyin", charKey: "b1", type: "pinyin", pinyin: "bā" },
    { display: "bà", pool: "pinyin", charKey: "b4", type: "pinyin", pinyin: "bà" },
    { display: "pá", pool: "pinyin", charKey: "p2", type: "pinyin", pinyin: "pá" },
    { display: "mā", pool: "pinyin", charKey: "m1", type: "pinyin", pinyin: "mā" },
    { display: "má", pool: "pinyin", charKey: "m2", type: "pinyin", pinyin: "má" },
    { display: "mǎ", pool: "pinyin", charKey: "m3", type: "pinyin", pinyin: "mǎ" },
    { display: "mà", pool: "pinyin", charKey: "m4", type: "pinyin", pinyin: "mà" },
    { display: "fā", pool: "pinyin", charKey: "f1", type: "pinyin", pinyin: "fā" },
    { display: "dā", pool: "pinyin", charKey: "d1", type: "pinyin", pinyin: "dā" },
    { display: "dé", pool: "pinyin", charKey: "d2", type: "pinyin", pinyin: "dé" },
    { display: "tā", pool: "pinyin", charKey: "t1", type: "pinyin", pinyin: "tā" },
    { display: "ná", pool: "pinyin", charKey: "n2", type: "pinyin", pinyin: "ná" },
    { display: "lā", pool: "pinyin", charKey: "l1", type: "pinyin", pinyin: "lā" },
    { display: "gā", pool: "pinyin", charKey: "g1", type: "pinyin", pinyin: "gā" },
    { display: "hā", pool: "pinyin", charKey: "h1", type: "pinyin", pinyin: "hā" },
    { display: "kā", pool: "pinyin", charKey: "k1", type: "pinyin", pinyin: "kā" },
    { display: "yā", pool: "pinyin", charKey: "y1", type: "pinyin", pinyin: "yā" },
    { display: "wā", pool: "pinyin", charKey: "w1", type: "pinyin", pinyin: "wā" },

    // 整体认读音节（多字符）
    { display: "zhi", pool: "pinyin", charKey: "zhi", type: "pinyin", pinyin: "zhī" },
    { display: "chi", pool: "pinyin", charKey: "chi", type: "pinyin", pinyin: "chī" },
    { display: "shi", pool: "pinyin", charKey: "shi", type: "pinyin", pinyin: "shī" },
    { display: "ri",  pool: "pinyin", charKey: "ri",  type: "pinyin", pinyin: "rì" },
    { display: "zi",  pool: "pinyin", charKey: "zi",  type: "pinyin", pinyin: "zī" },
    { display: "ci",  pool: "pinyin", charKey: "ci",  type: "pinyin", pinyin: "cī" },
    { display: "si",  pool: "pinyin", charKey: "si",  type: "pinyin", pinyin: "sī" },
    { display: "yi",  pool: "pinyin", charKey: "yi",  type: "pinyin", pinyin: "yī" },
    { display: "wu",  pool: "pinyin", charKey: "wu",  type: "pinyin", pinyin: "wū" },
    { display: "yu",  pool: "pinyin", charKey: "yu",  type: "pinyin", pinyin: "yū" }
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
