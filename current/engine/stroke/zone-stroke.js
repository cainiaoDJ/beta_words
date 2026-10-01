// engine/stroke/zone-stroke.js
// 自研引擎: 笔画渲染 Zone（米字格 + 三层渲染 + 自动适配）
//
// 设计原则（2026-09-23 主人要求）：
//   1. 单一真相源 —— 灰底稿(ghost) 和 蓝引导(guide) 都从同一份 Stroke[] 数据渲染，
//      不靠系统字体。任何设备、任何字体环境，形态完全一致。
//   2. 自动适配 —— 所有笔画算联合 bbox，统一平移+缩放到 zone 中心，
//      留 8% 边距，绝不溢出。
//   3. 三层独立 —— ghost / guide / ink 三个 <g>，可单独开关。
//
// 用法:
//   const zone = new ZoneStroke(container, {
//     viewBox: 1024,            // 逻辑坐标尺寸（默认 1024×1024）
//     padding: 0.08,            // 四边留白比例
//     grid: "mi",               // "mi" 米字格 | "tian" 田字格 | "none"
//     showGhost: true,          // 灰底稿
//     showGuide: true,          // 蓝笔顺引导
//     showNumbers: true         // 笔顺序号 + 起点圆点
//   });
//   zone.setStrokes(strokes);   // Stroke[] → 自动 fit + 渲染
//   zone.setInk(penPaths);      // PenPath[] → 红色笔迹
//   zone.fit();                 // 重新适配（尺寸变化后调）
//   zone.clear();
//   zone.destroy();

