// stage.js — 简易 2D 游戏舞台引擎
//
// 设计画布（logical canvas）固定 360x640，通过 transform: scale 等比缩放到 viewport。
// 锁比例让 UI 不用写多套 breakpoint。
//
// 用法：
//   <div class="stage">
//     <div class="stage-canvas">
//       <main class="app"> ... </main>
//     </div>
//   </div>
//   <script>new GameStage(document.querySelector('.stage'));</script>
//
// 内部布局直接用设计画布坐标（px），由 transform: scale 自动缩放。

(function (global) {
  'use strict';

  // 设计画布（logical）— iPhone SE 2nd (375x667) 实测可视区域为基准，
  // 取稍小的 360x640 留点余量，整体紧凑不浪费屏幕
  var DESIGN_W = 360;
  var DESIGN_H = 640;

  function GameStage(rootEl) {
    if (!rootEl) throw new Error('GameStage: rootEl required');
    this.root = rootEl;
    this.canvas = rootEl.querySelector('.stage-canvas');
    if (!this.canvas) {
      // 兼容：如果没找到 .stage-canvas，把 rootEl 当 canvas
      this.canvas = rootEl;
    }
    this.lastSf = 0;
    this._tick = this.update.bind(this);
    this.update();
    window.addEventListener('resize', this._tick);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this._tick);
    }
  }

  GameStage.prototype.update = function () {
    var vpW = window.innerWidth;
    var vpH = window.innerHeight;

    // 360x640 等比缩放，宽度撑满屏幕（不设 SAFE_PADDING，竖屏时 sf = vpW/360 自然撑满宽度）
    // 横屏 / 桌面宽屏时高度受限，左右留黑边（黑色 letterbox，符合设计）
    var sf = Math.min(vpW / DESIGN_W, vpH / DESIGN_H);

    // 应用到 canvas：固定设计尺寸 + transform 缩放 + 居中
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.width = DESIGN_W + 'px';
    this.canvas.style.height = DESIGN_H + 'px';
    this.canvas.style.transformOrigin = 'center center';
    this.canvas.style.transform = 'translate(-50%, -50%) scale(' + sf + ')';

    // 暴露 CSS 变量供内部使用（如果需要用 calc(var(--sf) * Npx) 的地方）
    this.canvas.style.setProperty('--sf', String(sf));
    this.canvas.style.setProperty('--design-w', DESIGN_W + 'px');
    this.canvas.style.setProperty('--design-h', DESIGN_H + 'px');

    this.lastSf = sf;
  };

  GameStage.prototype.destroy = function () {
    window.removeEventListener('resize', this._tick);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this._tick);
    }
  };

  // 静态访问设计尺寸（其他模块如果需要）
  GameStage.DESIGN_W = DESIGN_W;
  GameStage.DESIGN_H = DESIGN_H;

  global.GameStage = GameStage;
})(window);