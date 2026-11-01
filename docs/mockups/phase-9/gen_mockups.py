#!/usr/bin/env python3
"""Phase 9 — 算术闪卡设计稿生成器

用线上真实 styles.css + 新游戏 mockup.css 渲染 7 个界面，
每屏 360x640（设计画布），chromium --screenshot 出图。

用法：
  python3 gen_mockups.py
产出：
  screens/*.html  +  out/*.png
"""
import os
import re
import subprocess
import shutil
import time

BASE = os.path.dirname(os.path.abspath(__file__))
SCREENS = os.path.join(BASE, "screens")
OUT = os.path.join(BASE, "out")
CHROME = "/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome"

# ---------------------------------------------------------------- 公共片段

TOPBAR = """
        <div class="game-topbar">
          <button class="text-button" type="button" data-action="back-setup">换关卡</button>
          <div>
            <p id="game-subtitle" class="eyebrow">算术闪卡</p>
            <h2 id="game-title">算一算，选答案</h2>
          </div>
          <div class="game-topbar-right">
            <img class="mascot-host game-mascot" src="assets/mascot-wave.svg" alt="小书本" />
            <button id="replay-sound" class="round-button" type="button" aria-label="再听一遍">听</button>
          </div>
        </div>
"""

HUD = """
        <div class="game-hud" aria-label="游戏状态">
          <span id="progress" class="hud-progress">3 / 10</span>
          <span id="timer" class="hud-timer">00:12</span>
          <span id="hint" class="hud-hint">选一个答案</span>
        </div>
"""


def card(eq_left, op, eq_right, badge="", timer_bar=None, extra_cls="", question_label="",
         flipped=False, answer="", watermark="+"):
    """闪卡：纸质名片，正面是算式，背面是素纸（翻卡效果）。"""
    bar = ""
    if timer_bar is not None:
        bar = '<div class="math-card__timer"><i style="width:%d%%"></i></div>' % timer_bar
    badge_html = ""
    if badge:
        badge_html = '<span class="math-card__badge">%s</span>' % badge
    label = ""
    if question_label:
        label = '<span class="math-card__label">%s</span>' % question_label
    flip_cls = "is-flipped" if flipped else ""
    answer_html = ""
    if answer:
        answer_html = '<div class="math-card__watermark">%s</div>' % answer
    return f"""
        <div class="math-card zone-primary {extra_cls} {flip_cls}" aria-label="题目卡片">
          <div class="math-card__inner">
            <div class="math-card__face math-card__face--front">
              {bar}
              <div class="math-card__head">{badge_html}{label}</div>
              <div class="math-eq"><span>{eq_left}</span><span class="op">{op}</span><span>{eq_right}</span><span class="op">=</span><span class="q">?</span></div>
            </div>
            <div class="math-card__face math-card__face--back">
              {answer_html or '<div class="math-card__watermark">%s</div>' % watermark}
            </div>
          </div>
        </div>
"""


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


def shell(game, body, extra_css="", body_class=""):
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>算术闪卡设计稿</title>
<link rel="stylesheet" href="../styles.css" />
<link rel="stylesheet" href="../mockup.css" />
<link rel="stylesheet" href="../mockup-frame.css" />
{extra_css}
</head>
<body data-game="{game}" class="{body_class}">
  <div class="stage">
    <div class="stage-canvas">
      <main class="app" aria-live="polite">
{body}
      </main>
    </div>
  </div>
</body>
</html>
"""


# ---------------------------------------------------------------- 各屏内容

def screen_lobby():
    lobby = open(os.path.join(SCREENS, "lobby_fragment.html"), encoding="utf-8").read()
    return shell("lobby", lobby)


def screen_setup():
    body = """
      <section id="setup" class="screen active" aria-labelledby="setup-title">
        <div class="topbar compact">
          <button class="text-button" type="button" data-action="back-lobby">返回</button>
          <h2 id="setup-title">算术闪卡 · 选择关卡</h2>
        </div>

        <div class="difficulty-grid" role="list" aria-label="关卡选择">
          <button class="difficulty" type="button" data-size="3" data-recommended="true">
            <strong>10 以内加法</strong>
            <span>10 题 · 入门</span>
          </button>
          <button class="difficulty" type="button" data-size="4">
            <strong>10 以内减法</strong>
            <span>10 题 · 熟练</span>
          </button>
          <button class="difficulty" type="button" data-size="5">
            <strong>20 以内加法</strong>
            <span>10 题 · 进位</span>
          </button>
          <button class="difficulty" type="button" data-size="6">
            <strong>20 以内减法</strong>
            <span>10 题 · 退位</span>
          </button>
          <button class="difficulty" type="button" data-size="7" hidden>
            <strong>—</strong><span>—</span>
          </button>
        </div>

        <div class="mode-row is-on">
          <span class="mode-row-text">
            <span class="mode-row-title">困难模式</span>
            <span class="mode-row-sub">每题 5 秒，超时算错</span>
          </span>
          <button class="toggle-switch" type="button" role="switch" aria-checked="true" aria-label="困难模式">
            <span class="toggle-knob"></span>
          </button>
        </div>
      </section>
