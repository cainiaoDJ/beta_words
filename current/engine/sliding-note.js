// engine/sliding-note.js
// 自研引擎: DDR/歌词风格滑动音符
// 用途: stroopTrain 制造时间压力 (note 滑过 hit zone 玩家必须准确点击)
//      每帧 rAF 跟踪 progress, hit zone [0.3, 0.7] 之间可点击
//      miss = note 滑出 hit zone 未选 / 选错
//
// 用法:
//   const note = new SlidingNote({
//     question: { id, word, colorName, colorCss },
//     trackElement: trackDiv,
//     duration: 3000,           // ms 滑完全程
//     delay: 0,                  // 延迟启动
//     hitZoneStart: 0.3,         // 命中区起点 (0~1)
//     hitZoneEnd: 0.7,           // 命中区终点
//     onSelect: (note, color) => {},
//     onHit: (note) => {},
//     onMiss: (note) => {}
//   });
//   note.start();
//   note.selectColor('红色');  // 玩家点击颜色
//   note.destroy();
//
// State machine: pending → active → hit/miss → done
// 视觉:
//   - 字符 line 1: 大字 (28px) Stroop 色 (固定)
//   - 色名 line 2: 小字 (14px) 初始 = 问题.colorName, 选中后改为玩家选的
//   - hit zone 激活: scale 1.15 + 黄光晕
//   - hit: pause 动画 + 绿光
//   - miss: pause + 红光
//   - missed: 灰掉 + opacity 0.3
//
// 跟 engine/marquee.js (文字原地轮换) 同风格: vanilla IIFE, window 全局
// StroopTrain 后续可能两种都用 (marquee 备用)

(function (global) {
  "use strict";

  class SlidingNote {
    constructor(options) {
      var opts = options || {};
      this.question = opts.question;        // { id, word, colorName, colorCss }
      this.trackElement = opts.trackElement;
      this.duration = typeof opts.duration === "number" && opts.duration > 0
        ? opts.duration
        : 3000;
      this.delay = typeof opts.delay === "number" && opts.delay >= 0
        ? opts.delay
        : 0;
      this.hitZoneStart = typeof opts.hitZoneStart === "number"
        ? opts.hitZoneStart
        : 0.65;  // 竖向 DDR: hit zone 在底部 (70%-90% of slide progress)
      this.hitZoneEnd = typeof opts.hitZoneEnd === "number"
        ? opts.hitZoneEnd
        : 0.85;
      this.onSelect = typeof opts.onSelect === "function" ? opts.onSelect : function () {};
      this.onHit = typeof opts.onHit === "function" ? opts.onHit : function () {};
      this.onMiss = typeof opts.onMiss === "function" ? opts.onMiss : function () {};

      this.element = null;
      this.state = "pending";  // pending → active → hit/miss/missed → done
      this.startTime = null;
      this.rafId = null;
    }

    start() {
      this._render();
      this.startTime = performance.now() + this.delay;

      // CSS 动画: 从右滑到左
      this.element.style.animationDuration = this.duration + "ms";
      this.element.style.animationDelay = this.delay + "ms";
      // 强制 reflow 后加 class, 触发动画
      void this.element.offsetWidth;
      this.element.classList.add("sliding");

      // rAF 跟踪 progress
      var self = this;
      this.rafId = requestAnimationFrame(function () { self._tick(); });
    }

    _render() {
      var q = this.question;
      this.element = document.createElement("div");
      this.element.className = "sliding-note";
      this.element.dataset.id = q.id || "";

      // Line 1: 字符 (Stroop 色固定, 制造干扰)
      var charLine = document.createElement("div");
      charLine.className = "sliding-note-char";
      charLine.textContent = q.word;
      charLine.style.color = q.colorCss;
      this.element.appendChild(charLine);

      // Line 2: 色名 (初始隐藏 — 玩家不靠读这个, 靠看色判断; 选中后显示)
      var colorLine = document.createElement("div");
      colorLine.className = "sliding-note-color";
      colorLine.textContent = "??";  // 占位提示, 选中后改为玩家选的颜色名
      this.element.appendChild(colorLine);

      this.trackElement.appendChild(this.element);
    }

    _tick() {
      if (this.state === "done") return;

      var elapsed = performance.now() - this.startTime;
      if (elapsed < 0) {
        var self = this;
        this.rafId = requestAnimationFrame(function () { self._tick(); });
        return;
      }

      var progress = elapsed / this.duration;

      // Hit zone 检测
      if (progress >= this.hitZoneStart && progress <= this.hitZoneEnd) {
        if (this.state === "pending") {
          this.state = "active";
          if (this.element) this.element.classList.add("in-hit-zone");
        }
      } else if (progress > this.hitZoneEnd) {
        // 滑出 hit zone
        if (this.state === "pending" || this.state === "active") {
          this.state = "missed";
          if (this.element) {
            this.element.classList.remove("in-hit-zone");
            this.element.classList.add("missed");
          }
          this.onMiss(this);
        }
        this.state = "done";
        return;
      }

      var self = this;
      this.rafId = requestAnimationFrame(function () { self._tick(); });
    }

    selectColor(colorName) {
      if (this.state === "done" || this.state === "hit" || this.state === "miss" || this.state === "missed") return;

      // 反馈: 玩家选了什么, 显示什么色 (CSS 自动 opacity 0→1)
      this.onSelect(this, colorName);
      if (this.element) {
        var colorLine = this.element.querySelector(".sliding-note-color");
        if (colorLine) {
          colorLine.textContent = colorName;
          colorLine.classList.add("revealed");
        }
      }

      if (this.state === "active") {
        // 在 hit zone 内: 判对错
        if (colorName === this.question.colorName) {
          this.state = "hit";
          if (this.element) {
            this.element.classList.remove("in-hit-zone");
            this.element.classList.add("hit");
          }
          this.onHit(this);
        } else {
          this.state = "miss";
          if (this.element) {
            this.element.classList.remove("in-hit-zone");
            this.element.classList.add("miss");
          }
          this.onMiss(this);
        }
      }
      // state === 'pending' (未到 hit zone): 点击浪费, note 继续滑
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      if (this.element && this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.state = "done";
    }
  }

  global.SlidingNote = SlidingNote;
})(typeof window !== "undefined" ? window : this);
