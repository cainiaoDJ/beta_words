#!/usr/bin/env python3
"""Phase 9 — 算式卡「旧 vs 新」对比图

左：旧版 300x300 正方形方框
右：新版 332x200 纸质名片卡（正面 / 背面 / 翻起侧立）

用法：
  python3 gen_card_compare.py
产出：
  screens/card-compare.html  +  out/card-compare.png
"""
import os
import subprocess
import time

BASE = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(BASE, "screens")
OUT = os.path.join(BASE, "out")
CHROME = "/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"

CSS = """
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1160px;
    height: 680px;
    background: #f5f7f3;
    font-family: system-ui, -apple-system, "PingFang SC", "Noto Sans CJK SC", sans-serif;
    padding: 30px 34px;
  }
  h1 { font-size: 22px; font-weight: 900; color: #22302a; margin-bottom: 5px; }
  .sub { font-size: 13px; color: #5b6b62; margin-bottom: 24px; }
  .cols { display: flex; gap: 34px; align-items: flex-start; }
  .col { flex: 1; }
  .col-head {
    font-size: 15px; font-weight: 800; color: #22302a;
    margin-bottom: 4px;
  }
  .col-sub { font-size: 12px; color: #5b6b62; margin-bottom: 16px; line-height: 1.5; }
  .stagebox {
    background: #e9ede8;
    border-radius: 14px;
    padding: 22px 20px;
    display: flex; gap: 16px; align-items: flex-start;
    min-height: 268px;
  }
  .stagebox.new { background: #f0ece2; }

  /* ---- 旧版：正方形方框 ---- */
  .old-card {
    width: 200px; height: 200px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.08);
    box-shadow: 0 2px 4px rgba(0,0,0,.06);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; font-weight: 900; color: #22302a;
    position: relative;
  }
  .old-card .op { color: #ec4899; }
  .old-tag {
    position: absolute; top: 12px; left: 12px;
    font-size: 11px; font-weight: 700; color: #6b7a72;
  }

  /* ---- 新版：纸卡 ---- */
  .new-slot { perspective: 1100px; }
  .new-card {
    width: 250px; height: 151px;
    position: relative;
    transform-style: preserve-3d;
  }
  .new-card.is-front .inner { transform: rotateY(0deg); }
  .new-card.is-back  .inner { transform: rotateY(180deg); }
  .new-card.is-side  .inner { transform: rotateY(-52deg); }
  .new-card .inner {
    position: relative; width: 100%; height: 100%;
    transform-style: preserve-3d;
    transition: none;
  }
  .new-card .face {
    position: absolute; inset: 0;
    backface-visibility: hidden;
    border-radius: 8px;
    background-color: var(--tile);
    background-image:
      linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,0) 42%),
      repeating-linear-gradient(90deg, rgba(186,164,122,.045) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(0deg, rgba(186,164,122,.035) 0 1px, transparent 1px 3px);
    border: 1px solid rgba(122,100,68,.16);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.95),
      inset 0 -1px 0 rgba(122,100,68,.08),
      0 2px 3px rgba(31,44,36,.1),
      0 14px 22px -12px rgba(31,44,36,.3);
  }
  .new-card .face.front { transform: none; }
  .new-card .face.back {
    transform: rotateY(180deg);
    background-color: #faf6ec;
    display: grid; place-items: center;
  }
  .wm { font-size: 40px; font-weight: 900; color: rgba(236,72,153,.18); }
  .eq {
    position: absolute; inset: 30px 0 8px;
    display: flex; align-items: center; justify-content: center;
    white-space: nowrap;
    font-size: 38px; font-weight: 900; color: #22302a;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 0 rgba(255,255,255,.9);
  }
  .eq .op { color: #be185d; margin: 0 5px; }
  .eq .q { color: #ec4899; }
  .head {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 14px 0;
  }
  .badge {
    font-size: 10px; font-weight: 800; color: #be185d;
    background: rgba(236,72,153,.15); border-radius: 4px; padding: 3px 7px;
  }
  .lab { font-size: 10px; font-weight: 700; color: #6b7a72; }
  .cap { font-size: 11px; font-weight: 700; color: #5b6b62; text-align: center; margin-top: 10px; }
  .old-notes { margin-top: 16px; font-size: 12px; color: #5b6b62; line-height: 1.7; }
  .old-notes b { color: #22302a; }
  .new-notes { margin-top: 16px; font-size: 12px; color: #5b6b62; line-height: 1.7; }
  .new-notes b { color: #22302a; }
"""

HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>算式卡 旧 vs 新</title>
<link rel="stylesheet" href="../styles.css">
<link rel="stylesheet" href="../mockup.css">
<style>%s</style>
</head>
<body data-game="mathFlash">
  <h1>算式卡改版 · 旧 vs 新</h1>
  <p class="sub">旧版 300×300 正方形方框 → 新版 332×200 名片比例纸卡（比例 1.66，贴 90×54mm 标准名片），带纸纹 / 分层投影，并新增翻卡动效。卡片<b>摆正不倾斜</b>（2026-11-01 定稿）。</p>
  <div class="cols">
    <div class="col">
      <div class="col-head">旧版 · 正方形方框</div>
      <div class="col-sub">300 × 300 方框，框内居中一个算式，没有卡片的质感</div>
      <div class="stagebox">
        <div>
          <div class="old-card">
            <span class="old-tag">10 以内加法</span>
            4<span class="op">+</span>3<span class="op">=</span><span class="op">?</span>
          </div>
          <div class="cap">旧</div>
        </div>
      </div>
      <div class="old-notes">
        <b>问题</b><br>
        · 正方形边框，像一个输入框 / 对话框<br>
        · 白底纯色，没有材质<br>
        · 算式孤立，看不出"这是一张卡"<br>
        · 静态，没有动效
      </div>
    </div>

    <div class="col">
      <div class="col-head">新版 · 纸质名片卡</div>
      <div class="col-sub">332 × 200，纸纹 + 分层投影，摆正不倾斜，正反双面可翻</div>
      <div class="stagebox new">
        <div class="new-slot">
          <div class="new-card is-front"><div class="inner">
            <div class="face front">
              <div class="head"><span class="badge">10 以内加法</span><span class="lab">第 2 题</span></div>
              <div class="eq"><span>4</span><span class="op">+</span><span>3</span><span class="op">=</span><span class="q">?</span></div>
            </div>
            <div class="face back"><div class="wm">6 + 7</div></div>
          </div></div>
          <div class="cap">正面（题目）</div>
        </div>
        <div class="new-slot">
          <div class="new-card is-side"><div class="inner">
            <div class="face front">
              <div class="head"><span class="badge">10 以内加法</span><span class="lab">第 2 题</span></div>
              <div class="eq"><span>4</span><span class="op">+</span><span>3</span><span class="op">=</span><span class="q">?</span></div>
            </div>
            <div class="face back"><div class="wm">6 + 7</div></div>
          </div></div>
          <div class="cap">翻起 52°</div>
        </div>
        <div class="new-slot">
          <div class="new-card is-back"><div class="inner">
            <div class="face front">
              <div class="head"><span class="badge">10 以内加法</span><span class="lab">第 2 题</span></div>
              <div class="eq"><span>4</span><span class="op">+</span><span>3</span><span class="op">=</span><span class="q">?</span></div>
            </div>
            <div class="face back"><div class="wm">6 + 7</div></div>
          </div></div>
          <div class="cap">背面（下一题）</div>
        </div>
      </div>
      <div class="new-notes">
        <b>改动</b><br>
        · 比例 1 : 1 → <b>1.66 : 1</b>（标准名片比例），横向更像"一张拿在手里的卡"<br>
        · 暖白纸底 + 双向纤维纹理 + 上沿高光 / 下沿厚度<br>
        · 分层投影：接触影 + 环境影 → 纸片浮在桌面上<br>
        · <b>摆正不倾斜</b>，不靠摆放倾角制造手感<br>
        · 双面结构，绕 Y 轴 <b>480ms</b> 翻转完成翻页<br>
        · 角标（关卡名 / 第 N 题）+ 底部倒计时条
      </div>
    </div>
  </div>
</body>
</html>
""" % CSS


def main():
    os.makedirs(SCREENS, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(SCREENS, "card-compare.html")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(HTML)

    png = os.path.join(OUT, "card-compare.png")
    for attempt in range(4):
        if os.path.exists(png):
            os.remove(png)
        subprocess.run([
            CHROME, "--headless", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--force-device-scale-factor=2",
            "--window-size=1160,680", "--virtual-time-budget=2500",
            "--screenshot=" + png, "file://" + path,
        ], check=False, capture_output=True)
        if os.path.exists(png) and os.path.getsize(png) > 20000:
            break
        time.sleep(0.4)
    print("rendered card-compare", os.path.getsize(png) if os.path.exists(png) else "FAIL")


if __name__ == "__main__":
    main()