"""
    return shell("mathFlash", body)


def screen_play():
    body = f"""
      <section id="game" class="screen active" aria-labelledby="game-title">
{TOPBAR}
{HUD}
        <div id="math-host" class="math-host zone-stack">
{card("4", "+", "3", badge="10 以内加法", question_label="第 3 题")}
{options([6, 7, 8, 5])}
        </div>
      </section>
"""
    return shell("mathFlash", body)


def screen_play_hard():
    body = f"""
      <section id="game" class="screen active" aria-labelledby="game-title">
{TOPBAR}
{HUD}
        <div id="math-host" class="math-host zone-stack">
{card("9", "+", "8", badge="20 以内加法 · 困难", timer_bar=60, extra_cls="is-urgent", question_label="第 3 题")}
{options([16, 17, 15, 18])}
        </div>
      </section>
"""
    extra = """
<style>
  /* 困难模式 HUD 中间换成倒计时读秒 */
  .hud-timer { background: rgb(var(--color-danger-soft)); border-color: rgb(var(--color-danger)); color: rgb(var(--color-danger-strong)); }
</style>
"""
    body = body.replace('<span id="timer" class="hud-timer">00:12</span>',
                        '<span id="timer" class="hud-timer is-urgent">3</span>')
    body = body.replace('<span id="hint" class="hud-hint">选一个答案</span>',
                        '<span id="hint" class="hud-hint">限时 5 秒</span>')
    return shell("mathFlash", body, extra_css=extra)


def screen_wrong():
    """答错态：卡片已翻面（露出背面），正确答案高亮闪动，即将翻到下一题。"""
    body = f"""
      <section id="game" class="screen active" aria-labelledby="game-title">
{TOPBAR}
{HUD}
        <div id="math-host" class="math-host zone-stack">
{card("4", "+", "3", badge="10 以内加法", question_label="第 2 题")}
{options([6, 7, 8, 5], correct=7, wrong=8, flash=True)}
        </div>
      </section>
