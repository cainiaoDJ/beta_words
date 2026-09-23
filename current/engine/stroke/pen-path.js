// engine/stroke/pen-path.js
// 自研引擎: 用户笔迹模型（画笔轨迹 = 点序列 + 状态机）
//
// 用途: 记录用户从 pointerdown 到 pointerup 的完整轨迹，
//      支持插值平滑 / 重采样 / 转 SVG path / 落点校验。
//
// 用法:
//   const pen = new PenPath({ minDistance: 0.004 });
//   pen.begin(0.3, 0.4);        // pointerdown
//   pen.extend(0.35, 0.42);     // pointermove（内部自动过滤过近的点）
//   pen.end(0.7, 0.4);          // pointerup
//   pen.isComplete              -> true
//   pen.start() / pen.endPoint() -> [x, y] 归一化
//   pen.toSVGPath(1024)         -> "M 307 410 L ..."（含平滑）
//   pen.toPoints(1024)          -> [[x,y], ...] 逻辑坐标
//
// 坐标: 归一化 [0,1]（与 regions.js 一致），渲染时乘 viewBox 尺寸。

(function (global) {
  "use strict";

  var DEFAULT_MIN_DISTANCE = 0.004; // 归一化最小点距（过滤抖动）

  function PenPath(opts) {
    opts = opts || {};
    this.points = [];                       // [[x01, y01], ...] 归一化
    this.minDistance = typeof opts.minDistance === "number"
      ? opts.minDistance : DEFAULT_MIN_DISTANCE;
    this.startedAt = 0;
    this.endedAt = 0;
    this.isComplete = false;
    this.declared = null;                   // 可选：这一笔声明要描的 Stroke
  }

  PenPath.prototype.begin = function (x, y, nowMs) {
    this.points = [[x, y]];
    this.startedAt = typeof nowMs === "number" ? nowMs : Date.now();
    this.endedAt = 0;
    this.isComplete = false;
    return this;
  };

  // 返回 true 表示这个点被采纳（不是抖动）
  PenPath.prototype.extend = function (x, y) {
    if (this.isComplete) return false;
    var pts = this.points;
    if (!pts.length) { pts.push([x, y]); return true; }
    var last = pts[pts.length - 1];
    var dx = x - last[0], dy = y - last[1];
    if (Math.sqrt(dx * dx + dy * dy) < this.minDistance) return false;
    pts.push([x, y]);
    return true;
  };

  PenPath.prototype.end = function (x, y, nowMs) {
    if (typeof x === "number" && typeof y === "number") this.extend(x, y);
    this.isComplete = true;
    this.endedAt = typeof nowMs === "number" ? nowMs : Date.now();
    return this;
  };

  PenPath.prototype.duration = function () {
    if (!this.startedAt) return 0;
    return (this.endedAt || Date.now()) - this.startedAt;
  };

  PenPath.prototype.pointCount = function () { return this.points.length; };

  // 起笔点 / 落笔点（归一化）
  PenPath.prototype.start = function () {
    return this.points.length ? this.points[0].slice() : null;
  };
  PenPath.prototype.endPoint = function () {
    return this.points.length ? this.points[this.points.length - 1].slice() : null;
  };

  // 归一化点 → 逻辑坐标
  PenPath.prototype.toPoints = function (viewBoxW, viewBoxH) {
    var w = viewBoxW || 1024, h = viewBoxH || 1024;
    return this.points.map(function (p) { return [p[0] * w, p[1] * h]; });
  };

  // 归一化点 → SVG path（二次平滑，连续 Q 段，视觉更接近毛笔/铅笔）
  PenPath.prototype.toSVGPath = function (viewBoxW, viewBoxH) {
    var pts = this.toPoints(viewBoxW, viewBoxH);
    if (!pts.length) return "";
    if (pts.length === 1) {
      var p0 = pts[0];
      return "M " + p0[0].toFixed(1) + " " + p0[1].toFixed(1) +
             " L " + (p0[0] + 0.1).toFixed(1) + " " + p0[1].toFixed(1);
    }
    var d = "M " + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length - 1; i++) {
      var mx = (pts[i][0] + pts[i + 1][0]) / 2;
      var my = (pts[i][1] + pts[i + 1][1]) / 2;
      d += " Q " + pts[i][0].toFixed(1) + " " + pts[i][1].toFixed(1) +
           " " + mx.toFixed(1) + " " + my.toFixed(1);
    }
    var last = pts[pts.length - 1];
    d += " L " + last[0].toFixed(1) + " " + last[1].toFixed(1);
    return d;
  };

  // 归一化 bbox
  PenPath.prototype.getBBox = function () {
    if (!this.points.length) return { x: 0, y: 0, width: 0, height: 0 };
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    this.points.forEach(function (p) {
      if (p[0] < x0) x0 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[0] > x1) x1 = p[0];
      if (p[1] > y1) y1 = p[1];
    });
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  // 总路径长度（归一化）
  PenPath.prototype.length = function () {
    var t = 0;
    for (var i = 1; i < this.points.length; i++) {
      var dx = this.points[i][0] - this.points[i - 1][0];
      var dy = this.points[i][1] - this.points[i - 1][1];
      t += Math.sqrt(dx * dx + dy * dy);
    }
    return t;
  };

  // 用声明的 Stroke 约束校验这一笔（起点/落点区域 + 边距）
  PenPath.prototype.validate = function (stroke) {
    if (!global.StrokeRegions) return { ok: true, reason: "" };
    var s = stroke || this.declared;
    if (!s) return { ok: true, reason: "" };
    var a = this.start(), b = this.endPoint();
    if (!a || !b) return { ok: false, reason: "empty" };
    return global.StrokeRegions.validateStroke(
      typeof s.constraint === "function" ? s.constraint() : s, a, b
    );
  };

  PenPath.prototype.clone = function () {
    var c = new PenPath({ minDistance: this.minDistance });
    c.points = this.points.map(function (p) { return p.slice(); });
    c.startedAt = this.startedAt;
    c.endedAt = this.endedAt;
    c.isComplete = this.isComplete;
    c.declared = this.declared;
    return c;
  };

  global.PenPath = PenPath;
  global.PenPath.DEFAULT_MIN_DISTANCE = DEFAULT_MIN_DISTANCE;
})(window);
