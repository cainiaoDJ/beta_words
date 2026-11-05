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
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
(async () => {
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  // 独立从原资产读真值，不能用 HTML 自报的 metadata 证明自身正确。
  const originals = {};
  const allPoints = [];
  for (const file of fs.readdirSync(input.current+'/assets/data/hanzi-cache').filter(f=>f.endsWith('.json'))) {
    const raw = JSON.parse(fs.readFileSync(input.current+'/assets/data/hanzi-cache/'+file, 'utf8'));
    const medians = raw.medians.map(m=>m.map(([x,y])=>[x,1024-y]));
    originals['hanzi:'+file.slice(0,-5)] = medians;
    allPoints.push(...medians.flat());
  }
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(input.current+'/assets/data/trace-numbers.js','utf8'),context);
  for (const item of context.window.TRACE_NUMBERS.items) {
    originals['numbers:'+item.charKey] = JSON.parse(JSON.stringify(context.window.TRACE_NUMBERS.getStrokeSpec(item.charKey).medians));
  }
  const xs=allPoints.map(p=>p[0]),ys=allPoints.map(p=>p[1]);
  const poolBBox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  const hanziScale=960/Math.max(poolBBox[2]-poolBBox[0]+88,poolBBox[3]-poolBBox[1]+88);
  console.log('Pool hanzi:',JSON.stringify({characters:Object.keys(originals).filter(k=>k.startsWith('hanzi:')).length,bbox:poolBBox,scale:hanziScale,cell:[32,32,992,992]}));
  console.log('Pool numbers:',JSON.stringify({scale:1,authorCell:[152,152,872,872],cell:[152,152,872,872]}));
  const browser = await chromium.launch({executablePath: input.chrome, headless:true});
  try {
    const page = await browser.newPage({viewport:{width:360,height:640}, deviceScaleFactor:2});
    let errors=0;
    page.on('pageerror', () => errors++);
    page.on('console', m => {if(m.type()==='error') errors++;});
    const totals={hanziCentered:0,digitSourceOffset:0,insideCell:0,gridIsCell:0,digitWidthAndScale:0,existingGeometry:0,originalMetadata:0,poolScale:0};
    const poolTotals={hanzi:{...totals},numbers:{...totals}};
    const failures=[];
    for (const item of input.screens) {
      await page.goto(item.url, {waitUntil:'load'});
      await page.evaluate(() => document.fonts.ready);
      const checks = await page.evaluate(({originals,hanziScale}) => {
        const matrix = el => ['a','b','c','d','e','f'].map(k=>el.getCTM()[k]);
        const sameMatrix = (a,b) => matrix(a).every((v,i)=>Math.abs(v-matrix(b)[i])<1e-6);
        const near=(a,b)=>Math.abs(a-b)<1e-6;
        // SVGTransform.baseVal 使用 float32；格边读数允许 1e-4 设计单位误差。
        const gridNear=(a,b)=>Math.abs(a-b)<1e-4;
        const fail=(message)=>{throw Error(message);};
        const point=(x,y,m)=>new DOMPoint(x,y).matrixTransform(m);
        const svgs = [...document.querySelectorAll('svg[data-key]')];
        const counts={hanziCentered:0,digitSourceOffset:0,insideCell:0,gridIsCell:0,digitWidthAndScale:0,existingGeometry:0,originalMetadata:0,poolScale:0};
        const poolCounts={hanzi:{...counts},numbers:{...counts}};
        const offsets=[];
        const positionFailures=[];
        const widths={};
        for (const svg of svgs) {
          const spec=JSON.parse(svg.querySelector('metadata').textContent);
          const pool=spec.key.split(':')[0];
          const isHanzi=pool==='hanzi';
          const increment=name=>{counts[name]++;poolCounts[pool][name]++;};
          if(JSON.stringify(spec.medians)!==JSON.stringify(originals[spec.key]))fail('Original median mismatch: '+spec.key);
          increment('originalMetadata');
          const greys=[...svg.querySelectorAll('.outline-preview')];
          if(greys.length!==spec.medians.length)fail('Missing grey stroke');
          greys.forEach((grey,i)=>{
            const id=grey.getAttribute('href').slice(1);
            const path=document.getElementById(id);
            const expected='M '+spec.medians[i].map(p=>p.join(' ')).join(' L ');
            if(path.getAttribute('d')!==expected)fail('Median changed');
            if(!sameMatrix(grey,svg.querySelector('.grid-lines')))fail('Grid transform mismatch');
            increment('existingGeometry');
          });
          const guides=[...svg.querySelectorAll('.median-guide')];
          const dots=[...svg.querySelectorAll('.start-dot')];
          const labels=[...svg.querySelectorAll('.start-label')];
          if(guides.length && (guides.length!==greys.length||dots.length!==guides.length||labels.length!==guides.length))fail('Missing guide/start');
          guides.forEach((guide,i)=>{
            const p=spec.medians[i][0],dot=dots[i],label=labels[i];
            if(guide.getAttribute('href')!==greys[i].getAttribute('href'))fail('Different source paths');
            if(!sameMatrix(guide,greys[i])||!sameMatrix(guide,dot))fail('Transform mismatch');
            if(+dot.getAttribute('cx')!==p[0]||+dot.getAttribute('cy')!==p[1])fail('Wrong start');
            if(label.textContent!==String(i+1))fail('Wrong order');
            increment('existingGeometry');
          });
          const layer=svg.querySelector('.character-space');
          const local=layer.transform.baseVal.consolidate().matrix;
          const expectedScale=isHanzi?hanziScale:1;
          if(!near(local.a,expectedScale)||!near(local.d,expectedScale)||!near(local.b,0)||!near(local.c,0))fail('Per-pool scale changed: '+spec.key);
          increment('poolScale');
          const cell=svg.querySelector('.grid-border');
          const cellBox=cell.getBBox();
          const left=cellBox.x,top=cellBox.y,right=left+cellBox.width,bottom=top+cellBox.height;
          const cellCenter=[(left+right)/2,(top+bottom)/2];
          const frame=isHanzi?[32,32,992,992]:[152,152,872,872];
          const corner=point(left,top,local),far=point(right,bottom,local);
          if(![corner.x,corner.y,far.x,far.y].every((v,i)=>gridNear(v,frame[i])))fail('Grid border differs from pool cell: '+spec.key+' '+JSON.stringify({actual:[corner.x,corner.y,far.x,far.y],expected:frame}));
          if(!near(cellBox.width,cellBox.height))fail('Non-square cell');
          const expectedGrid=`M ${cellCenter[0]} ${top} V ${bottom} M ${left} ${cellCenter[1]} H ${right} M ${left} ${top} L ${right} ${bottom} M ${left} ${bottom} L ${right} ${top}`;
          // 数值比较避免小数加减的字符串尾数差异。
          const numbers=d=>(d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)||[]).map(Number);
          const actualGrid=numbers(svg.querySelector('.grid-lines').getAttribute('d'));
          const expectedGridValues=numbers(expectedGrid);
          if(actualGrid.length!==expectedGridValues.length||!actualGrid.every((v,i)=>near(v,expectedGridValues[i])))fail('Grid cross/diagonals differ from border');
          increment('gridIsCell');
          const bbox=svg.querySelector('.grey-layer').getBBox();
          const m=layer.getScreenCTM();
          const glyphCenter=point(bbox.x+bbox.width/2,bbox.y+bbox.height/2,m);
          const gridCenter=point(...cellCenter,m);
          const dx=glyphCenter.x-gridCenter.x,dy=glyphCenter.y-gridCenter.y;
          const worldGlyph=point(bbox.x+bbox.width/2,bbox.y+bbox.height/2,local);
          const worldGrid=point(...cellCenter,local);
          // 从独立读取的原数据计算源偏移；数字不能按 bbox 再居中。
          const sourcePoints=originals[spec.key].flat();
          const sourceXs=sourcePoints.map(p=>p[0]),sourceYs=sourcePoints.map(p=>p[1]);
          const sourceDx=(Math.min(...sourceXs)+Math.max(...sourceXs))/2-512;
          const sourceDy=(Math.min(...sourceYs)+Math.max(...sourceYs))/2-512;
          const renderDx=worldGlyph.x-worldGrid.x,renderDy=worldGlyph.y-worldGrid.y;
          const error=Math.hypot(renderDx-(isHanzi?0:sourceDx),renderDy-(isHanzi?0:sourceDy));
          const row={key:spec.key,role:svg.closest('.queue-card')?'queue':'main',dx:renderDx,dy:renderDy,cssDx:dx,cssDy:dy,sourceDx,sourceDy,error,tolerance:1e-4};
          offsets.push(row);
          if(error>row.tolerance)positionFailures.push(row);
          else increment(isHanzi?'hanziCentered':'digitSourceOffset');
          const allowance=Math.max(44,...greys.map(el=>parseFloat(getComputedStyle(el).strokeWidth)/2),...dots.map(el=>+el.getAttribute('r')+parseFloat(getComputedStyle(el).strokeWidth)/2));
          if(bbox.x-allowance<left-1e-6||bbox.x+bbox.width+allowance>right+1e-6||bbox.y-allowance<top-1e-6||bbox.y+bbox.height+allowance>bottom+1e-6)fail('Glyph outside cell: '+spec.key);
          increment('insideCell');
          // 保留原来的 SVG 视口裁切检查：字形及余量必须完整落在截图内。
          const bounds=svg.getBoundingClientRect();
          for (const median of spec.medians)for(const [x,y] of median){
            for(const [ax,ay] of [[-allowance,-allowance],[allowance,allowance]]){
              const p=point(x+ax,y+ay,m);
              if(p.x<bounds.left-.5||p.x>bounds.right+.5||p.y<bounds.top-.5||p.y>bounds.bottom+.5)fail('Glyph clipped');
            }
          }
          if(!isHanzi && svg.closest('.queue-card')){
            const halfWidth=parseFloat(getComputedStyle(greys[0]).strokeWidth)/2;
            widths[spec.key]={width:(bbox.width+halfWidth*2)*m.a,scale:local.a,viewportScale:m.a};
          }
        }
        if(widths['numbers:1']||widths['numbers:7']){
          const one=widths['numbers:1'],seven=widths['numbers:7'];
          if(!one||!seven||!near(one.scale,1)||!near(seven.scale,1)||one.width>seven.width+1e-6)fail('Digit 1 wider than digit 7 / different scales: '+JSON.stringify(widths));
          counts.digitWidthAndScale++;
          poolCounts.numbers.digitWidthAndScale++;
        }
        for(const el of document.querySelectorAll('.writing-board,.queue,.preview-toolbar')){
          const r=el.getBoundingClientRect();
          if(r.left<0||r.right>360||r.top<0||r.bottom>640)fail('Panel clipped');
        }
        if(document.querySelector('.screen.active').scrollHeight>640)fail('Screen overflow');
        return {svgs:svgs.length,counts,poolCounts,offsets,widths,positionFailures};
      }, {originals,hanziScale});
      failures.push(...checks.positionFailures.map(row=>({screen:item.name,...row})));
      for(const [key,value] of Object.entries(checks.counts))totals[key]+=value;
      for(const pool of ['hanzi','numbers'])for(const [key,value] of Object.entries(checks.poolCounts[pool]))poolTotals[pool][key]+=value;
      const pair=(x,y)=>`(${x.toFixed(6)},${y.toFixed(6)})`;
      for(const row of checks.offsets){
        const measured=`渲染偏移=${pair(row.dx,row.dy)} CSSpx=${pair(row.cssDx,row.cssDy)} error=${row.error.toFixed(6)} tolerance=0.000100`;
        console.log('offset',item.name,row.role,row.key,row.key.startsWith('hanzi:')?measured:`源偏移=${pair(row.sourceDx,row.sourceDy)} → ${measured}`);
      }
      assert.equal(errors,0);
      await page.screenshot({path:item.png});
      console.log('rendered', item.name, JSON.stringify({svgs:checks.svgs,...checks.counts,widths:checks.widths}), fs.statSync(item.png).size+' bytes');
    }
    console.log('汉字池 totals:',JSON.stringify(poolTotals.hanzi));
    console.log('数字池 totals:',JSON.stringify(poolTotals.numbers));
    console.log('Geometry totals:',JSON.stringify(totals));
    console.log('Mockup console/pageerror: 0');
    console.log('Geometry failures:',JSON.stringify(failures));
    assert.equal(failures.length,0,'Pool-specific placement assertions must pass; offsets printed above');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
"""


def load_data():
    numbers = json.loads(subprocess.check_output(
        ['node', '-e', READ_NUMBERS, str(CURRENT / 'assets/data/trace-numbers.js')], text=True))
    data = {}
    for path in sorted((CURRENT / 'assets/data/hanzi-cache').glob('*.json')):
        char = path.stem
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
    for digit, spec in numbers.items():
        data['numbers:' + digit] = {
            'medians': spec['medians'],
            'source': spec['source'],
            'evidence': 'A: existing textbook form review; direction is product convention; pen preview BETA',
        }
    return data


def bbox(medians):
    points = [point for median in medians for point in median]
    assert points and all(len(m) >= 2 for m in medians)
    assert all(math.isfinite(value) for point in points for value in point)
    xs, ys = zip(*points)
    return min(xs), min(ys), max(xs), max(ys)


def pool_layouts(data):
    # 取整个 73 字池的联合骨架 bbox，只计算一次尺度，不按单字 fit。
    points = [point for key, spec in data.items() if key.startswith('hanzi:')
              for median in spec['medians'] for point in median]
    xs, ys = zip(*points)
    union = (min(xs), min(ys), max(xs), max(ys))
    scale = 960 / max(union[2]-union[0]+88, union[3]-union[1]+88)
    return {
        'hanzi': {'scale': scale, 'frame': (32, 32, 992, 992), 'bbox': union},
        'numbers': {'scale': 1, 'frame': (152, 152, 872, 872)},
    }


def geometry_svg(key, spec, uid, pools, guide=True):
    medians = spec['medians']
    bounds = bbox(medians)
    pool = key.split(':')[0]
    layout = pools[pool]
    scale = layout['scale']
    frame_left, frame_top, frame_right, frame_bottom = layout['frame']
    frame_cx, frame_cy = (frame_left+frame_right)/2, (frame_top+frame_bottom)/2
    # 汉字按自身骨架 bbox 中心平移，所有字的 scale 完全相同。
    # 数字保留教材核对版作者格与相对位置；只断言渲染零额外偏移。
    if pool == 'hanzi':
        cx, cy = (bounds[0]+bounds[2])/2, (bounds[1]+bounds[3])/2
    else:
        cx, cy = 512, 512
    tx, ty = frame_cx-scale*cx, frame_cy-scale*cy
    # 格线也留在共同 transform 下，用逆矩阵得到其源坐标边界。
    left, top = (frame_left-tx)/scale, (frame_top-ty)/scale
    right, bottom = (frame_right-tx)/scale, (frame_bottom-ty)/scale
    grid_cx, grid_cy = (left+right)/2, (top+bottom)/2
    span = (frame_right-frame_left)/scale
    transform = f'matrix({scale:.17g} 0 0 {scale:.17g} {tx:.17g} {ty:.17g})'
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
    metadata = html.escape(json.dumps({'key': key, **spec, 'layout': {'pool': pool, 'scale': scale, 'frame': layout['frame']}}, ensure_ascii=False))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="{html.escape(key)} 真实骨架笔型预览" data-key="{html.escape(key)}">
<title>{html.escape(key)} · 真实 median；等宽圆头笔预览</title>
<metadata>{metadata}</metadata>
<defs>{''.join(defs)}</defs>
<g class="character-space" transform="{transform}">
  <rect class="grid-border" x="{left}" y="{top}" width="{span}" height="{span}"/>
  <path class="grid-lines" d="M {grid_cx} {top} V {bottom} M {left} {grid_cy} H {right} M {left} {top} L {right} {bottom} M {left} {bottom} L {right} {top}"/>
  <g class="grey-layer">{''.join(grey)}</g>
  <g class="guide-layer">{''.join(lines)}</g>
  <g class="start-layer">{''.join(dots)}</g>
</g></svg>'''


def screen(data, pools, name, key, queue, index, hint):
    pool = '汉字' if key.startswith('hanzi:') else '数字'
    queue_markup = []
    for i, entry in enumerate(queue):
        state = 'is-current' if i == index else ('is-done' if i < index else '')
        label = '当前' if i == index else ('已描完' if i < index else '待描')
        queue_markup.append(f'<div class="queue-card {state}" role="listitem" aria-label="{label} {entry.split(":")[1]}">{geometry_svg(entry, data[entry], name+"-q"+str(i), pools, guide=False)}</div>')
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
  <div class="zone-primary writing-board">{geometry_svg(key, data[key], name+"-main", pools)}</div>
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
    pools = pool_layouts(data)
    screens = [
        ('01-hanzi-guide', 'hanzi:三', ['hanzi:三', 'hanzi:上', 'hanzi:中', 'hanzi:书'], 0, '先看 3 笔怎么写'),
        ('03-hanzi-complex', 'hanzi:中', ['hanzi:一', 'hanzi:三', 'hanzi:上', 'hanzi:中', 'hanzi:书'], 3, '先看 4 笔怎么写'),
        ('02-number-queue', 'numbers:7', ['numbers:1', 'numbers:7', 'numbers:5'], 1, '先看 1 笔怎么写'),
    ]
    render_specs = []
    for name, key, queue, index, hint in screens:
        page = BASE/'screens'/f'{name}.html'
        page.write_text(screen(data, pools, name, key, queue, index, hint))
        render_specs.append({'name': name, 'url': page.as_uri(), 'png': str(BASE/'out'/f'{name}.png')})
    result = subprocess.run(['node', '-e', RENDER], input=json.dumps({'chrome': CHROME, 'current': str(CURRENT), 'screens': render_specs}),
                   text=True, check=False,
                   env={**os.environ, 'TMPDIR': '/tmp', 'TMP': '/tmp', 'TEMP': '/tmp'})
    for item in render_specs:
        assert Path(item['png']).stat().st_size > 20000
    print('styles.css byte-identical to current/styles.css', flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)


if __name__ == '__main__':
    render()
