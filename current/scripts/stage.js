// stage.js — 简易 2D 游戏舞台引擎
//
// 设计画布（logical canvas）尺寸固定，运行时整体等比缩放到 viewport。
// 像 2D 游戏引擎一样锁比例，UI 不写多套 breakpoint。
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

  // viewport 距离边框的安全 padding（CSS px）
  // 设计画布 fit 到 (vpW - 2*SAFE_PADDING) × (vpH - 2*SAFE_PADDING) 的可用区
  var SAFE_PADDING = 20;

  // 极小屏 fallback：可用区小于 MIN_AVAIL 时按 viewport 比例锁最小
  var MIN_AVAIL_W = 280;
  var MIN_AVAIL_H = 480;

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

    // 可用区
    var availW = Math.max(MIN_AVAIL_W, vpW - SAFE_PADDING * 2);
    var availH = Math.max(MIN_AVAIL_H, vpH - SAFE_PADDING * 2);

    // fit-to-window：取 min 保证完整显示
    var sf = Math.min(availW / DESIGN_W, availH / DESIGN_H);

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
  GameStage.SAFE_PADDING = SAFE_PADDING;

  global.GameStage = GameStage;
})(window);