(function (global) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          e.setAttribute(k, attrs[k]);
        }
      }
    }
    return e;
  }

  function ZoneStroke(container, options) {
    if (!container) throw new Error("ZoneStroke: container required");
    var opts = options || {};

    this.container = container;
    this.viewBox = opts.viewBox || 1024;
    this.padding = typeof opts.padding === "number" ? opts.padding : 0.12;
    // 字母限位区（拼音四线格专用）：约束字母在 x-height ↔ 基线之间。避免字号过大。
    this.letterZone = opts.letterZone || null;
    this.grid = opts.grid || "mi";
    this.showGhost = opts.showGhost !== false;
    this.showGuide = opts.showGuide !== false;
    this.showNumbers = opts.showNumbers !== false;

    this.strokes = [];
    this.ink = [];
    this._transform = null;  // {scale, dx, dy} 逻辑坐标 → 视图坐标
    this._svg = null;
    this._gBase = null;      // 网格
    this._gGhost = null;     // 灰底稿
    this._gInk = null;       // 用户墨迹（在 guide 下面）
    this._gGuide = null;     // 蓝引导 + 序号线
    this._resizeHandler = null;

    this._build();
  }

  ZoneStroke.prototype._build = function () {
    var vb = this.viewBox;
    var svg = el("svg", {
      class: "stroke-zone-svg",
      viewBox: "0 0 " + vb + " " + vb,
      preserveAspectRatio: "xMidYMid meet",
      "aria-hidden": "true"
    });
    this._gBase = el("g", { class: "stroke-zone-base" });
    this._gGhost = el("g", { class: "stroke-zone-ghost" });
    this._gInk = el("g", { class: "stroke-zone-ink" });
    this._gGuide = el("g", { class: "stroke-zone-guide" });
    svg.appendChild(this._gBase);
    svg.appendChild(this._gGhost);
    svg.appendChild(this._gInk);
    svg.appendChild(this._gGuide);
    this.container.appendChild(svg);
    this._svg = svg;

    this._drawGrid();

    var self = this;
    this._resizeHandler = function () { self.fit(); };
    global.addEventListener("resize", this._resizeHandler);
  };

  // ---- 网格（米字格 / 田字格）----
  ZoneStroke.prototype._drawGrid = function () {
    var g = this._gBase;
    g.innerHTML = "";
    if (this.grid === "none") return;
    var vb = this.viewBox;
    var stroke = { "stroke-width": vb * 0.004, stroke: "#c8b894" };
    var strokeDash = { "stroke-width": vb * 0.004, stroke: "#c8b894",
                       "stroke-dasharray": (vb * 0.033) + " " + (vb * 0.022) };
    if (this.grid === "four-line") {
      // 四线三格（拼音专用）：1:1:1 三等分（codex 参考 GB/T 16159-2012）
      //   第一线  y=160   上格上边      实线
      //   第二线  y=400   中格上边（x-height）   虚线
      //   第三线  y=640   中格下边（baseline）    虚线  ← 主人要求"中间两条都是虚线"
      //   第四线  y=880   下格下边      实线
      var sl4 = { stroke: "#8a7558", "stroke-width": vb * 0.008 };
      var sd4 = { stroke: "#8a7558", "stroke-width": vb * 0.006,
                  "stroke-dasharray": (vb * 0.022) + " " + (vb * 0.012) };
      g.appendChild(el("line", Object.assign({ x1: 0, y1: 160, x2: vb, y2: 160 }, sl4)));
      g.appendChild(el("line", Object.assign({ x1: 0, y1: 400, x2: vb, y2: 400 }, sd4)));
      g.appendChild(el("line", Object.assign({ x1: 0, y1: 640, x2: vb, y2: 640 }, sd4)));
      g.appendChild(el("line", Object.assign({ x1: 0, y1: 880, x2: vb, y2: 880 }, sl4)));
      return;
    }

    // 外框
    g.appendChild(el("rect", {
      x: 0, y: 0, width: vb, height: vb, fill: "none",
      "stroke-width": vb * 0.008, stroke: "#d8ccb4"
    }));
    // 横中线 / 竖中线
    g.appendChild(el("line", Object.assign({
      x1: 0, y1: vb / 2, x2: vb, y2: vb / 2
    }, strokeDash)));
    g.appendChild(el("line", Object.assign({
      x1: vb / 2, y1: 0, x2: vb / 2, y2: vb
    }, strokeDash)));
    if (this.grid === "mi") {
      // 米字格：加两条对角线
      g.appendChild(el("line", Object.assign({
        x1: 0, y1: 0, x2: vb, y2: vb
      }, strokeDash)));
      g.appendChild(el("line", Object.assign({
        x1: vb, y1: 0, x2: 0, y2: vb
      }, strokeDash)));
    }
  };

  // ---- 联合 bbox（逻辑坐标）----
  // 三个关键点（2026-09-23 踩过的坑）：
  //   1. 必须用 SVG 原生 getBBox()，自研 pathBBox 只取控制点会低估 → 溢出
  //   2. 必须含描边（getBBox({stroke:true})），否则粗线会超出画布 ~9px
  //   3. 只在 DOM 已渲染时量，未挂载时回退近似 + 手动补描边余量
  ZoneStroke.prototype._unionBBox = function () {
    if (!this.strokes.length) return null;
    var vb = this.viewBox;
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;

    // ghost 只包含字母（tone 被渲染逻辑跳过），所以计数时也要排除 tone。
    // 否则加了 tone 后 fallback 路径被错误触发（用了大 half 0.05），字母被压扁。
    var visibleStrokes = this.strokes.filter(function (s) { return !s.isTone; });
    var nodes = this._gGhost ? this._gGhost.childNodes : null;
    var usedNative = false;
    if (nodes && nodes.length === visibleStrokes.length) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        if (!n || !n.getBBox) continue;
        var bb = null;
        try { bb = n.getBBox({ stroke: true }); } catch (e) { bb = null; }
        if (!bb || !isFinite(bb.width)) {
          try { bb = n.getBBox(); } catch (e2) { bb = null; }
          // 退化：getBBox({stroke}) 不支持时，手动补描边余量
          if (bb) {
            var half = vb * 0.05;   // ghost stroke-width = vb*0.10 → 半宽
            bb = { x: bb.x - half, y: bb.y - half,
                   width: bb.width + half * 2, height: bb.height + half * 2 };
          }
        }
        if (!bb) continue;
        usedNative = true;
        if (bb.x < x0) x0 = bb.x;
        if (bb.y < y0) y0 = bb.y;
        if (bb.x + bb.width > x1) x1 = bb.x + bb.width;
        if (bb.y + bb.height > y1) y1 = bb.y + bb.height;
      }
    }

    if (!usedNative) {
      // fallback：DOM getBBox 不可用时，用 Stroke.getBBox()（不含 stroke） + 手动补 ghost stroke 余量
      var half = (this._ghostStrokeWidth || vb * 0.05) / 2;
      this.strokes.forEach(function (s) {
        if (s.isTone) return;  // 同步跳过 tone，跟 ghost 渲染保持一致
        var b = s.getBBox();
        if (b.x - half < x0) x0 = b.x - half;
        if (b.y - half < y0) y0 = b.y - half;
        if (b.x + b.width + half > x1) x1 = b.x + b.width + half;
        if (b.y + b.height + half > y1) y1 = b.y + b.height + half;
      });
    }

    if (!isFinite(x0)) return null;
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  // ---- 计算 fit 变换：把联合 bbox 居中放大到 zone 可用区 ----
  ZoneStroke.prototype._computeTransform = function () {
    var bb = this._unionBBox();
    var vb = this.viewBox;
    if (!bb || bb.width <= 0 || bb.height <= 0) {
      return { scale: 1, dx: 0, dy: 0 };
    }
    // 拼音四线格：字母限位在 letterZone（x-height 到基线）
    if (this.letterZone) {
      var lz = this.letterZone;
      var scale = Math.min(lz.width / bb.width, lz.height / bb.height);
      var cx = bb.x + bb.width / 2;
      var cy = bb.y + bb.height / 2;
      return {
        scale: scale,
        dx: lz.cx - cx * scale,
        dy: lz.cy - cy * scale
      };
    }
    var avail = vb * (1 - this.padding * 2);   // 可用边长
    var scale = Math.min(avail / bb.width, avail / bb.height);
    // bbox 中心 → 视图中心
    var cx = bb.x + bb.width / 2;
    var cy = bb.y + bb.height / 2;
    return {
      scale: scale,
      dx: vb / 2 - cx * scale,
      dy: vb / 2 - cy * scale
    };
  };

  // 两阶段 fit：先以 identity 渲染一次量原生 bbox，再算 transform 并应用。
  // 单阶段（用自研 pathBBox）会有 10%+ 误差 → 溢出。
  ZoneStroke.prototype._fitPass = function () {
    var m = "translate(0 0) scale(1)";
    var groups = [this._gGhost, this._gGuide];
    groups.forEach(function (g) {
      for (var i = 0; i < g.childNodes.length; i++) {
        var n = g.childNodes[i];
        if (n.setAttribute) n.setAttribute("transform", m);
      }
    });
    var t = this._computeTransform();
    this._transform = t;
    return t;
  };

  ZoneStroke.prototype._applyTransform = function (paths) {
    var t = this._transform;
    if (!t) return;
    var m = "translate(" + t.dx.toFixed(2) + " " + t.dy.toFixed(2) + ") " +
            "scale(" + t.scale.toFixed(6) + ")";
    paths.forEach(function (p) {
      if (!p || !p.setAttribute) return;
      // tone 越过 fit transform，直接定位到 viewBox (toneX, toneY)
      if (p.classList && p.classList.contains("stroke-guide--tone")) {
        var s = p.__stroke__;
        if (s && typeof s.toneX === "number" && typeof s.toneY === "number") {
          p.setAttribute("transform",
            "translate(" + s.toneX.toFixed(2) + " " + s.toneY.toFixed(2) + ")");
          return;
        }
      }
      p.setAttribute("transform", m);
    });
  };

  // ---- 对外：设置笔画数据 ----
  ZoneStroke.prototype.setStrokes = function (strokes) {
    this.strokes = (strokes || []).slice();
    // render() 内部会走两阶段 fit（先 identity 量 bbox，再应用 transform）
    this.render();
    return this;
  };

  // ---- 渲染（ghost + guide）----
  ZoneStroke.prototype.render = function () {
    var vb = this.viewBox;
    var self = this;

    // 先清掉旧 transform，保证量出来的 bbox 是原始逻辑坐标
    this._transform = { scale: 1, dx: 0, dy: 0 };

    // 灰底稿：跳过 tone（声调不作为字母阴影存在）
    this._gGhost.innerHTML = "";
    if (this.showGhost) {
      this.strokes.forEach(function (s) {
        if (s.isTone) return;
        var p = el("path", {
          d: s.path,
          class: "stroke-ghost",
          "stroke-width": vb * 0.00165,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        });
        self._gGhost.appendChild(p);
      });
    }

    // 蓝引导（只放路径，序号作为「标注层」最后画）
    this._gGuide.innerHTML = "";
    if (this.showGuide) {
      this.strokes.forEach(function (s, i) {
        var p = el("path", {
          d: s.path,
          class: "stroke-guide" + (s.isTone ? " stroke-guide--tone" : ""),
          "data-idx": i,
          "stroke-width": s.isTone ? vb * 0.002 : vb * 0.00265,
          "stroke-linecap": "round",
          "stroke-linejoin": "round"
        });
        p.__stroke__ = s;
        self._gGuide.appendChild(p);
      });
    }

    // 两阶段 fit：量原生 bbox → 算 transform → 只应用到「笔画路径」
    this._fitPass();

    var glyph = [];
    for (var i = 0; i < this._gGhost.childNodes.length; i++) glyph.push(this._gGhost.childNodes[i]);
    for (var j = 0; j < this._gGuide.childNodes.length; j++) glyph.push(this._gGuide.childNodes[j]);
    this._applyTransform(glyph);

    // 序号 / 起点圆：标注层，直接画在「视图坐标」里。
    // 关键：它不能吃 fit 的 scale —— 否则小 bbox 的字母被放大 2~3 倍时，
    // 序号会被一起放大成怪物，而且每个字大小不一致。
    if (this.showGuide && this.showNumbers) {
      this._renderMarkers();
    }
    return this;
  };

  // 笔顺序号 + 起点圆（视图坐标，固定字号，贪心避让）
  ZoneStroke.prototype._renderMarkers = function () {
    var vb = this.viewBox;
    var dotR = vb * 0.019;    // 起点圆
    var haloR = vb * 0.030;   // 序号白底圈
    var font = vb * 0.044;    // 序号字号（视图坐标，固定）
    var slotR = vb * 0.085;   // 候选位第一圈半径
    var gap = vb * 0.090;     // 目标最小间距
    var edge = vb * 0.034;    // 距画布边留白

    // 8 方向 × 2 圈候选位
    var cand = [];
    for (var ri = 1; ri <= 2; ri++) {
      for (var ki = 0; ki < 8; ki++) {
        var ang = (Math.PI / 4) * ki;
        cand.push([Math.cos(ang) * slotR * ri, Math.sin(ang) * slotR * ri]);
      }
    }

    var placed = [];
    var self = this;
    this.strokes.forEach(function (s, i) {
      var sp = self.toViewPoint(s.startPoint());
      var best = null, bestScore = -Infinity;
      for (var c = 0; c < cand.length; c++) {
        var x = sp[0] + cand[c][0], y = sp[1] + cand[c][1];
        var inside = (x > edge && x < vb - edge && y > edge && y < vb - edge);
        var dmin = Infinity;
        for (var p = 0; p < placed.length; p++) {
          var dd = Math.sqrt(Math.pow(x - placed[p][0], 2) + Math.pow(y - placed[p][1], 2));
          if (dd < dmin) dmin = dd;
        }
        var dStart = Math.sqrt(Math.pow(cand[c][0], 2) + Math.pow(cand[c][1], 2));
        // 主：离已放置序号越远越好；次：离自己起笔点越近越好
        var score = (dmin === Infinity ? gap * 2 : dmin) * 4 - dStart;
        if (!inside) score -= vb * 4;
        if (score > bestScore) { bestScore = score; best = [x, y]; }
      }
      if (!best) best = [sp[0] + slotR, sp[1] - slotR];
      placed.push(best);

      self._gGuide.appendChild(el("circle", {
        cx: sp[0], cy: sp[1], r: dotR, class: "stroke-start-dot"
      }));
      self._gGuide.appendChild(el("circle", {
        cx: best[0], cy: best[1], r: haloR,
        fill: "#ffffff", stroke: "none", class: "stroke-start-halo"
      }));
      var txt = el("text", {
        x: best[0], y: best[1],
        class: "stroke-start-num",
        "text-anchor": "middle",
        "dominant-baseline": "central",
        "font-size": font,
        "font-weight": "800"
      });
      txt.textContent = String(s.index || i + 1);
      self._gGuide.appendChild(txt);
    });
  };

  // ---- 笔顺揭示动画：逐笔点亮 ----
  ZoneStroke.prototype.reveal = function (options) {
    var opts = options || {};
    var interval = typeof opts.interval === "number" ? opts.interval : 500;
    var onDone = opts.onDone;
    var paths = this._gGuide.querySelectorAll(".stroke-guide");
    // 每笔 3 个标记：起点圆 + 白底圈 + 序号数字，顺序与 render() 压入一致
    var marks = this._gGuide.querySelectorAll(".stroke-start-dot,.stroke-start-halo,.stroke-start-num");
    var i = 0;
    var self = this;
    if (this._revealTimer) clearTimeout(this._revealTimer);
    function step() {
      if (i >= paths.length) {
        self._revealTimer = null;
        if (onDone) onDone();
        return;
      }
      paths[i].classList.add("is-revealed");
      var base = i * 3;
      if (marks[base]) marks[base].classList.add("is-revealed");
      if (marks[base + 1]) marks[base + 1].classList.add("is-revealed");
      if (marks[base + 2]) marks[base + 2].classList.add("is-revealed");
      i++;
      self._revealTimer = setTimeout(step, interval);
    }
    step();
    return this;
  };

  ZoneStroke.prototype.stopReveal = function () {
    if (this._revealTimer) {
      clearTimeout(this._revealTimer);
      this._revealTimer = null;
    }
    return this;
  };

  // ---- 用户墨迹 ----
  ZoneStroke.prototype.setInk = function (penPaths) {
    this.ink = (penPaths || []).slice();
    this.renderInk();
    return this;
  };

  ZoneStroke.prototype.renderInk = function () {
    var vb = this.viewBox;
    var g = this._gInk;
    g.innerHTML = "";
    this.ink.forEach(function (pen) {
      var p = el("path", {
        d: pen.toSVGPath(vb, vb),
        class: "stroke-ink",
        "stroke-width": vb * 0.045,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      });
      g.appendChild(p);
    });
    return this;
  };

  ZoneStroke.prototype.addInk = function (pen) {
    this.ink.push(pen);
    this.renderInk();
    return this;
  };

  ZoneStroke.prototype.clearInk = function () {
    this.ink = [];
    this._gInk.innerHTML = "";
    return this;
  };

  // ---- 尺寸变化后重新 fit ----
  ZoneStroke.prototype.fit = function () {
    this._transform = this._computeTransform();
    this.render();
    this.renderInk();
    return this;
  };

  ZoneStroke.prototype.clear = function () {
    this.stopReveal();
    this.strokes = [];
    this.ink = [];
    this._gGhost.innerHTML = "";
    this._gGuide.innerHTML = "";
    this._gInk.innerHTML = "";
    return this;
  };

  ZoneStroke.prototype.getTransform = function () { return this._transform; };

  // 逻辑坐标 ↔ 渲染 viewBox 坐标。任何交互校验必须经这两个入口，
  // 否则 auto-fit 后看到的字形与判定目标会落在不同坐标系。
  ZoneStroke.prototype.toViewPoint = function (point) {
    var t = this._transform || { scale: 1, dx: 0, dy: 0 };
    return [t.dx + point[0] * t.scale, t.dy + point[1] * t.scale];
  };

  ZoneStroke.prototype.fromViewPoint = function (point) {
    var t = this._transform || { scale: 1, dx: 0, dy: 0 };
    if (!t.scale) return point.slice();
    return [(point[0] - t.dx) / t.scale, (point[1] - t.dy) / t.scale];
  };

  ZoneStroke.prototype._pathGuidePoints = function (stroke, samples) {
    var path = null;
    var nodes = this._gGuide ? this._gGuide.querySelectorAll(".stroke-guide") : [];
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].__stroke__ === stroke) { path = nodes[i]; break; }
    }
    if (!path || !path.getTotalLength || !path.getPointAtLength) return [];
    try {
      var length = path.getTotalLength();
      if (!isFinite(length) || length <= 0) return [];
      var count = Math.max(2, samples || 32);
      var points = [];
      for (var j = 0; j < count; j++) {
        var p = path.getPointAtLength(length * j / (count - 1));
        points.push(this.toViewPoint([p.x, p.y]));
      }
      return points;
    } catch (err) {
      return [];
    }
  };

  // 返回渲染后、归一化到 [0,1] 的中轴线点。汉字优先使用权威 median；
  // 尚未补 skeleton 的数字/拼音，临时从其中心线 path 采样。
  ZoneStroke.prototype.getValidationGuide = function (stroke, samples) {
    if (!stroke || stroke.isTone) return [];
    var points = typeof stroke.hasMedian === "function" && stroke.hasMedian()
      ? stroke.medianPoints().map(this.toViewPoint.bind(this))
      : this._pathGuidePoints(stroke, samples);
    var vb = this.viewBox;
    return points.map(function (p) { return [p[0] / vb, p[1] / vb]; });
  };

  // 归一化点 → 容器内 CSS 像素坐标（供命中/绘制用）
  ZoneStroke.prototype.toScreen = function (nx, ny) {
    var rect = this._svg.getBoundingClientRect();
    // viewBox 是正方形，preserveAspectRatio=xMidYMid meet
    var side = Math.min(rect.width, rect.height);
    var offX = rect.left + (rect.width - side) / 2;
    var offY = rect.top + (rect.height - side) / 2;
    return [offX + nx * side, offY + ny * side];
  };

  // 容器内 pointer 事件 → 渲染 viewBox 的归一化 [0,1] 坐标。
  ZoneStroke.prototype.fromEvent = function (evt) {
    var rect = this._svg.getBoundingClientRect();
    var side = Math.min(rect.width, rect.height);
    var offX = rect.left + (rect.width - side) / 2;
    var offY = rect.top + (rect.height - side) / 2;
    return [
      (evt.clientX - offX) / side,
      (evt.clientY - offY) / side
    ];
  };

  ZoneStroke.prototype.destroy = function () {
    this.stopReveal();
    if (this._resizeHandler) {
      global.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
    if (this._svg && this._svg.parentNode) {
      this._svg.parentNode.removeChild(this._svg);
    }
    this._svg = null;
  };

  global.ZoneStroke = ZoneStroke;
})(window);
