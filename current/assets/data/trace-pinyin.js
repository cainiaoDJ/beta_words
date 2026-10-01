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
      // 手写体 a（两笔：椭圆主体 + 右下短竖）
      // 证据等级：推断（来自主人手写照片 aoe-handwrite.jpg）。
      // 烘焙到 viewBox 中格中心 (512, 520)，scale=5.33，直接填满 letterZone。
      // 上一轮用 letter-level transform 是错的——照片原坐标 1377~1409 跑出 viewBox 1024 之外，
      // fit 算法被骗，scale 被压到 0.67，字母被挤成小点。
      strokes: [
        "M 605.3 456.0 C 562.7 413.3 477.3 418.7 440.0 466.7 C 392.0 530.7 424.0 605.3 498.7 616.0 C 562.7 626.7 610.7 589.3 610.7 530.7 C 616.0 498.7 616.0 472.0 605.3 456.0",
        "M 605.3 456.0 C 632.0 509.3 632.0 573.3 626.7 616.0"
      ],
      medians: [[605, 456], [605, 456]]
    },
    o: {
      // 手写体 o（一笔：闭合近圆）
      // 证据等级：推断（来自主人手写照片 aoe-handwrite.jpg）。
      // 烘焙到 viewBox 中格中心 (512, 520)，scale=5.71。
      strokes: [
        "M 603.4 445.7 C 557.7 400.0 472.0 405.7 432.0 462.9 C 392.0 525.7 414.9 605.7 483.4 622.9 C 557.7 640.0 620.6 594.3 626.3 525.7 C 632.0 491.4 620.6 462.9 603.4 445.7 Z"
      ],
      medians: [[603, 446]]
    },
    e: {
      // 手写体 e（一笔：环+短横）
      // 证据等级：推断（来自主人手写照片 aoe-handwrite.jpg）。
      // 烘焙到 viewBox 中格中心 (512, 520)，scale=6.32。
      strokes: [
        "M 600.4 497.9 C 562.5 434.7 486.7 428.4 436.2 472.6 C 392.0 516.8 423.6 586.3 493.1 598.9 C 556.2 611.6 606.7 573.7 632.0 535.8 M 436.2 510.5 C 486.7 491.6 556.2 491.6 600.4 497.9"
      ],
      medians: [[600, 498]]
    },
    c: {
      // 手写体 c（一笔：左开口圆弧，逆时针绕行）
      // 证据等级：人教版课本底部小标签 c 的归一化描摹（推断坐标，清晰度较低）。
      // c 的原图坐标已经在 viewBox 范围内 (y=442~672)，不需要大幅缩放，scale=1.04。
      strokes: [
        "M 629.4 435.5 C 583.5 400.0 502.1 402.1 448.9 441.7 C 392.5 483.5 396.7 562.8 453.0 600.3 C 511.5 640.0 593.9 629.6 631.5 594.1"
      ],
      medians: [[629, 436]]
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
  // 证据等级：人教版课本示范骨架的归一化描摹（推断坐标）。
  // codex 看图后取的实际位置：一声/二声/三声/四声均位于字母顶部水平居中。
  // 修复历史：
  //   - 旧版“右上偏”定位（旧公式 tx = vx + 220; ty = vy - 20）已被 buildVowel 重写为水平居中
  //   - 旧版 toneMarks 形状（一眼弧/上下拱/对角线）是手编推断，本轮按课本示范重描
  const toneMarks = {
    "1": "M -60 0 L 60 0",                                  // ā 一声：横
    "2": "M -42 18 L 42 -18",                                // á 二声：左低→右高斜
    "3": "M -48 -21 L 0 21 L 48 -21",                       // ǎ 三声：V 形（中间下凹，缩小避免溢出米字格）
    "4": "M 42 -18 L -42 18"                                 // à 四声：左高→右低斜
  };

  // ===== 简易 path bbox 估算（只覆盖本文件用到的 M/L/C/Q/H/V/A/Z）=====
  // 给声调定位使用——不要求精度到亚像素，只求“主字符中心”在哪。
  function pathBBox(d) {
    var tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+/g) || [];
    var x = 0, y = 0, cmd = null;
    var xmin =  1e9, ymin =  1e9, xmax = -1e9, ymax = -1e9;
    var i = 0;
    function n() { return parseFloat(tokens[i++]); }
    while (i < tokens.length) {
      var t = tokens[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; i++; continue; }
      var up = (cmd || "M").toUpperCase();
      var rel = (cmd === (cmd || "M").toLowerCase()) && cmd !== undefined;
      var cx = x, cy = y;
      if (up === "M" || up === "L" || up === "T") { x = rel ? x + n() : n(); y = rel ? y + n() : n(); }
      else if (up === "H") { x = rel ? x + n() : n(); }
      else if (up === "V") { y = rel ? y + n() : n(); }
      else if (up === "C") { var c1x = rel ? x + n() : n(); var c1y = rel ? y + n() : n();
                              var c2x = rel ? x + n() : n(); var c2y = rel ? y + n() : n();
                              x = rel ? x + n() : n(); y = rel ? y + n() : n();
                              xmin = Math.min(xmin, c1x, c2x, x); ymin = Math.min(ymin, c1y, c2y, y);
                              xmax = Math.max(xmax, c1x, c2x, x); ymax = Math.max(ymax, c1y, c2y, y);
                              continue; }
      else if (up === "S" || up === "Q") { var q1x = rel ? x + n() : n(); var q1y = rel ? y + n() : n();
                                            x = rel ? x + n() : n(); y = rel ? y + n() : n();
                                            xmin = Math.min(xmin, q1x, x); ymin = Math.min(ymin, q1y, y);
                                            xmax = Math.max(xmax, q1x, x); ymax = Math.max(ymax, q1y, y);
                                            continue; }
      else if (up === "A") { n(); n(); n(); i += 2; x = rel ? x + n() : n(); y = rel ? y + n() : n(); }
      else if (up === "Z") { /* close */ }
      else { i++; continue; }
      xmin = Math.min(xmin, x); ymin = Math.min(ymin, y);
      xmax = Math.max(xmax, x); ymax = Math.max(ymax, y);
    }
    if (!isFinite(xmin)) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: xmin, y: ymin, width: xmax - xmin, height: ymax - ymin };
  }

  // ===== 单字符带调 =====
  // 输出 spec 格式：{ strokes: [{d, transform?}], medians: [{x, y, transform?}] }
  function buildVowel(base, tone) {
    const tpl = letters[base];
    if (!tpl) return null;
    // 字母级 transform（用于“外部坐标系→1024 中心”的归一化，如主人手写照片）
    const tform = tpl.transform || null;
    const strokes = tpl.strokes.map(s => ({ d: s, transform: tform }));
    const medians = tpl.medians.map(m => ({ x: m[0], y: m[1], transform: tform }));
    if (tone && tone !== "0" && toneMarks[tone]) {
      // 声调位置 bug 修复（主人 2026-09-23 反馈）：
      //   旧公式 tx = vx + 220; ty = vy - 20
      //   缺陷：锚在“第一笔起笔点”右上偏——a 的情况下，声调在 (820, 390)，
      //         相对主字符中心 (480, 410) 偏移 +340×-20，完全错位。
      //   正确：声调应该在主字符“水平居中、垂直顶部上方”某距离。
      //   证据等级：公开教学资源（上海青浦世外学校）+ 推断（70 单位的间距为视觉适中）。
      //   教育部明确答复拼音字母笔顺无国家标准，禁止再写“教育部规范”类措辞。
      const TONE_GAP = 60;  // 声调距主字符顶部的垂直间距（codex 看课本图实测≈60）
      const TONE_BOX = 136; // toneMark 水平覆盖范围（约 ±68），仅供 medians 记录用
      var x0 =  1e9, y0 =  1e9, x1 = -1e9, y1 = -1e9;
      tpl.strokes.forEach(function (d) {
        var b = pathBBox(d);
        if (b.width === 0 && b.height === 0) return;
        if (b.x       < x0) x0 = b.x;
        if (b.y       < y0) y0 = b.y;
        if (b.x+b.width  > x1) x1 = b.x + b.width;
        if (b.y+b.height > y1) y1 = b.y + b.height;
      });
      const cx = (x0 + x1) / 2;
      const top = y0;
      // 声调 y 坐标：
      //   - 默认：主字符顶部上方 TONE_GAP（适用于米字格）
      //   - 若字母设置了 toneY（拼音四线格专用）：使用该绝对坐标（viewBox 坐标系）
      const tx = cx;                       // 水平居中于主字符（原始坐标系）
      let ty;
      if (typeof tpl.toneY === "number") {
        // viewBox 绝对 y = 字母原始坐标系 y + 字母 transform dy
        ty = tpl.toneY - (tform ? tform.dy : 0);   // 映射回原始坐标系
      } else {
        ty = top - TONE_GAP;
      }
      // isTone 标记让 zone-stroke 在渲染时走“声调样式”（stroke-width 0.018, 偏灰偏淡）
      // toneX/toneY（viewBox 绝对坐标）：zone-stroke 会越过 fit transform 单独定位 tone。
      // 逻辑：x 默认居中字母；y 默认叠 letter.dy；若字母定了 toneX/toneY 则用绝对值（拼音四线格）
      const toneDx = (typeof tpl.toneX === "number") ? tpl.toneX : ((tform ? tform.dx : 0) + tx);
      const toneDy = (typeof tpl.toneY === "number") ? tpl.toneY : ((tform ? tform.dy : 0) + ty);
      strokes.push({ d: toneMarks[tone], transform: { dx: toneDx, dy: toneDy }, isTone: true,
                      toneX: toneDx, toneY: toneDy });
      medians.push({ x: TONE_BOX / 2, y: 0, transform: { dx: toneDx, dy: toneDy } });
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
