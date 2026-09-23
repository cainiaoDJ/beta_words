// engine/stroke/regions.js
// 自研引擎: 米字格区域模型 + 起点/落点严格校验
//
// 用途: 描红 / 自研画笔的"起笔落笔区域"判定。
//      米字格被 2 条对角线 + 2 条中线切成 8 个 45° 扇区 + 中心圆。
//      每一笔（Stroke）声明 startRegion / endRegion，
//      PenTool 在 pointerdown / pointerup 时用本模块校验用户是否落在正确扇区。
//
// 坐标约定: 归一化 [0,1] × [0,1]，y 向下（屏幕坐标），(0,0) = 左上角。
//          中心 = (0.5, 0.5)。
//
// 扇区命名（8 个 45° 楔形，以中心为原点，从正东开始逆时针编号）:
//
//        NW  |  N  |  NE
//      ------+-----+------
//        W   |  C  |  E
//      ------+-----+------
//        SW  |  S  |  SE
//
//   N  上    NE 右上   E 右    SE 右下
//   S  下    SW 左下   W 左    NW 左上
//   C  中心（半径 < centerRadius 时）
//
// 用法:
//   StrokeRegions.regionOf(0.2, 0.2)              -> "NW"
//   StrokeRegions.check(x, y, "NW")               -> true
//   StrokeRegions.checkStart(x, y, ["NW","N"])    -> true   // 允许集合
//   StrokeRegions.validateStroke(stroke, startXY, endXY)
//                                                 -> { ok, startOk, endOk, ... }

(function (global) {
  "use strict";

  // 8 个扇区，按角度区间定义（角度制，y 向下 = 顺时针为正）
  // E 扇区以 0° 为中心，每扇区 45°
  var SECTORS = [
    { name: "E",  min: -22.5,  max: 22.5 },
    { name: "SE", min: 22.5,   max: 67.5 },
    { name: "S",  min: 67.5,   max: 112.5 },
    { name: "SW", min: 112.5,  max: 157.5 },
    { name: "W",  min: 157.5,  max: 202.5 },
    { name: "NW", min: -157.5, max: -112.5 },
    { name: "N",  min: -112.5, max: -67.5 },
    { name: "NE", min: -67.5,  max: -22.5 }
  ];

  var REGION_NAMES = SECTORS.map(function (s) { return s.name; }).concat(["C"]);

  // 默认中心圆半径（归一化）。落点离中心 < 该值 → 视为 "C"（区域不明确）
  var DEFAULT_CENTER_RADIUS = 0.06;

  // 归一化点 → 扇区名
  function regionOf(x, y, centerRadius) {
    var cr = typeof centerRadius === "number" ? centerRadius : DEFAULT_CENTER_RADIUS;
    var dx = x - 0.5;
    var dy = y - 0.5;
    var r = Math.sqrt(dx * dx + dy * dy);
    if (r < cr) return "C";
    // atan2(dy, dx) 在 y-down 下：0° = 正东，90° = 正南（屏幕下方）
    var deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    // 归一化到 (-180, 180]
    while (deg <= -180) deg += 360;
    while (deg > 180) deg -= 360;

    for (var i = 0; i < SECTORS.length; i++) {
      var s = SECTORS[i];
      // 处理 W 扇区跨 ±180 的情况
      if (s.min < -180 || s.max > 180) {
        if (deg >= s.min || deg <= s.max - 360) return s.name;
      } else if (deg >= s.min && deg < s.max) {
        return s.name;
      }
    }
    return "C";
  }

  // 单点校验：点 (x,y) 是否落在期望区域（可传字符串或数组）
  function check(x, y, expect, centerRadius) {
    if (!expect) return true; // 未声明 = 不限制
    var got = regionOf(x, y, centerRadius);
    if (Array.isArray(expect)) return expect.indexOf(got) !== -1;
    return got === expect;
  }

  // 点是否在 [0,1] 视图内，且离边缘 >= margin（落点不许贴边）
  function insideViewport(x, y, margin) {
    var m = typeof margin === "number" ? margin : 0.08;
    return x >= m && x <= 1 - m && y >= m && y <= 1 - m;
  }

  // 校验一整笔：起点 / 落点是否满足该 stroke 声明的区域 + 边距要求
  //   stroke: { startRegion?, endRegion?, edgeMargin? }
  //   startXY/endXY: [x, y] 归一化
  // 返回: { ok, startOk, endOk, insideOk, startRegion, endRegion, gotStart, gotEnd, reason }
  function validateStroke(stroke, startXY, endXY) {
    var s = stroke || {};
    var margin = typeof s.edgeMargin === "number" ? s.edgeMargin : 0.08;
    var cr = typeof s.centerRadius === "number" ? s.centerRadius : DEFAULT_CENTER_RADIUS;

    var gotStart = regionOf(startXY[0], startXY[1], cr);
    var gotEnd = regionOf(endXY[0], endXY[1], cr);
    var insideOk = insideViewport(startXY[0], startXY[1], margin) &&
                   insideViewport(endXY[0], endXY[1], margin);
    var startOk = check(startXY[0], startXY[1], s.startRegion, cr);
    var endOk = check(endXY[0], endXY[1], s.endRegion, cr);

    var ok = insideOk && startOk && endOk;
    var reason = "";
    if (!insideOk) reason = "edge";       // 贴边 / 出格
    else if (!startOk) reason = "start";  // 起笔区域错
    else if (!endOk) reason = "end";      // 落笔区域错

    return {
      ok: ok,
      insideOk: insideOk,
      startOk: startOk,
      endOk: endOk,
      gotStart: gotStart,
      gotEnd: gotEnd,
      expectStart: s.startRegion || null,
      expectEnd: s.endRegion || null,
      reason: reason
    };
  }

  global.StrokeRegions = {
    SECTORS: SECTORS,
    REGION_NAMES: REGION_NAMES,
    DEFAULT_CENTER_RADIUS: DEFAULT_CENTER_RADIUS,
    regionOf: regionOf,
    check: check,
    insideViewport: insideViewport,
    validateStroke: validateStroke
  };
})(window);
