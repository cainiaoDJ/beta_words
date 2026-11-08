#!/usr/bin/env python3
"""Phase 11 — 算术闪卡「全量随机 + 计时评星」设计稿生成器

用线上真实 styles.css + 本阶段 mockup.css 渲染 6 个界面，
每屏 360x640（设计画布），chromium --screenshot 出图。

用法：
  python3 gen_mockups.py
产出：
  screens/*.html  +  out/*.png
"""
import os
import subprocess
import shutil
import time

BASE = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(BASE, "screens")
OUT = os.path.join(BASE, "out")
CHROME = "/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"

# ---------------------------------------------------------------- 真实奖杯 SVG
# 逐字取自产品 current/index.html 的 #complete-panel 三档奖杯。
# 设计稿另画奖杯会出现「奖杯是黑的」这种与线上不一致的假象 —— 必须复用。
TROPHY_SVG = {
    "bronze": """<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 18c-4 0-4 10 0 10" stroke="#cd7f32" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M56 18c4 0 4 10 0 10" stroke="#cd7f32" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#cd7f32"/>
                <path d="M16 12h32v3H16z" fill="#e89858"/>
                <rect x="24" y="44" width="16" height="4" fill="#a6611f"/>
                <rect x="18" y="48" width="28" height="6" rx="1" fill="#8b4a0f"/>
                <text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#fff8d8" font-family="system-ui">3</text>
              </svg>""",
    "silver": """<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 18c-4 0-4 10 0 10" stroke="#c0c0c0" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M56 18c4 0 4 10 0 10" stroke="#c0c0c0" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#d4d4d4"/>
                <path d="M16 12h32v3H16z" fill="#f0f0f0"/>
                <rect x="24" y="44" width="16" height="4" fill="#a0a0a0"/>
                <rect x="18" y="48" width="28" height="6" rx="1" fill="#808080"/>
                <text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="system-ui">2</text>
              </svg>""",
    "gold": """<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 18c-4 0-4 10 0 10" stroke="#f7d75c" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M56 18c4 0 4 10 0 10" stroke="#f7d75c" stroke-width="3" fill="none" stroke-linecap="round"/>
                <path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#f7d75c"/>
                <path d="M16 12h32v3H16z" fill="#fff3a8"/>
                <rect x="24" y="44" width="16" height="4" fill="#d4a72c"/>
                <rect x="18" y="48" width="28" height="6" rx="1" fill="#a3780f"/>
                <text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#5a4500" font-family="system-ui">1</text>
              </svg>""",
}


# ---------------------------------------------------------------- 公共片段

TOPBAR = """
        <div class="game-topbar">
          <button class="text-button" type="button" data-action="back-setup">换关卡</button>
          <div>
            <p id="game-subtitle" class="eyebrow">算术闪卡</p>
            <h2 id="game-title">算一算，选答案</h2>
          </div>
          <div class="game-topbar-right">
            <img class="mascot-host game-mascot" src="../screens/assets/mascot-wave.svg" alt="小书本" />
            <button id="replay-sound" class="round-button" type="button" aria-label="再听一遍">听</button>
          </div>
        </div>
"""


def hud(progress="12 / 45", timer="00:24", timer_cls="", hint="选一个答案"):
    cls = "hud-timer" + (" " + timer_cls if timer_cls else "")
    return """
        <div class="game-hud" aria-label="游戏状态">
          <span id="progress" class="hud-progress">%s</span>
          <span id="timer" class="%s">%s</span>
          <span id="hint" class="hud-hint">%s</span>
        </div>
""" % (progress, cls, timer, hint)


def card(eq_left, op, eq_right, badge="", question_label=""):
    """闪卡：纸质名片，正面是算式。困难模式的 .math-card__timer 进度条已移除。"""
    badge_html = '<span class="math-card__badge">%s</span>' % badge if badge else ""
    label = '<span class="math-card__label">%s</span>' % question_label if question_label else ""
    return """
        <div class="math-card zone-primary" aria-label="题目卡片">
          <div class="math-card__inner">
            <div class="math-card__face math-card__face--front">
              <div class="math-card__head">%s%s</div>
              <div class="math-eq"><span>%s</span><span class="op">%s</span><span>%s</span><span class="op">=</span><span class="q">?</span></div>
            </div>
            <div class="math-card__face math-card__face--back">
              <div class="math-card__watermark">+ −</div>
            </div>
          </div>
        </div>
""" % (badge_html, label, eq_left, op, eq_right)


