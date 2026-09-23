// engine/stroke/stroke.js
// 自研引擎: 笔画数据模型（纯数据，不碰 DOM 渲染）
//
// 一笔 = 一条 SVG path + 元数据（起笔/落笔区域 + 笔序号 + 提示）
//
// 用法:
//   const s = new Stroke({
//     path: "M 412 252 L 712 252",
//     startRegion: "NW",          // 起笔必须落在左上扇区
//     endRegion:   "NE",          // 落笔必须落在右上扇区
//     index: 1,                   // 第几笔（1-based）
//     label: "横"                 // 可选：笔画名
//   });
//   s.getBBox()                   -> {x,y,width,height}（逻辑坐标）
//   s.sampleStart()               -> [x, y] 归一化起笔点
//   s.sampleEnd()                 -> [x, y] 归一化落笔点
//
// 坐标: 逻辑坐标 = 与 viewBox 同一空间（默认 1024×1024，y 向下）。
//       归一化坐标 = 逻辑坐标 / viewBox 尺寸，用于区域判定。

(function (global) {
  "use strict";

  // ---- 纯 JS 的 path bbox（支持 M/L/H/V/C/Q/A/Z 及小写相对命令）----
  // 只求控制点包围盒（对贝塞尔/弧是保守近似，够用于 fit/居中）
  function pathBBox(d) {
    var nums = String(d).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
    if (!nums) return { x: 0, y: 0, width: 0, height: 0 };
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    // 简化策略：把所有数字偶数位当 x、奇数位当 y —— 对 M/L/T/Q/C/S 混合不安全，
    // 因此改为按命令解析。
    var tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    var cx = 0, cy = 0;
    function push(x, y) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
    var i = 0;
    var cmd = null;
    while (i < tokens.length) {
      var t = tokens[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; i++; continue; }
      var rel = cmd === cmd.toLowerCase();
      var n = parseFloat(t);
      switch (cmd.toUpperCase()) {
        case "M":
        case "L":
        case "T": {
          var px = parseFloat(tokens[i++]);
          var py = parseFloat(tokens[i++]);
          if (rel) { px += cx; py += cy; }
          cx = px; cy = py; push(cx, cy);
          break;
        }
        case "H": {
          var hx = parseFloat(tokens[i++]);
          if (rel) hx += cx;
          cx = hx; push(cx, cy);
          break;
        }
        case "V": {
          var vy = parseFloat(tokens[i++]);
          if (rel) vy += cy;
          cy = vy; push(cx, cy);
          break;
        }
        case "C": {
          var c1x = parseFloat(tokens[i++]), c1y = parseFloat(tokens[i++]);
          var c2x = parseFloat(tokens[i++]), c2y = parseFloat(tokens[i++]);
          var ex = parseFloat(tokens[i++]), ey = parseFloat(tokens[i++]);
          if (rel) { c1x += cx; c1y += cy; c2x += cx; c2y += cy; ex += cx; ey += cy; }
          push(c1x, c1y); push(c2x, c2y); push(ex, ey);
          cx = ex; cy = ey;
          break;
        }
        case "S":
        case "Q": {
          var q1x = parseFloat(tokens[i++]), q1y = parseFloat(tokens[i++]);
          var qx = parseFloat(tokens[i++]), qy = parseFloat(tokens[i++]);
          if (rel) { q1x += cx; q1y += cy; qx += cx; qy += cy; }
          push(q1x, q1y); push(qx, qy);
          cx = qx; cy = qy;
          break;
        }
        case "A": {
          // rx ry rot large sweep x y
          i += 5;
          var ax = parseFloat(tokens[i++]), ay = parseFloat(tokens[i++]);
          if (rel) { ax += cx; ay += cy; }
          push(ax, ay);
          cx = ax; cy = ay;
          break;
        }
        case "Z":
          i++; break;
        default:
          i++;
      }
    }
    if (!isFinite(x0)) return { x: 0, y: 0, width: 0, height: 0 };
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }

  // 平移整条 path（只改绝对坐标；初始相对 M 以原点为基准也需要平移）。
  // A 命令的 rx/ry/rotation/flags 不动。
  function translatePath(d, dx, dy) {
    if (!dx && !dy) return d;
    var tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    var out = [];
    var i = 0;
    var cmd = null;
    var tx = dx || 0, ty = dy || 0;
    var sawMove = false;
    function num() { return parseFloat(tokens[i++]); }
    while (i < tokens.length) {
      var t = tokens[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; out.push(t); i++; continue; }
      var up = cmd.toUpperCase();
      // Relative coordinates are deltas, so translating them would distort the
      // path. The first relative moveto is the sole exception: SVG resolves it
      // from the initial origin and it establishes the translated start point.
      var rel = cmd === cmd.toLowerCase();
      var moveOffset = !rel || (cmd === "m" && !sawMove);
      var ox = moveOffset ? tx : 0;
      var oy = moveOffset ? ty : 0;
      switch (up) {
        case "M": case "L": case "T":
          out.push(num() + ox); out.push(num() + oy);
          if (up === "M") sawMove = true;
          break;
        case "H": out.push(num() + ox); break;
        case "V": out.push(num() + oy); break;
        case "C":
          out.push(num() + ox); out.push(num() + oy);
          out.push(num() + ox); out.push(num() + oy);
          out.push(num() + ox); out.push(num() + oy); break;
        case "S": case "Q":
          out.push(num() + ox); out.push(num() + oy);
          out.push(num() + ox); out.push(num() + oy); break;
        case "A":
          out.push(num()); out.push(num()); out.push(num());
          out.push(tokens[i++]); out.push(tokens[i++]);
          out.push(num() + ox); out.push(num() + oy); break;
        case "Z": break;
        default: out.push(t); break;
      }
    }
    return out.join(" ");
  }

  // 取 path 的首个绝对起点
  function pathStart(d) {
    var m = String(d).match(/[Mm]\s*(-?\d*\.?\d+)[\s,]+(-?\d*\.?\d+)/);
    return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
  }

  // 取 path 的最后一个坐标点（近似落笔点）
  function pathEnd(d) {
    var tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+/g) || [];
    var last = null;
    for (var i = tokens.length - 1; i >= 0; i--) {
      if (!/[A-Za-z]/.test(tokens[i])) { last = parseFloat(tokens[i]); break; }
    }
    // 回退：取倒数第二个数字当 x
    if (last === null) return [0, 0];
    // 找到最后两个数字
    var tail = [];
    for (var j = tokens.length - 1; j >= 0 && tail.length < 2; j--) {
      if (!/[A-Za-z]/.test(tokens[j])) tail.unshift(parseFloat(tokens[j]));
    }
    return tail.length === 2 ? [tail[0], tail[1]] : [0, 0];
  }

  function Stroke(opts) {
    opts = opts || {};
    if (!opts.path) throw new Error("Stroke: path required");
    this.path = opts.path;
    this.index = typeof opts.index === "number" ? opts.index : null;
    this.label = opts.label || "";
    // 官方笔迹中轴线的起/末点（逻辑坐标）。有它时，起落点判定优先用它，
    // 因为它比 path 的首/末坐标更能代表「用户应该从哪里下笔」。
    this.medianStart = opts.medianStart || null;
    this.medianEnd = opts.medianEnd || null;
    // 可选平移 {dx, dy}：给「同一份笔画模板多次复用」的场景用（如拼音声调符号锚点在原点）。
    // 构造时直接烘焙进 path 和 median，下游全部无感。
    this.transform = opts.transform || null;
    if (this.transform) {
      var tdx = this.transform.dx || 0;
      var tdy = this.transform.dy || 0;
      this.path = translatePath(this.path, tdx, tdy);
      if (this.medianStart) this.medianStart = [this.medianStart[0] + tdx, this.medianStart[1] + tdy];
      if (this.medianEnd) this.medianEnd = [this.medianEnd[0] + tdx, this.medianEnd[1] + tdy];
    }
    // 起笔 / 落笔区域约束（数组 = 允许集合；null = 不限制）
    this.startRegion = opts.startRegion || null;
    this.endRegion = opts.endRegion || null;
    this.edgeMargin = typeof opts.edgeMargin === "number" ? opts.edgeMargin : null;
    this.centerRadius = typeof opts.centerRadius === "number" ? opts.centerRadius : null;
    this.meta = opts.meta || {};
    this._bbox = null;
  }

  Stroke.prototype.getBBox = function () {
    if (!this._bbox) this._bbox = pathBBox(this.path);
    return this._bbox;
  };

  // 逻辑坐标起点 / 落笔点（优先用官方中轴线端点，更符合「下笔位置」）
  Stroke.prototype.startPoint = function () {
    if (this.medianStart) return this.medianStart.slice();
    return pathStart(this.path);
  };
  Stroke.prototype.endPoint = function () {
    if (this.medianEnd) return this.medianEnd.slice();
    return pathEnd(this.path);
  };

  // 归一化（0~1）起点 / 落笔点
  Stroke.prototype.sampleStart = function (viewBoxW, viewBoxH) {
    var p = this.startPoint();
    return [p[0] / (viewBoxW || 1024), p[1] / (viewBoxH || 1024)];
  };
  Stroke.prototype.sampleEnd = function (viewBoxW, viewBoxH) {
    var p = this.endPoint();
    return [p[0] / (viewBoxW || 1024), p[1] / (viewBoxH || 1024)];
  };

  // 给区域校验用的约束对象
  Stroke.prototype.constraint = function () {
    return {
      startRegion: this.startRegion,
      endRegion: this.endRegion,
      edgeMargin: this.edgeMargin,
      centerRadius: this.centerRadius
    };
  };

  Stroke.prototype.clone = function () {
    return new Stroke({
      path: this.path,
      index: this.index,
      label: this.label,
      startRegion: this.startRegion,
      endRegion: this.endRegion,
      edgeMargin: this.edgeMargin,
      centerRadius: this.centerRadius,
      meta: JSON.parse(JSON.stringify(this.meta || {}))
    });
  };

  // Y-up → Y-down 坐标翻转（hanzi-writer 数据是数学约定 Y-up，
  // 屏幕/SVG 是 Y-down）。在数据入口做一次，下游全部统一 Y-down。
  // 实现：y' = size - y；同时把 path 里的 y 取反重写。
  function flipPathY(d, size) {
    var tokens = String(d).match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) || [];
    var out = [];
    var i = 0;
    var cmd = null;
    function num() { return parseFloat(tokens[i++]); }
    function fy(v, rel) { return rel ? -v : (size - v); }
    while (i < tokens.length) {
      var t = tokens[i];
      if (/[A-Za-z]/.test(t)) { cmd = t; out.push(t); i++; continue; }
      var up = cmd.toUpperCase();
      var rel = cmd === cmd.toLowerCase();
      switch (up) {
        case "M": case "L": case "T":
          out.push(num()); out.push(fy(num(), rel)); break;
        case "H": out.push(num()); break;
        case "V": out.push(fy(num(), rel)); break;
        case "C":
          out.push(num()); out.push(fy(num(), rel));
          out.push(num()); out.push(fy(num(), rel));
          out.push(num()); out.push(fy(num(), rel)); break;
        case "S": case "Q":
          out.push(num()); out.push(fy(num(), rel));
          out.push(num()); out.push(fy(num(), rel)); break;
        case "A":
          out.push(num()); out.push(num()); out.push(num());
          out.push(tokens[i++]); out.push(tokens[i++]);
          out.push(num()); out.push(fy(num(), rel)); break;
        case "Z": break;
        default: out.push(t); break;
      }
    }
    // 重新拼装（数字用空格分隔，命令直接跟）
    var s = "";
    out.forEach(function (tok) {
      if (/[A-Za-z]/.test(tok)) { s += (s ? " " : "") + tok; }
      else { s += (s ? " " : "") + tok; }
    });
    return s;
  }

  // 批量：把 hanzi-writer 的 {strokes:[path], medians:[[[x,y],...]]} 转成 Stroke[]
  //   opts.flipY: 传 viewBox 尺寸（如 1024）→ 把 Y-up 数据统一翻成 Y-down
  //   opts.deriveRegions: 用 medians 首点/末点推区域（默认 true）
  Stroke.fromHanziWriter = function (spec, opts) {
    opts = opts || {};
    var out = [];
    var strokes = (spec && spec.strokes) || [];
    var medians = (spec && spec.medians) || [];
    var flip = typeof opts.flipY === "number" ? opts.flipY : null;
    for (var i = 0; i < strokes.length; i++) {
      var d = typeof strokes[i] === "string" ? strokes[i] : strokes[i].d;
      if (flip) d = flipPathY(d, flip);
      var med = medians[i];
      var startRegion = null, endRegion = null;
      var medianStart = null, medianEnd = null;
      if (Array.isArray(med) && med.length) {
        // medians[i] 可能是 [[x,y],...] 或 [x,y]
        var first = Array.isArray(med[0]) ? med[0] : med;
        var last = Array.isArray(med[med.length - 1]) && Array.isArray(med[0])
          ? med[med.length - 1] : med;
        medianStart = [first[0], first[1]];
        medianEnd = [last[0], last[1]];
        // 关键：中轴线必须跟 path 一起翻转，否则区域判定上下颠倒
        if (flip) {
          medianStart = [medianStart[0], flip - medianStart[1]];
          medianEnd = [medianEnd[0], flip - medianEnd[1]];
        }
        if (opts.deriveRegions !== false && global.StrokeRegions) {
          var size = typeof opts.flipY === "number" ? opts.flipY : 1024;
          startRegion = global.StrokeRegions.regionOf(medianStart[0] / size, medianStart[1] / size);
          endRegion = global.StrokeRegions.regionOf(medianEnd[0] / size, medianEnd[1] / size);
        }
      }
      out.push(new Stroke({
        path: d,
        index: i + 1,
        medianStart: medianStart,
        medianEnd: medianEnd,
        startRegion: opts.startRegion || startRegion,
        endRegion: opts.endRegion || endRegion,
        edgeMargin: opts.edgeMargin,
        centerRadius: opts.centerRadius,
        meta: { source: opts.source || "hanzi-writer" }
      }));
    }
    return out;
  };

  global.Stroke = Stroke;
  global.Stroke.pathBBox = pathBBox;
})(window);
