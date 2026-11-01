#!/usr/bin/env python3
"""Phase 9 — 算术闪卡「翻卡」动效分解图

独立宽幅画布（非手机屏），用同一套 mockup.css 渲染 4 帧翻卡过程，
说明卡片从正面翻到背面（换题）时的姿态。

用法：
  python3 gen_flip_diagram.py
产出：
  screens/flip-diagram.html  +  out/flip-diagram.png
"""
import os
import subprocess
import time

BASE = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(BASE, "screens")
OUT = os.path.join(BASE, "out")
CHROME = "/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"

# 每帧：槽位 class + 卡片内容 + 标题
FRAMES = [
    ("is-a", "① 正面", "4 + 3 = ?", "题目卡正面，纸质名片比例 332×200"),
    ("is-b", "② 翻起 30°", "4 + 3 = ?", "卡片绕 Y 轴抬起，纸面开始侧转"),
    ("is-c", "③ 翻起 65°", "4 + 3 = ?", "接近侧立，只剩窄条，透出纸卡折脊"),
    ("is-d", "④ 背面", "", "背面素纸，露出新题（下一题）"),
]

CSS = """
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1180px;
    height: 420px;
    background: #f5f7f3;
    font-family: system-ui, -apple-system, "PingFang SC", "Noto Sans CJK SC", sans-serif;
    padding: 28px 32px;
  }
  .diagram-title {
    font-size: 20px;
    font-weight: 900;
    color: #22302a;
    margin-bottom: 4px;
  }
  .diagram-sub {
    font-size: 13px;
    color: #5b6b62;
    margin-bottom: 26px;
  }
  .row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }
  .cell {
    flex: 0 0 244px;
    text-align: center;
  }
  .slot {
    position: relative;
    width: 236px;
    height: 142px;
    perspective: 900px;
    margin: 0 auto 14px;
  }
  .slot .math-card {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    aspect-ratio: auto;
  }
  .slot .math-card__inner { transition: none; }
  .slot.is-a .math-card__inner { transform: rotateY(0deg); }
  .slot.is-b .math-card__inner { transform: rotateY(-30deg); }
  .slot.is-c .math-card__inner { transform: rotateY(-65deg); }
  .slot.is-d .math-card__inner { transform: rotateY(-180deg); }
  .slot.is-d .math-card__face--front { opacity: 0; }
  .slot.is-d .math-card__face--back {
    transform: rotateY(180deg) rotate(-2deg);
    opacity: 1;
  }
  .cap {
    font-size: 15px;
    font-weight: 800;
    color: #22302a;
    margin-bottom: 4px;
  }
  .note {
    font-size: 12px;
    color: #5b6b62;
    line-height: 1.5;
  }
  .arrow {
    flex: 0 0 auto;
    align-self: center;
    font-size: 26px;
    color: #ec4899;
    font-weight: 900;
    margin-top: -22px;
  }
"""


def build():
    cells = []
    for idx, (cls, cap, _eq, note) in enumerate(FRAMES):
        if cls == "is-d":
            card_html = """
            <div class="math-card">
              <div class="math-card__inner">
                <div class="math-card__face math-card__face--front"></div>
                <div class="math-card__face math-card__face--back">
                  <div class="math-card__watermark">6 + 7</div>
                </div>
              </div>
            </div>"""
        else:
            card_html = """
            <div class="math-card">
              <div class="math-card__inner">
                <div class="math-card__face math-card__face--front">
                  <div class="math-card__head">
                    <span class="math-card__badge">10 以内加法</span>
                    <span class="math-card__label">第 2 题</span>
                  </div>
                  <div class="math-eq">
                    <span>4</span><span class="op">+</span><span>3</span>
                    <span class="op">=</span><span class="q">?</span>
                  </div>
                </div>
                <div class="math-card__face math-card__face--back">
                  <div class="math-card__watermark">6 + 7</div>
                </div>
              </div>
            </div>"""
        cells.append(
            '<div class="cell"><div class="slot %s">%s</div>'
            '<div class="cap">%s</div><div class="note">%s</div></div>'
            % (cls, card_html, cap, note)
        )
        if idx < len(FRAMES) - 1:
            cells.append('<div class="arrow">→</div>')

    return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>翻卡动效分解</title>
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../mockup.css">
<style>%s</style>
</head>
<body data-game="mathFlash">
  <h1 class="diagram-title">算术闪卡 · 翻卡动效分解</h1>
  <p class="diagram-sub">纸质名片卡（332×200，比例 1.66）绕 Y 轴翻转；翻页时旧卡翻走、下一题卡从背面转出，全程约 480ms。</p>
  <div class="row">%s</div>
</body>
</html>""" % (CSS, "".join(cells))


def main():
    os.makedirs(SCREENS, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    html = build()
    path = os.path.join(SCREENS, "flip-diagram.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(html)

    png = os.path.join(OUT, "flip-diagram.png")
    if os.path.exists(png):
        os.remove(png)
    subprocess.run([
        CHROME, "--headless", "--disable-gpu", "--no-sandbox",
        "--hide-scrollbars", "--force-device-scale-factor=2",
        "--window-size=1180,420", "--virtual-time-budget=2500",
        "--screenshot=" + png, "file://" + path,
    ], check=False, capture_output=True)

    for _ in range(3):
        if os.path.exists(png) and os.path.getsize(png) > 20000:
            break
        time.sleep(0.4)
        if os.path.exists(png):
            os.remove(png)
        subprocess.run([
            CHROME, "--headless", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--force-device-scale-factor=2",
            "--window-size=1180,420", "--virtual-time-budget=2500",
            "--screenshot=" + png, "file://" + path,
        ], check=False, capture_output=True)
    print("rendered flip-diagram", os.path.getsize(png) if os.path.exists(png) else "FAIL")


if __name__ == "__main__":
    main()
