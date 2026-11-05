#!/usr/bin/env python3
"""Phase 10 静态设计稿：真实 median + 共同 transform，不是产品引擎。

TMPDIR=/tmp python3 docs/mockups/phase-10/gen_mockups.py
复制 current/styles.css；Node VM 读数字数据；汉字只读本地缓存。
SVG 宽/窄 stroke 引用同一路径，预览等宽圆头笔，不做拟合/判定。
"""
from pathlib import Path
import hashlib
import html
import json
import math
import os
import shutil
import subprocess

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]
CURRENT = ROOT / 'current'
CHROME = '/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'
PALETTE = ['#357fa9', '#b26838', '#358776', '#8863a2', '#aa5d68']
# 这里只做静态原样读取，不执行 app.js，也不引入任何产品引擎。
READ_NUMBERS = """
const fs = require('node:fs'), vm = require('node:vm');
const context = {window: {}};
vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8'), context);
const pool = context.window.TRACE_NUMBERS;
console.log(JSON.stringify(Object.fromEntries(pool.items.map(i => [i.charKey, pool.getStrokeSpec(i.charKey)]))));
"""


# 与 Phase 9 一样由 Chromium 出图；用已有 Playwright 控制准确 viewport，
# 避免当前环境 Chromium CLI --screenshot 无法结束的问题。无需 npm 安装。
RENDER = r"""
const { chromium } = require('/tmp/node_modules/playwright');
const fs = require('node:fs'), assert = require('node:assert/strict');
(async () => {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const browser = await chromium.launch({executablePath: input.chrome, headless:true});
  try {
    const page = await browser.newPage({viewport:{width:360,height:640}, deviceScaleFactor:2});
    let errors=0;
    page.on('pageerror', () => errors++);
    page.on('console', m => {if(m.type()==='error') errors++;});
    for (const item of input.screens) {
      await page.goto(item.url, {waitUntil:'load'});
      await page.evaluate(() => document.fonts.ready);
      const checks = await page.evaluate(() => {
        const matrix = el => ['a','b','c','d','e','f'].map(k=>el.getCTM()[k]);
        const sameMatrix = (a,b) => matrix(a).every((v,i)=>Math.abs(v-matrix(b)[i])<1e-6);
        const svgs = [...document.querySelectorAll('svg[data-key]')];
        let checks=0;
        for (const svg of svgs) {
          const spec=JSON.parse(svg.querySelector('metadata').textContent);
          const greys=[...svg.querySelectorAll('.outline-preview')];
          if(greys.length!==spec.medians.length)throw Error('Missing grey stroke');
          greys.forEach((grey,i)=>{
            const id=grey.getAttribute('href').slice(1);
            const path=document.getElementById(id);
            const expected='M '+spec.medians[i].map(p=>p.join(' ')).join(' L ');
            if(path.getAttribute('d')!==expected)throw Error('Median changed');
            if(!sameMatrix(grey,svg.querySelector('.grid-lines')))throw Error('Grid transform mismatch');
            checks++;
          });
          const guides=[...svg.querySelectorAll('.median-guide')];
          const dots=[...svg.querySelectorAll('.start-dot')];
          const labels=[...svg.querySelectorAll('.start-label')];
          guides.forEach((guide,i)=>{
            const p=spec.medians[i][0],dot=dots[i],label=labels[i];
            if(guide.getAttribute('href')!==greys[i].getAttribute('href'))throw Error('Different source paths');
            if(!sameMatrix(guide,greys[i])||!sameMatrix(guide,dot))throw Error('Transform mismatch');
            if(+dot.getAttribute('cx')!==p[0]||+dot.getAttribute('cy')!==p[1])throw Error('Wrong start');
            if(label.textContent!==String(i+1))throw Error('Wrong order');
            checks++;
          });
          // 等宽圆头笔展开预览的包络，包括起点圆点，必须在同一 viewBox 内。
          const bounds=svg.getBoundingClientRect();
          const layer=svg.querySelector('.character-space');
          const m=layer.getScreenCTM();
          for (const median of spec.medians)for(const [x,y] of median){
            for(const [dx,dy] of [[-44,-44],[44,44]]){
              const p=new DOMPoint(x+dx,y+dy).matrixTransform(m);
              if(p.x<bounds.left-.5||p.x>bounds.right+.5||p.y<bounds.top-.5||p.y>bounds.bottom+.5)throw Error('Glyph clipped');
            }
          }
        }
        for(const el of document.querySelectorAll('.writing-board,.queue,.preview-toolbar')){
          const r=el.getBoundingClientRect();
          if(r.left<0||r.right>360||r.top<0||r.bottom>640)throw Error('Panel clipped');
        }
        if(document.querySelector('.screen.active').scrollHeight>640)throw Error('Screen overflow');
        return {svgs:svgs.length,geometryChecks:checks};
      });
      assert.equal(errors,0);
      await page.screenshot({path:item.png});
      console.log('rendered', item.name, JSON.stringify(checks), fs.statSync(item.png).size+' bytes');
    }
    console.log('Mockup console/pageerror: 0');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
"""