"""
    body = body.replace('<span id="hint" class="hud-hint">选一个答案</span>',
                        '<span id="hint" class="hud-hint">再想想</span>')
    body = body.replace('<span id="progress" class="hud-progress">3 / 10</span>',
                        '<span id="progress" class="hud-progress">2 / 10</span>')
    return shell("mathFlash", body)


STAR_SVG = '<svg class="star" data-star="{n}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L14.85 8.5L22 9.27L16.5 14.14L18.18 21L12 17.27L5.82 21L7.5 14.14L2 9.27L9.15 8.5L12 2Z"/></svg>'

TROPHY = {'bronze': '<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 18c-4 0-4 10 0 10" stroke="#cd7f32" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 18c4 0 4 10 0 10" stroke="#cd7f32" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#cd7f32"/><path d="M16 12h32v3H16z" fill="#e89858"/><rect x="24" y="44" width="16" height="4" fill="#a6611f"/><rect x="18" y="48" width="28" height="6" rx="1" fill="#8b4a0f"/><text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#fff8d8" font-family="system-ui">3</text></svg>', 'silver': '<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 18c-4 0-4 10 0 10" stroke="#c0c0c0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 18c4 0 4 10 0 10" stroke="#c0c0c0" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#d4d4d4"/><path d="M16 12h32v3H16z" fill="#f0f0f0"/><rect x="24" y="44" width="16" height="4" fill="#a0a0a0"/><rect x="18" y="48" width="28" height="6" rx="1" fill="#808080"/><text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="system-ui">2</text></svg>', 'gold': '<svg class="trophy-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 18c-4 0-4 10 0 10" stroke="#f7d75c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M56 18c4 0 4 10 0 10" stroke="#f7d75c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M16 12h32v18c0 8-7 14-16 14s-16-6-16-14V12z" fill="#f7d75c"/><path d="M16 12h32v3H16z" fill="#fff3a8"/><rect x="24" y="44" width="16" height="4" fill="#d4a72c"/><rect x="18" y="48" width="28" height="6" rx="1" fill="#b8860b"/><text x="32" y="32" text-anchor="middle" font-size="14" font-weight="900" fill="#7a5c10" font-family="system-ui">1</text></svg>'}


def complete_panel(stars, tier, title, stats, record, confetti):
    trophies = "".join(
        '<div class="trophy" data-tier="%s"%s>%s</div>'
        % (t, "" if t == tier else " hidden", TROPHY[t])
        for t in ("bronze", "silver", "gold")
    )
    star_html = "".join(
        STAR_SVG.replace("{n}", str(i)).replace('class="star"', 'class="star%s"' % ("" if i <= stars else " is-empty"))
        for i in (1, 2, 3)
    )
    rec = ('<p id="best-record" class="complete-record">新纪录！</p>' if record
           else '<p id="best-record" class="complete-record" hidden>新纪录！</p>')
    cnf = ""
    if confetti:
        import random
        random.seed(7)
        bits = []
        for _ in range(26):
            lf = random.choice([12, 22, 32, 42, 52, 62, 72, 82])
            tp = random.choice([8, 16, 24])
            col = random.choice(["#ec4899", "#f7d75c", "#5fd3bc", "#f0904f", "#8ab4f8"])
            bits.append(
                '<i style="position:absolute;left:%d%%;top:%d%%;width:7px;height:11px;background:%s;transform:rotate(%ddeg);border-radius:2px"></i>'
                % (lf, tp, col, random.randint(0, 360))
            )
        cnf = '<div class="confetti-layer" aria-hidden="true">%s</div>' % "".join(bits)
    return """
        <div id="complete-panel" class="complete-panel">
          %s
          <div class="trophy-row" aria-hidden="true">%s</div>
          <div class="star-row" aria-label="星星数">%s</div>
          <p class="complete-title">%s</p>
          <p id="complete-stats" class="complete-stats">%s</p>
          %s
          <div class="actions">
            <button id="play-again" class="primary-button" type="button">再玩一次</button>
            <button id="next-board" class="secondary-button" type="button">下一关</button>
            <button class="secondary-button" type="button" data-action="back-lobby">回大厅</button>
          </div>
        </div>
""" % (cnf, trophies, star_html, title, stats, rec)


def screen_complete(stars, tier, title, stats, record, confetti, extra_cls=""):
    body = f"""
      <section id="game" class="screen active" aria-labelledby="game-title">
{TOPBAR}
{HUD.replace('3 / 10', '10 / 10')}
        <div id="math-host" class="math-host zone-stack">
{card("4", "+", "3", badge="10 以内加法", question_label="第 10 题")}
{options([7, 6, 8, 5], correct=7)}
        </div>
{complete_panel(stars, tier, title, stats, record, confetti)}
      </section>
"""
    return shell("mathFlash", body, extra_css=extra_cls)


# ---------------------------------------------------------------- 出图

SCREENS_SPEC = [
    ("01-lobby", screen_lobby),
    ("02-setup", screen_setup),
    ("03-play", screen_play),
    ("04-play-hard", screen_play_hard),
    ("05-wrong", screen_wrong),
    ("06-complete-3star", lambda: screen_complete(
        3, "gold", "全对啦！", "用时 01:12 · 答对 10 / 10（100%）", True, True)),
    ("07-complete-1star", lambda: screen_complete(
        1, "bronze", "差一点点", "用时 02:05 · 答对 6 / 10（60%）", False, False)),
]


def render():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in SCREENS_SPEC:
        path = os.path.join(SCREENS, name + ".html")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(fn())
        png = os.path.join(OUT, name + ".png")
        subprocess.run([
            CHROME, "--headless", "--disable-gpu", "--no-sandbox",
            "--hide-scrollbars", "--force-device-scale-factor=2",
            "--window-size=360,640", "--virtual-time-budget=2000",
            "--screenshot=" + png, "file://" + path,
        ], check=True, capture_output=True)
        size = os.path.getsize(png)
        # chromium 偶发写半截文件（空白图），重渲一次
        if size < 20000:
            time.sleep(0.4)
            subprocess.run([
                CHROME, "--headless", "--disable-gpu", "--no-sandbox",
                "--hide-scrollbars", "--force-device-scale-factor=2",
                "--window-size=360,640", "--virtual-time-budget=2000",
                "--screenshot=" + png, "file://" + path,
            ], check=True, capture_output=True)
            size = os.path.getsize(png)
        print("rendered", name, size)


if __name__ == "__main__":
    render()
