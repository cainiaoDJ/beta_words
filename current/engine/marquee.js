// engine/marquee.js
// 自研引擎: 跑马灯文字效果
// 用途: 同格内字符快速轮换, 制造专注度压力 (Stroop 增强)
//      每帧在 element.textContent 写一个 character, 周期循环
//
// 用法:
//   const engine = new MarqueeEngine(element, {
//     characters: ["红", "蓝", "绿"],
//     interval: 500,         // ms per character
//     onTick: function(ch) {} // 可选: 每次轮换回调
//   });
//   engine.start();
//   engine.pause();     // 暂停, 保留当前字符
//   engine.resume();    // 继续
//   engine.stop();      // 停止, 保留当前字符
//   engine.setInterval(300);   // 动态调整速度
//   engine.setCharacters(["黑", "白"]);  // 切换字符池
//
// 引擎与游戏解耦: 只负责 textContent 轮换, 视觉样式由游戏自己定
// 跟 engine/idiom-cylinder.js (滚筒 3D rotateX) 同一套风格: vanilla IIFE, 暴露 window 全局

(function (global) {
  "use strict";

  class MarqueeEngine {
    constructor(element, options) {
      if (!element) {
        throw new Error("MarqueeEngine: element required");
      }
      var opts = options || {};
      this.element = element;
      this.characters =
        Array.isArray(opts.characters) && opts.characters.length > 0
          ? opts.characters.slice()
          : ["红", "蓝", "绿", "黄"];
      this.interval =
        typeof opts.interval === "number" && opts.interval > 0
          ? opts.interval
          : 500;
      this.onTick =
        typeof opts.onTick === "function" ? opts.onTick : null;
      this.currentIndex = 0;
      this.timerId = null;
      this.paused = false;
      // bind for setInterval 回调
      this._tick = this._tick.bind(this);
    }

    start() {
      if (this.timerId) return;
      this.paused = false;
      // 立即显示第一个字符, 不等一个 interval
      this._tick();
      this.timerId = setInterval(this._tick, this.interval);
    }

    pause() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      this.paused = true;
    }

    resume() {
      if (this.timerId || !this.paused) return;
      this.timerId = setInterval(this._tick, this.interval);
      this.paused = false;
    }

    stop() {
      if (this.timerId) {
        clearInterval(this.timerId);
        this.timerId = null;
      }
      this.paused = false;
    }

    setInterval(ms) {
      if (typeof ms !== "number" || ms <= 0) return;
      this.interval = ms;
      if (this.timerId) {
        var wasRunning = !this.paused;
        this.stop();
        if (wasRunning) this.start();
      }
    }

    setCharacters(chars) {
      if (!Array.isArray(chars) || chars.length === 0) return;
      this.characters = chars.slice();
      this.currentIndex = 0;
      this._tick();
    }

    _tick() {
      if (this.characters.length === 0) return;
      var ch = this.characters[this.currentIndex];
      this.element.textContent = ch;
      if (this.onTick) this.onTick(ch);
      this.currentIndex = (this.currentIndex + 1) % this.characters.length;
    }
  }

  global.MarqueeEngine = MarqueeEngine;
})(typeof window !== "undefined" ? window : this);