def load_data():
    numbers = json.loads(subprocess.check_output(
        ['node', '-e', READ_NUMBERS, str(CURRENT / 'assets/data/trace-numbers.js')], text=True))
    data = {}
    for char in '一三上中书':
        path = CURRENT / f'assets/data/hanzi-cache/{char}.json'
        raw = path.read_bytes()
        source = json.loads(raw)
        assert len(source['medians']) == len(source['strokes'])
        # 一次性数据适配；SVG 中不再有 Y-up/翻转分支，也不会翻转序号文字。
        medians = [[[x, 1024-y] for x, y in median] for median in source['medians']]
        data['hanzi:' + char] = {
            'medians': medians,
            'source': f'current/assets/data/hanzi-cache/{char}.json',
            'evidence': 'B: hanzi-writer-data; pen preview BETA',
            'rawSha256': hashlib.sha256(raw).hexdigest(),
        }
    for digit in ('1', '5', '7'):
        spec = numbers[digit]
        data['numbers:' + digit] = {
            'medians': spec['medians'],
            'source': spec['source'],
            'evidence': 'A: existing textbook form review; direction is product convention; pen preview BETA',
        }
    return data


def geometry_svg(key, spec, uid, guide=True):
    medians = spec['medians']
    assert medians and all(len(m) >= 2 for m in medians)
    assert all(math.isfinite(v) for m in medians for p in m for v in p)
    # 所有层（含格线）共用一个字符盒矩阵；按全字联合包络计算一次。
    # 包括负 Y 源点转成的 >1024 坐标；不 clamp，不分层 fit。
    points = [p for m in medians for p in m]
    low_x = min(0, min(p[0]-44 for p in points))
    high_x = max(1024, max(p[0]+44 for p in points))
    low_y = min(0, min(p[1]-44 for p in points))
    high_y = max(1024, max(p[1]+44 for p in points))
    span = max(high_x-low_x, high_y-low_y)
    cx, cy = (low_x+high_x)/2, (low_y+high_y)/2
    left, top = cx-span/2, cy-span/2
    right, bottom = left+span, top+span
    scale = 960/span
    tx, ty = 512-scale*cx, 512-scale*cy
    transform = f'matrix({scale:.9f} 0 0 {scale:.9f} {tx:.9f} {ty:.9f})'
    defs, grey, lines, dots = [], [], [], []
    for i, median in enumerate(medians):
        path_id = f'{uid}-stroke-{i}'
        d = 'M ' + ' L '.join(f'{x} {y}' for x, y in median)
        defs.append(f'<path id="{path_id}" d="{d}"/>')
        grey.append(f'<use class="outline-preview" href="#{path_id}" data-stroke="{i}"/>')
        if guide:
            color = PALETTE[i % len(PALETTE)]
            lines.append(f'<use class="median-guide" href="#{path_id}" data-stroke="{i}" stroke="{color}"/>')
            x, y = median[0]
            dots.append(f'<circle class="start-dot" data-stroke="{i}" cx="{x}" cy="{y}" r="39" fill="{color}"/>')
            dots.append(f'<text class="start-label" x="{x}" y="{y}">{i+1}</text>')
    metadata = html.escape(json.dumps({'key': key, **spec}, ensure_ascii=False))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="{html.escape(key)} 真实骨架笔型预览" data-key="{html.escape(key)}">