def options(items, correct=None, wrong=None, flash=False):
    btns = []
    for v in items:
        cls = "option-button math-option"
        if v == correct:
            cls += " is-correct"
        if v == wrong:
            cls += " is-wrong"
        if v == correct and flash:
            cls += " is-flashing"
        btns.append(
            '<button class="%s" type="button" role="listitem" aria-label="选项 %s">%s</button>'
            % (cls, v, v)
        )
    return (
        '<div id="math-options" class="option-grid zone-secondary" role="list" aria-label="答案选项">'
        + "".join(btns)
        + "</div>"
    )


def shell(game, body, extra_css=""):
    return """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>算术闪卡 · Phase 11 设计稿</title>
<link rel="stylesheet" href="../styles.css" />
<link rel="stylesheet" href="../mockup.css" />
<link rel="stylesheet" href="../mockup-frame.css" />
%s
</head>
<body data-game="%s">
  <div class="stage">
    <div class="stage-canvas">
      <main class="app" aria-live="polite">
%s
      </main>
    </div>
  </div>
</body>
</html>
""" % (extra_css, game, body)


def complete_panel(stars, title, tier, elapsed, correct, total, record=True):
    """完成面板：奖杯 + 星星（按时间评星）+ 统计 + 新纪录。

    奖杯 SVG 与 class 名逐字取自产品真实 index.html（#complete-panel），
    不另画一套 —— 画一套就会出现「奖杯是黑的」这种假象。
    """
    star_html = ""
    for i in range(3):
        earned = " is-earned" if i < stars else ""
        star_html += (
            '<svg class="star%s" data-star="%d" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
            '<path d="M12 2L14.85 8.5L22 9.27L16.5 14.14L18.18 21L12 17.27L5.82 21L7.5 14.14L2 9.27L9.15 8.5L12 2Z"/></svg>'
            % (earned, i + 1)
        )
    tier_name = {3: "gold", 2: "silver", 1: "bronze"}[stars]
    # 真实 index.html 里三档奖杯都带 hidden，只显示命中的一档
    trophies = []
    for name in ("bronze", "silver", "gold"):
        hidden = "" if name == tier_name else " hidden"
        trophies.append(
            '<div class="trophy" data-tier="%s"%s>%s</div>' % (name, hidden, TROPHY_SVG[name])
        )
    pct = round(correct / total * 100)
    record_html = (
        '<p id="best-record" class="complete-record">新纪录！</p>' if record else ""
    )
    return """
        <div id="complete-panel" class="complete-panel">
          <div class="trophy-row" aria-hidden="true">
%s
          </div>
          <div class="star-row" aria-label="星星数">%s</div>
          <p class="complete-title" data-tier="%s">%s</p>
          <p id="complete-stats" class="complete-stats complete-stats--timed">用时 %s
答对 %d / %d（%d%%）</p>
%s
          <div class="actions">
            <button id="play-again" class="primary-button" type="button">再玩一次</button>
            <button id="next-board" class="secondary-button" type="button">下一关</button>
            <button class="secondary-button" type="button" data-action="back-lobby">回大厅</button>
          </div>
        </div>
""" % ("\n".join(trophies), star_html, tier, title, elapsed, correct, total, pct, record_html)


# ---------------------------------------------------------------- 各屏内容

def screen_setup():
    """选关页：四关都是 45 题，困难模式整行删除。"""
    body = """
      <section id="setup" class="screen active" aria-labelledby="setup-title">
        <div class="topbar compact">
          <button class="text-button" type="button" data-action="back-lobby">返回</button>
          <h2 id="setup-title">算术闪卡 · 选择关卡</h2>
        </div>

        <div class="difficulty-grid" role="list" aria-label="关卡选择">
          <button class="difficulty" type="button" data-size="3" data-recommended="true">
            <strong>10 以内加法</strong>
            <span>45 题 · 入门</span>
          </button>
          <button class="difficulty" type="button" data-size="4">
            <strong>10 以内减法</strong>
            <span>45 题 · 熟练</span>
          </button>
          <button class="difficulty" type="button" data-size="5">
            <strong>20 以内加法</strong>
            <span>45 题 · 进位</span>
          </button>
          <button class="difficulty" type="button" data-size="6">
            <strong>20 以内减法</strong>
            <span>45 题 · 退位</span>
          </button>
          <button class="difficulty" type="button" data-size="7" hidden>
            <strong>—</strong><span>—</span>
          </button>
        </div>
      </section>
"""
    return shell("mathFlash", body)


