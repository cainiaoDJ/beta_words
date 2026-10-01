// engine/stroke/pen-tool.js
// 自研引擎: 画笔工具（pointer 事件 → PenPath + 区域严格校验）
//
// 职责：pointer 事件 → PenPath，并依据“渲染后的 median”验证描写质量。
// 起/落点、目标覆盖率和偏离程度均在同一个归一化 viewBox 坐标系中计算。
//
// 用法:
//   const pen = new PenTool(zone, {
//     strokeIndex: 0,              // 当前要描第几笔（0-based）
//     edgeMargin: 0.08,            // 离边最小距离（归一化）
//     requireRegion: true,         // 是否强制区域校验
//     onStart: (point, pen) => {}, // 起笔被接受
//     onMove:  (point, pen) => {},
//     onEnd:   (pen, result) => {},// 落笔（result 含 ok / reason）
//     onReject:(result, pen) => {} // 起笔或落笔被拒绝
//   });
//   pen.setStrokeIndex(1);         // 描下一笔时更新
//   pen.setStrokes(zone.strokes);  // 同步笔画数据
//   pen.destroy();

(function (global) {
  "use strict";

  function PenTool(zone, options) {
    if (!zone) throw new Error("PenTool: zone required");
    var opts = options || {};

    this.zone = zone;
    this.edgeMargin = typeof opts.edgeMargin === "number" ? opts.edgeMargin : 0.08;
    this.requireRegion = opts.requireRegion !== false;
    this.minDistance = typeof opts.minDistance === "number" ? opts.minDistance : 0.004;
    this.validation = opts.validation || {};
    this.strokeIndex = typeof opts.strokeIndex === "number" ? opts.strokeIndex : 0;
    this.strokes = zone.strokes || [];

    this.onStart = opts.onStart || null;
    this.onMove = opts.onMove || null;
    this.onEnd = opts.onEnd || null;
    this.onReject = opts.onReject || null;

    this.active = null;          // 当前 PenPath（绘制中）
    this.activePointerId = null;
    this.enabled = true;

    this._bind();
  }

  PenTool.prototype.setStrokeIndex = function (i) {
    this.strokeIndex = i;
    return this;
  };

  PenTool.prototype.setStrokes = function (strokes) {
    this.strokes = strokes || [];
    return this;
  };

  PenTool.prototype.currentStroke = function () {
    return this.strokes[this.strokeIndex] || null;
  };

  PenTool.prototype.setEnabled = function (on) {
    this.enabled = !!on;
    return this;
  };

  PenTool.prototype._bind = function () {
    var self = this;
    // 直接绑在 zone 的 svg 上（zone._svg），保证命中区与 viewBox 一致
    var target = this.zone._svg;
    if (!target) throw new Error("PenTool: zone._svg missing（先构造 ZoneStroke）");
    this._target = target;

    this._onDown = function (e) { self._pointerDown(e); };
    this._onMove = function (e) { self._pointerMove(e); };
    this._onUp = function (e) { self._pointerUp(e); };

    target.addEventListener("pointerdown", this._onDown);
    target.addEventListener("pointermove", this._onMove);
    target.addEventListener("pointerup", this._onUp);
    target.addEventListener("pointercancel", this._onUp);
    target.addEventListener("pointerleave", this._onUp);
    // 触摸场景：阻止滚动抢手势
    target.style.touchAction = "none";
  };

  PenTool.prototype._pointerDown = function (e) {
    if (!this.enabled) return;
    if (this.active) return;                 // 单指单笔
    var pt = this.zone.fromEvent(e);

    // ---- 起笔校验：可见 median 的起点容差 ----
    var result = { ok: true, reason: "", phase: "start" };
    var stroke = this.currentStroke();
    var guide = stroke && typeof this.zone.getValidationGuide === "function"
      ? this.zone.getValidationGuide(stroke) : [];
    if (this.requireRegion && stroke && guide.length >= 2) {
      var tolerance = typeof this.validation.startTolerance === "number"
        ? this.validation.startTolerance : 0.085;
      var startDistance = global.PenPath.distanceToGuide(pt, [guide[0]]);
      if (startDistance > tolerance) {
        result = { ok: false, reason: "start", phase: "start",
                   distance: startDistance, tolerance: tolerance, target: guide[0] };
      }
    } else if (this.requireRegion && stroke && global.StrokeRegions) {
      // 兼容无 guide 的旧数据；新数据不应走这里。
      var inside = global.StrokeRegions.insideViewport(pt[0], pt[1], this.edgeMargin);
      if (!inside) result = { ok: false, reason: "edge", phase: "start" };
    }

    if (!result.ok) {
      if (this.onReject) this.onReject(result, null);
      return;
    }

    this.activePointerId = e.pointerId;
    try { this._target.setPointerCapture(e.pointerId); } catch (err) {}
    this.active = new global.PenPath({ minDistance: this.minDistance });
    this.active.begin(pt[0], pt[1]);
    this.active.declared = stroke;
    if (this.onStart) this.onStart(pt, this.active);
  };

  PenTool.prototype._pointerMove = function (e) {
    if (!this.active) return;
    if (this.activePointerId !== e.pointerId) return;
    var pt = this.zone.fromEvent(e);
    var added = this.active.extend(pt[0], pt[1]);
    if (added && this.onMove) this.onMove(pt, this.active);
  };

  PenTool.prototype._pointerUp = function (e) {
    if (!this.active) return;
    if (this.activePointerId !== null && e.pointerId !== this.activePointerId) return;
    var pt = this.zone.fromEvent(e);
    this.active.end(pt[0], pt[1]);
    var pen = this.active;
    this.active = null;
    this.activePointerId = null;
    try { this._target.releasePointerCapture(e.pointerId); } catch (err) {}

    // ---- 轨迹校验：起落点 + 覆盖率 + 与 median 的偏离 ----
    var result = { ok: true, reason: "", phase: "end" };
    var stroke = this.currentStroke();
    var guide = stroke && typeof this.zone.getValidationGuide === "function"
      ? this.zone.getValidationGuide(stroke) : [];
    if (this.requireRegion && stroke && guide.length >= 2) {
      var v = pen.validateGuide(guide, this.validation);
      v.phase = "end";
      result = v;
    } else if (this.requireRegion && stroke && global.StrokeRegions) {
      var legacy = pen.validate(stroke);
      result = { ok: legacy.ok, reason: legacy.reason, phase: "end" };
    }

    if (this.onEnd) this.onEnd(pen, result);
    if (!result.ok && this.onReject) this.onReject(result, pen);
  };

  PenTool.prototype.destroy = function () {
    var t = this._target;
    if (!t) return;
    t.removeEventListener("pointerdown", this._onDown);
    t.removeEventListener("pointermove", this._onMove);
    t.removeEventListener("pointerup", this._onUp);
    t.removeEventListener("pointercancel", this._onUp);
    t.removeEventListener("pointerleave", this._onUp);
    this._target = null;
    this.active = null;
  };

  global.PenTool = PenTool;
})(window);