<title>{html.escape(key)} · 真实 median；等宽圆头笔预览</title>
<metadata>{metadata}</metadata>
<defs>{''.join(defs)}</defs>
<g class="character-space" transform="{transform}">
  <rect class="grid-border" x="{left}" y="{top}" width="{span}" height="{span}"/>
  <path class="grid-lines" d="M {cx} {top} V {bottom} M {left} {cy} H {right} M {left} {top} L {right} {bottom} M {left} {bottom} L {right} {top}"/>
  <g class="grey-layer">{''.join(grey)}</g>
  <g class="guide-layer">{''.join(lines)}</g>
  <g class="start-layer">{''.join(dots)}</g>
</g></svg>'''


def screen(data, name, key, queue, index, hint):
    pool = '汉字' if key.startswith('hanzi:') else '数字'
    queue_markup = []
    for i, entry in enumerate(queue):
        state = 'is-current' if i == index else ('is-done' if i < index else '')
        label = '当前' if i == index else ('已描完' if i < index else '待描')
        queue_markup.append(f'<div class="queue-card {state}" role="listitem" aria-label="{label} {entry.split(":")[1]}">{geometry_svg(entry, data[entry], name+"-q"+str(i), guide=False)}</div>')
    disabled = ' disabled'
    return f'''<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Phase 10 · {name} · 静态设计稿</title>
<link rel="icon" href="data:,"/>
<link rel="stylesheet" href="../styles.css"/>
<link rel="stylesheet" href="../mockup.css"/>
<link rel="stylesheet" href="../mockup-frame.css"/>
</head><body data-game="tracingPreview"><div class="stage"><div class="stage-canvas"><main class="app">
<section class="screen active" aria-labelledby="game-title">
<div class="game-topbar preview-topbar">
  <button class="text-button" type="button">换练习</button>
  <div><p class="eyebrow">田字格描红 · {pool}</p><h2 id="game-title">先看笔顺，再描一描</h2></div>
  <span class="preview-tag">设计预览</span>
</div>
<div class="preview-hud"><span class="progress">第 {index+1} / {len(queue)} 字</span><span>{hint}</span></div>
<div class="zone-stack preview-host">
  <div class="zone-primary writing-board">{geometry_svg(key, data[key], name+"-main")}</div>
  <p class="writing-instruction">从数字圆点起笔，顺着细线描一描</p>
  <div class="zone-secondary queue-zone">
    <div class="queue-head"><span>这一组要描的字</span><span>描完一个，再往前一步</span></div>
    <div class="queue" role="list" aria-label="待描字列表">{''.join(queue_markup)}</div>
  </div>
  <div class="zone-toolbar preview-toolbar" role="group" aria-label="描红工具栏">
    <button class="secondary-button" type="button">清除笔迹</button>
    <button class="secondary-button" type="button">重看笔顺</button>
    <button class="primary-button next-button" type="button"{disabled}>下一字</button>
  </div>
</div>
</section></main></div></div></body></html>'''


def render():
    for folder in ('screens', 'out'):
        (BASE/folder).mkdir(exist_ok=True)
    shutil.copyfile(CURRENT/'styles.css', BASE/'styles.css')
    assert (BASE/'styles.css').read_bytes() == (CURRENT/'styles.css').read_bytes()
    data = load_data()
    screens = [
        ('01-hanzi-guide', 'hanzi:三', ['hanzi:三', 'hanzi:上', 'hanzi:中', 'hanzi:书'], 0, '先看 3 笔怎么写'),
        ('02-number-queue', 'numbers:7', ['numbers:1', 'numbers:7', 'numbers:5'], 1, '先看 1 笔怎么写'),
        ('03-hanzi-complex', 'hanzi:中', ['hanzi:一', 'hanzi:三', 'hanzi:上', 'hanzi:中', 'hanzi:书'], 3, '先看 4 笔怎么写'),
    ]
    render_specs = []
    for name, key, queue, index, hint in screens:
        page = BASE/'screens'/f'{name}.html'
        page.write_text(screen(data, name, key, queue, index, hint))
        render_specs.append({'name': name, 'url': page.as_uri(), 'png': str(BASE/'out'/f'{name}.png')})
    subprocess.run(['node', '-e', RENDER], input=json.dumps({'chrome': CHROME, 'screens': render_specs}),
                   text=True, check=True,
                   env={**os.environ, 'TMPDIR': '/tmp', 'TMP': '/tmp', 'TEMP': '/tmp'})
    for item in render_specs:
        assert Path(item['png']).stat().st_size > 20000
    print('styles.css byte-identical to current/styles.css')


if __name__ == '__main__':
    render()