def screen_play():
    """游戏页：进度 12/45，HUD 中间是全局总计时（不是每题倒计时）。"""
    body = """
      <section id="game" class="screen active" aria-labelledby="game-title">
%s%s
        <div id="math-host" class="math-host zone-stack">
%s%s
        </div>
      </section>
""" % (
        TOPBAR,
        hud(progress="12 / 45", timer="00:24"),
        card("4", "+", "3", badge="10 以内加法", question_label="第 12 题"),
        options([6, 7, 8, 5]),
    )
    return shell("mathFlash", body)


def screen_play_warning():
    """计时器越过 90 秒（三星线）→ 变橙。"""
    body = """
      <section id="game" class="screen active" aria-labelledby="game-title">
%s%s
        <div id="math-host" class="math-host zone-stack">
%s%s
        </div>
      </section>
""" % (
        TOPBAR,
        hud(progress="38 / 45", timer="01:42", timer_cls="timed-warning"),
        card("8", "−", "3", badge="20 以内减法", question_label="第 38 题"),
        options([4, 5, 6, 7]),
    )
    return shell("mathFlash", body)


def screen_play_danger():
    """计时器越过 150 秒（二星线）→ 变红。"""
    body = """
      <section id="game" class="screen active" aria-labelledby="game-title">
%s%s
        <div id="math-host" class="math-host zone-stack">
%s%s
        </div>
      </section>
""" % (
        TOPBAR,
        hud(progress="41 / 45", timer="02:38", timer_cls="timed-danger"),
        card("9", "+", "8", badge="20 以内加法", question_label="第 41 题"),
        options([16, 17, 18, 15]),
    )
    return shell("mathFlash", body)


def screen_complete(stars, title, tier, elapsed, correct, total, record=True):
    body = """
      <section id="game" class="screen active" aria-labelledby="game-title">
%s%s
        <div id="math-host" class="math-host zone-stack">
%s%s
        </div>
%s
      </section>
""" % (
        TOPBAR,
        hud(progress="%d / %d" % (total, total), timer=elapsed),
        card("4", "+", "3", badge="10 以内加法", question_label="第 %d 题" % total),
        options([6, 7, 8, 5]),
        complete_panel(stars, title, tier, elapsed, correct, total, record),
    )
    return shell("mathFlash", body)


SCREENS_SPEC = {
    "01-setup": screen_setup,
    "02-play": screen_play,
    "03-play-timer-warning": screen_play_warning,
    "04-play-timer-danger": screen_play_danger,
    "05-complete-3star": lambda: screen_complete(3, "太快啦！", "perfect", "01:12", 38, 45, True),
    "06-complete-2star": lambda: screen_complete(2, "稳稳的！", "good", "02:05", 41, 45, False),
    "07-complete-1star": lambda: screen_complete(1, "完成啦！", "ok", "03:18", 35, 45, False),
}


def render(name, html):
    path = os.path.join(SCREENS, name + ".html")
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    return path


def shoot(path):
    out = os.path.join(OUT, os.path.basename(path).replace(".html", ".png"))
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=2",
        "--window-size=360,640",
        "--screenshot=" + out,
        "--virtual-time-budget=2500",
        "file://" + path,
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out


def is_blank(png_path):
    """空白图判空：统计非背景像素比例。"""
    try:
        from PIL import Image
    except ImportError:
        return False
    img = Image.open(png_path).convert("RGB")
    colors = img.getcolors(maxcolors=1 << 20)
    if not colors:
        return True
    total = sum(c for c, _ in colors)
    top = max(colors, key=lambda x: x[0])[0]
    return (total - top) / total < 0.02


def main():
    os.makedirs(SCREENS, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)

    # 复用 phase-9 的素材（mascot 等）
    assets_src = os.path.join(BASE, "..", "phase-9", "screens", "assets")
    assets_dst = os.path.join(SCREENS, "assets")
    if os.path.isdir(assets_src) and not os.path.isdir(assets_dst):
        shutil.copytree(assets_src, assets_dst)

    for name, fn in SCREENS_SPEC.items():
        path = render(name, fn())
        png = shoot(path)
        blank = is_blank(png)
        size = os.path.getsize(png)
        flag = "  ⚠️ 空白图!" if blank else ""
        print("%-26s -> %s  %6.1f KB%s" % (name, os.path.basename(png), size / 1024, flag))
        if blank:
            time.sleep(0.4)
            png = shoot(path)
            print("%-26s -> 重渲 %s" % ("", os.path.basename(png)))


if __name__ == "__main__":
    main()
