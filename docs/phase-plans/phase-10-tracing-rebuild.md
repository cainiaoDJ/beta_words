# Phase 10：描红重建方案（待主人审阅）

2026-11-05。交付范围：撤下旧功能、保留资产、提出方案与静态设计稿；**本轮没有实现新引擎，也没有部署**。以下阶段和默认建议均须主人审阅后再实施。

## 1. 背景与现状

以下是任务书已完成的生产实测结论，本轮直接作为根因证据采用，不重复推导。旧代码定位统一指 `main@66adfd8`，避免撤下后行号漂移。

| 根因 | 旧代码位置与实测证据 | 后果 |
| --- | --- | --- |
| A：字体灰字与 SVG 笔顺独立定位 | `current/app.js:3796–3821` 的 `drawTraceStage()` 用 `ctx.fillText()`；`:3877–3958` 的 `renderTraceOrderSvg()` 独立叠 path。`current/styles.css:3256–3264` 的字体注册只有 `local()`，仓库没有字体文件。生产画布 656px，灰字包围盒宽 591px，蓝线只占中段约 x=200–456px。 | 灰字与蓝线各自定位，设备字体降级后两者基本不重叠。 |
| B：手写 path 与假 median | `current/assets/data/trace-numbers.js:65–68` 的旧 7 为 `M 712 282 L 312 282 L 612 772`，顶横右→左、斜线向右下，整字水平镜像；2（:34–37）、4（:44–50）也已核对出错。旧 1（:29–32）起点 `(592,282)`，单点假 median 却是 `[[592,742]]`。 | 字形、方向不可信，序号甚至在落笔末端。 |
| C：渲染层维护两种坐标约定 | `current/app.js:3872–3891` 在 `spec.yAxis` 分支里为汉字套 `.trace-flip`，而数字、拼音不翻转。 | 坐标约定泄漏到渲染层，容易再次镜像或上下倒置。 |

本轮撤下：`GAMES` 注册、state、入口监听、难度/启动/进度分支、整个描红生命周期及字体等待代码；大厅入口、描红 DOM、三个数据 script；专用 CSS 与无文件的字体声明；手机测试中的描红入口、难度及 zone 预期。

本轮保留：图标 `current/assets/icon-trace-tian.svg`、`trace-hanzi.js` 与 73 个汉字缓存原样不动。数字文件逐字节取自 `feat/stroke-zone@71c3fb6`；拼音只留 `window.TRACE_PINYIN`、id/name/items 空字形占位，`letters={}`，条目和查询结果的 strokes/medians 皆为空，不再保留手写字形。

当前本地可运行产品没有描红入口，其余 **8 个游戏**保留。主人随后发布此分支成果后，生产也会呈现这个状态；**当前生产尚未被本轮修改**。教材数字和汉字资产只是保留在仓库，不会从大厅或 app.js 被加载。

架构依据来自 `feat/stroke-zone:docs/architecture-2026-09-writing-engine.md` §1、§3（可用 `git show` 阅读，文件没有复制进本分支）。该文其他分支的引擎进度不等于本分支已有实现。

## 2. 目标与四条硬约束

原则：**同一套坐标系、同一份数据**。SVG 是渲染容器，撤下的是以手写 path 为数据核心的旧方案。

1. 灰色范字与彩色引导必须来自**同一份 skeleton**，只允许一次字符盒布局；灰字、引导、序号、用户笔迹共享同一个 transform。不得分别计算 bbox 或 auto-fit。
2. **不再用系统字体渲染灰字**。灰字由 skeleton 经 pen model 展开的 outline 得到；彩线引用生成 outline 时所用的同一条拟合中心 path。两层之间只有笔宽/颜色差异，不得另存一套范字路径。不增加真实字体文件作为描红范字的替代方案。
3. 第 i 笔的序号圆心严格等于 `medians[i][0]`，序号是 `i+1`；禁止从 outline 起点或 bbox 反推。拟合必须保留首末点、笔序与方向，不能为了平滑而倒序。
4. 内部统一 **Y-down / viewBox `0 0 1024 1024`**。源汉字 Y-up 在数据适配层一次性变为 `y'=1024-y`；其参考 outline 若用于对照，也只能在适配层转换。渲染 spec 不暴露 `yAxis`，渲染器没有翻转分支。

## 3. 架构与职责边界

```text
版本化原始数据（只读）
  → 数据适配：source/evidence + 有序 medians → 内部 Y-down skeleton
  → Bézier fitting：保端点、保拐点、保方向 → 有序中心路径
  → pen model：宽度/压力曲线、cap、join → 沿中心线的笔触参数
  → stroke expansion：边界偏移、端点与连接 → 每笔闭合 outline
  → 渲染：灰色 outline + 同源彩色中心 path + median[0] 序号
```

**数据层**：读取原始资产并记录来源版本/摘要，不修改原件。输出内部契约，建议字段为 `id/pool/viewBox/source/evidence/strokes[]`；每笔包含 `median:[[x,y],…]`、可选 `cornerIndices`、`pen`。旧字段 `strokes`（历史 path 字符串）通过适配器隔离，不能与内部 `strokes[]` 混用。中间生成物带 `skeletonHash/fitVersion/penVersion`，允许缓存、可重算，不是新的真源。

**拟合与笔触层**：输入有序 median，输出中心曲线及 outline；不读取 DOM、不自行居中。起步用等宽圆头笔，折点分段，曲线不跨过明确拐点；参数均标为产品笔型 BETA。拟合偏差建议最大 3 个设计单位，超限拒绝生成；端点误差不超过 `1e-6`。汉字现有 outline 保留为来源参考、用于形态差异审阅；不直接拿它替换新灰字，否则又破坏同源硬约束。正式展开算法需在 Phase A 选型和验证，本轮没有编写该算法。

**判定层**：只读内部 skeleton/拟合曲线与笔序；用户坐标经共享矩阵的逆矩阵进入 1024 设计空间。比较起落点、前进方向、有序覆盖率、偏离走廊；不根据屏幕像素或灰字字体边界判定。建议初始起落点半径 60、走廊半径 64、覆盖率 ≥85%，均为待真实儿童试用校准的产品参数，不是书写规范。测试须锁定边界正反例，走反方向、跨笔和乱画不能通过。

**字符格布局**：字符格每池定义。汉字源数据没有作者格，以池内全部 73 字适配后骨架并集 bbox 推导尺度，计入两侧各 44 单位笔宽/序号余量，统一 scale=`960/max(联合宽+88,联合高+88)=0.9239653512993262`，渲染格固定为 `[32,992]²`；每字仅按自身骨架 bbox 中心平移到格心。数字格由作者给定，为 `[152,872]²`、scale=1，保留作者位置，不逐字平移或缩放。**灰字、引导、序号共享同一 transform 是硬约束**，格线也在该矩阵下按逆变换确定边界。

数字位置保留理由（主会话裁定）：数字数据已逐页核对教材且有 p16/p40/p51/p60 页码出处，字在格中的位置是源数据的决定，渲染层擅自平移会改变已验收的教材字形位置。本轮缺陷是旧 fit 强行撑满 1024 画布，导致汉字格心对齐画布中线、整体沉底约 90 单位；数字原本就在作者格内，与格线同源同格，没有这类错位。数字 1、3、6、9 等字形的 bbox 中心天然可以偏离格心，例如斜笔 1 的 x 范围 `[360,620]` 中心为 490，源偏移为 -22；这是字形对称性与教材位置的结果，不是渲染错误。数字不要求 bbox 居中，要求渲染不引入任何额外偏移；汉字格由骨架并集推导，要求逐字精确居中。

**渲染层**：只消费归一化结果；共用 SVG 根 viewBox 和一个字符盒 `<g>`，不分池处理方向。序号文字保持正立，只圆心附着起笔点；不得为避让标签移动圆点。重叠起笔点改为当前笔突出显示，其他序号淡出，而不是改数据起点。

**交互层**：管理演示→待描→描写→校验→下一笔→完成，以及清除/重播/下一字/返回；只发命令、呈现状态，不维护另一份几何。Pointer capture、pointercancel、resize、离开时取消动画/异步任务均属此层。清除只重置当前字笔迹；“下一字”正式版在当前字完成后启用，重播不清除笔迹。阶段 B 验收这些行为。

布局：沿用 Z1 标题、Z2 进度、Z3 300×300 米字格、Z4 待描字列表、Z5 工具栏；不改其余游戏或共享框架。四线三格只在未来拼音子集的格线层替换，字符盒与矩阵契约相同。画布外的标题/按钮可用系统 UI 字体，范字及待描字缩略图均用 skeleton 渲染。

## 4. 分池数据策略与来源纪律

证据等级用于限制声明范围：**A** = 本仓库已有逐页视觉核对记录；**B** = 可追溯开源几何数据，不等同教材审定；**BETA** = 产品建模或缺乏逐字可验证来源。数据的字形来源、轨迹方向、笔型可以分别属于不同等级，不用一个 PASS 掩盖全部。

| 池 | 资产与拟用字段 | 证据、缺口与开放范围 |
| --- | --- | --- |
| 汉字 | `current/assets/data/trace-hanzi.js` 提供池名单；`hanzi-cache/*.json` 73 字，有成对的 `medians`、`strokes`（outline），部分有 `radStrokes`。来源为 [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)，现有包装器记录版本 2.0.1。 | 几何为 B，73 字是去重后的实际缓存数量，不宣传成 100 个不同字。名单的教材归属不因历史注释自动获得 A；适配时另记 `source/evidence/rawHash`。原 outline 完整保存，生成笔型的形态偏差需审阅；发布前核查数据授权/署名。 |
| 数字 | `feat/stroke-zone` 原样教材核对版 1–10。每笔有完整 `medians`，保留 `strokes` 参考与 `source=citation(page)`，Y-down。 | 字形 A：人教版《数学》一年级上册，2022 年 8 月第 2 版，ISBN 978-7-107-36922-3；1–5 p16，6–7 p40，8–9 p51，10 p60，均沿用已验收记录，未在本轮重新核书。**教材没有独立箭头笔顺图，median 方向是产品轨迹规定，不是教材笔顺结论**。0 为未验收 demo，不进 items/正式池。笔型与方向注明产品约定。 |
| 拼音 | 当前空占位不可练习；拟用 parametric skeleton / Primitive Stroke Library：oval、open-loop、loop、ascender、descender 等；每个字母一个 `baseSkeletonId`，声调是单独有序 skeleton 层，记录基线、字号参数与来源。 | **暂无权威逐字手写源，全部 BETA**。先 a/o/e/i/u/ü，再逐组扩展；同一元音四声的字母骨架、参数和 transform 必须完全相同，仅 tone 层变化。ü 两点归字母本体，声调单独布局。不恢复旧手写样本，也不默认把整体认读音节列入首发。 |

每项至少记录 `source`（可验证出处/原始资产/版本或页码）、`evidence`、`reviewStatus`；未找到可验证逐字来源就标 BETA，缺字段拒绝入可开放池。引用权威教材只限已核对的字形，不外推成权威笔序。**严禁编造“教育部规范”“人教版第 X 页”等出处**；旧数据曾被 review 识别出无来源声明，不能继承它们当结论。公开仓库并不自动证明与某册教材完全一致。

## 5. 实施阶段与准入门槛（未来工作，本轮不实施）

所有未来代码保留纯静态形态：浏览器直接加载 JS/CSS/JSON，不引入 npm、构建步骤或后端。下表路径是建议，尚未新增这些产品文件。

| 阶段与依赖 | 做什么 / 拟改文件 | 可自动化验收与提交边界 |
| --- | --- | --- |
| 0 撤下旧方案（本轮） | 指定 app/index/styles 删除；数字原样迁入、拼音占位；测试和文档同步。 | app 无 trace 任何大小写；三数据脚本不加载；8 个大厅入口；手机 Failed=0；console/pageerror 均 0。独立 `ui:` 提交。 |
| A 基础设施，依赖方案获批 | 只新增隔离的 `current/scripts/tracing/{data,geometry,pen,judge,renderer}.js` 与 `scripts/tracing-contract-test.js`，必要时独立 CSS token。不改任何业务 screen、不开放入口。 | 对 73 字 + 1–10 校验非空多点 median、有限坐标、有序配对；Y 适配只一次；拟合端点/方向/拐点、展开边界、退化输入与有限 bbox；所有灰字/引导同源 hash；当前整套手机测试 Failed=0。框架独立 commit。 |
| B 试点，依赖 A | 仅汉字最简单子集“一、三、上”，隔离试点页 `current/tracing-pilot.html` 与专属 `tracing/pilot.css`、`tracing/session.js`，不挂大厅。 | 起笔点/笔序与同 transform 几何断言全通过；正例通过，错误起点/反向/乱画拒绝；清除、重播、完成、返回、拖出画布、旋转/缩放与动画取消；7 手机及大屏试点无溢出，当前手机全套 Failed=0。试点独立 commit；失败回 A，不能直接推广。 |
| C1 汉字推广，依赖 B | 用 `tracing/data.js` 的只读适配逐组覆盖缓存中剩余字；必要时专属局部 override，不修改已验收共享框架。 | 每组独立提交；每组前跑本组契约，后跑此前所有试点/组的回归及完整手机测试，Failed=0；“中、书”等负 Y 原始点不裁切，起笔点重叠不位移；派生笔型与源 outline 对照审阅。 |
| C2 数字推广，依赖 C1 | `tracing/numbers.js` 适配原资产，只读 median，不用原 path 反推；1–10 逐个迁移、逐个提交，0 拒绝入池。 | 每个数字各笔正例/反向/偏离/错误起点；7 首段 x 递增、末段左下；source 页码和原件摘要保持；每字回归已迁移内容、手机 Failed=0。不得改教材数据“优化笔顺”。 |
| C3 拼音推广，依赖 B 的稳定框架和 BETA 标识审阅 | 新 `tracing/pinyin-primitives.js` 与新版 `trace-pinyin.js`；先元音后字母组，每组独立 commit。 | 四声去 tone 层后中心 path/参数/hash 完全一致；ü 点位/四线三格/声调边界不溢出；每项 source/evidence 完整；逐组契约、前序回归、手机 Failed=0。没有来源/产品字形审阅的条目继续隔离。 |
| D 恢复大厅，至少 B + C1 通过后 | `current/app.js/index.html/styles.css` 接入已验收汉字池，复用保留图标；同步 `scripts/mobile-one-screen-test.js`、README。数字只有 C2 完成后可接入；拼音只有 C3 与主人接受 BETA 后可接入。 | **恢复前必须把新增入口、每个实际池/难度、gameplay/complete 加进手机脚本并跑 Failed=0**，记录脚本真实 Total（不能沿用 413）。8 个原游戏无回归；冒烟 console/pageerror=0；全流程浏览器交互通过。满足后才能提交开放入口，部署由主人另行安排。 |

框架推广中发现缺陷：优先隔离局部 override 并登记；结构性问题退回试点，不能边改框架边批量迁移。每个迁移 commit 前后都要验证，失败先隔离并单独修复，禁止提交已知 UI fail。当前撤下只删除旧描红子集，没有借机重构共享框架或多个游戏。

## 6. 风险与待主人拍板的开放问题

1. **首版笔型取舍**：推荐等宽圆头笔先行，汉字原 outline 仅作参考对照；理由是同源关系可证明、交互容错稳定。风险是与源汉字书法轮廓不同，需审阅生成结果后再接受首版风格。本轮设计稿仅演示此默认值，不代表已批准正式笔型。
2. **重建期间入口**：推荐彻底撤下，重建完成后再开放；理由是避免孩子点进不可用内容。本轮按任务书已撤下，未来是否改成“重建中”占位仍由主人决定，本轮没有制作占位入口。
3. **首发范围与拼音证据缺口**：推荐先汉字、再数字，拼音保持隔离 BETA，待逐字源/产品字形审阅完成再开放。理由是现成汉字 skeleton 与数字教材记录可追溯；参数化拼音共享骨架解决一致性，不能证明教材规范性。不以引入真实字体替代范字 skeleton，也不将四声一致误称为权威来源完成。

## 7. 验收与回归清单

- [ ] 数据：有来源、证据等级、版本/hash；1–10 原件不改；0 不入池；73 字原件完整；拼音未验收数据不能被开放配置引用。
- [ ] 结构正确性：每笔 median ≥2 个有限点；编号 i+1、圆心等于 median[i][0]；顺序严格来自 median 数组，不从 outline 或形状排序。**这些是结构/轨迹断言，不足以自动证明字形符合教材**；仍须已验收来源对照和人工审阅。
- [ ] 同源：灰字 outline 的 `skeletonHash/fitVersion/penVersion` 与彩线一致；灰字与彩线使用相同中心 path id；禁止 fillText、字体范字和两套 auto-fit。
- [ ] 几何：比较灰字、彩线、圆心的 `getCTM()`，矩阵分量误差 ≤`1e-6`；`T(median[0])` 与圆心屏幕位置误差 ≤0.5 CSS px。每条中心曲线采样点必须在对应展开轮廓内（除数值容差），轮廓边界离中心线不超过该处 pen 半宽+容差；不能只比较 bbox 或肉眼看重叠。
- [ ] 字符盒（两池断言不同）：保留汉字负 Y 原始点（中 -10、书 -44），只做一次 Y-down 适配，不裁点/clamp。汉字全池 73 字联合 bbox 为 `[44,181,995,1085]`，统一 scale=`960/1039=0.9239653512993262`；每字只平移自身骨架 bbox 中心到固定格 `[32,992]²` 格心，**字心−格心的距离≤1e-4 设计单位**。数字固定作者格 `[152,872]²`、scale=1，**渲染偏移−独立从原始 median 计算的源偏移，其距离≤1e-4 设计单位**；不要求 bbox 居中，因为非对称字形与教材位置不能被渲染层重新安排。两池逐 SVG 检查：骨架 bbox 加 `max(44,笔宽/2,序号半径+边线/2)` 后完全在实际字符格内；格边四条边与该池格定义一致（SVG float32 格边读数误差≤1e-4），横竖/对角线交于格心；灰字/引导/序号/格线 getCTM 相同，metadata 与独立读取的原始 median 一致；数字各 SVG 局部 scale 恒为 1，数字 1 实际渲染宽度≤7，禁止逐字缩放。
- [ ] 方向：汉字仅适配层翻 Y；内部 spec 不含 yAxis；数字 7 的顶横左→右、斜线左下；拟合端点保持原值且采样弧长参数不反转。双重翻转、反向轨迹、空 median 作为反例必须失败。
- [ ] 拼音：同字母四声剥离 tone 后 skeleton hash、fit 和字母矩阵相同；四声共用联合布局包络，禁止各调单独 auto-fit 改变本体大小/位置。声调单独有序编号，ü 的点不丢失。
- [ ] 判定：正确路径通过，错起点/倒序/跨笔/涂满画布/偏离走廊均拒绝；记录清除、取消、resize、快速返回后无迟到事件。
- [ ] `node --check current/app.js`；手机脚本覆盖当前所有游戏和可见状态，**Failed=0**，记录真实 Total；桌面/横屏/iPad 抽查；浏览器 console error/pageerror=0。
- [ ] 未来部署另行验收：公网 md5 一致只证明传输一致，**不证明渲染正确**；还需公网浏览器截图、几何断言、笔序与触控核对。生产 `/var/www/games/current/` 下遗留的 `current/` 也能解析，届时两个路径都要更新。本轮不访问、不修改生产。

## 8. 静态设计稿、复跑与本轮证据

路径：`docs/mockups/phase-10/`。`styles.css` 是从**本轮撤下后的** `current/styles.css` 逐字节复制，不手写现有产品样式；除移除旧描红样式外，其余规则与 main/线上基线相同。由于本轮不部署，该副本不宣称与尚未更新的生产 CSS 整文件 md5 相同。

三屏：`01-hanzi-guide`（三，单字主界面）；`02-number-queue`（7 与 1/7/5 待描列表、工具栏）；`03-hanzi-complex`（中，多笔复杂字与一/三/上/中/书列表）。所有范字和缩略图读取真实 median；汉字源 outline 只保留在原资产中，不当另一层灰字。

运行 `TMPDIR=/tmp python3 docs/mockups/phase-10/gen_mockups.py`。生成器先复制 current/styles.css，通过 Node VM 读取原样数字文件、Python 读汉字缓存，在生成 HTML 前一次性把汉字 median 转 Y-down。灰字宽笔触、彩色细线以 `<use>` 引用同一个 median path，序号取该笔第一个点；格线与全部字形图层在一个共同 `<g transform>` 中。米字格采用每池固定的字符格；汉字统一尺度后按字心平移，数字保持作者格与 scale=1。字形/序号余量都必须位于实际格边以内；不能用撑满 1024 源画布的包围盒代替字形居中。设计稿用浏览器 SVG stroke（等宽、圆端/圆连接）预览展开效果，**没有实现 Bézier fitting、可导出的闭合 outline、判定或游戏交互引擎**。折线连接忠实保留原 median，正式拟合需未来阶段验收。

生成器使用既有 Chromium 路径 `/home/alpha/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`，通过现有 `/tmp/node_modules/playwright` 控制同一 Chromium（当前环境 CLI `--screenshot` 不结束），固定 360×640 设计画布、2x 截图；HTML 自包含真实字形与来源摘要，离线可审阅，无 CDN。可以重跑，但会同步复制最新 current CSS，复跑后须审阅副本 diff。

本轮产品验证（2026-11-05，本地服务 `127.0.0.1:4174` 已存在，进程参数确认根目录为本仓库 `current/`，复用该服务；未启动或修改任何系统服务）：

```text
$ node --check current/app.js
node --check exit: 0
$ grep -c 'trace\|Trace\|TRACE' current/app.js
0
app grep exit: 1
$ grep -rn 'trace' current/index.html current/styles.css
HTML/CSS grep exit: 1
```

grep exit 1 表示没有匹配，不是校验失败。HTML/CSS 没有任何残留，因此没有需要解释的保留引用；图标文件本身保留且未被加载。运行 `BASE_URL=http://127.0.0.1:4174/ node scripts/mobile-one-screen-test.js`，真实末尾：

```text
✅ [Tiny phone    (320x568)] play:math-flash:6                    canvas=320x568 vpH=568 designH=612/640 zone[p1,s1,t0 295x178]
✅ [Tiny phone    (320x568)] play:math-flash:6:complete           canvas=320x568 vpH=568 designH=612/640 zone[p1,s1,t0 295x178]
---
Total: 413, Failed: 0
```

这是 7 机型、8 个游戏，每机型 59 测试点的实际结果，包含 8 个 setup 与 25 组游戏难度的 play/complete。旧 462 撤下描红后减少 49（含其 setup），不是只减 42，故实际 Total 为 413 而非预估 420。AGENTS.md 已同步实测值；恢复入口后总数必须重测。

Playwright 本地冒烟真实输出（大厅断言精确 8 个入口、描红入口/DOM/script 均不存在，并逐游戏进入难度/游戏/返回）：

```text
Lobby entries: open-match, open-memory, open-pinyin-friend, open-listen-card, open-compare, open-stroop-train, open-math-flash, open-idiom-fill
Large viewport 1440x900: 8 games PASS
Large viewport 844x390: 8 games PASS
Large viewport 768x1024: 8 games PASS
console error: 0
pageerror: 0
```

保护资产校验：数字与 `git show feat/stroke-zone:current/assets/data/trace-numbers.js` 逐字节相同，MD5 `a66591fab96b80f95106e37435082c8d`。`trace-hanzi.js`、73 个 hanzi-cache JSON、描红图标与 phase-9 对 main 的 diff 均为空。所有本地提交只在 feat/trace-rebuild，无 push/merge/rebase/部署。


设计稿真实输出（最终版）：

```text
rendered 01-hanzi-guide {"svgs":5,"geometryChecks":20} 87750 bytes
rendered 02-number-queue {"svgs":4,"geometryChecks":5} 79000 bytes
rendered 03-hanzi-complex {"svgs":6,"geometryChecks":23} 94132 bytes
Mockup console/pageerror: 0
styles.css byte-identical to current/styles.css
```

已逐图查看三屏；另抽看本地大厅、桌面 1440×900 的消消乐、横屏 844×390 的颜色游戏和 iPad 768×1024 的闪卡截图，布局无新增裁切。预览检查覆盖 15 个真实字形 SVG，48 项逐笔同源/矩阵/起点检查，另校验字形包络、面板可见与文档高度；这些不替代未来正式笔触展开和描写判定测试。

独立来源复核输出：`Independent source check: 15 SVG metadata match original medians`（逐个从生成 HTML 解出 metadata，再与原始缓存/数字池读取结果比对，汉字仅做 y=1024-y 适配）。三张 PNG 均为 720×1280；CSS 副本 SHA256 与 current 一致：`19bd7d46ea36b7cc5e06846a86b9f27188ed9a9fbe9f878359d3c9cb7e150a18`。

提交前三屏完成后再次完整运行手机回归，仍为 `Total: 413, Failed: 0`（exit 0）。拼音空占位核验输出：`Pinyin placeholder: letters=0, items=24, all strokes/medians empty`；数字/拼音 JS 也通过 `node --check`。

## 9. 字符格居中修复验收（已完成）

根因：上一轮用 `min(0,bboxMin)` / `max(1024,bboxMax)` 把 fit 撑成源画布，格心对齐画布中线而非字形中心。现已删除这套 fit。汉字使用全池统一尺度，逐字平移到格心；数字遵守主会话裁定，保留作者格、scale=1 和原始位置。§3、§7、§8 已与实现同步，断言按池定义，不再把同一个 bbox 居中门槛套给两个池。

浏览器实际验收输出（包含主字和缩略图；偏移单位为 1024 viewBox 设计单位，另列 CSS px）：

```text
Pool hanzi: {"characters":73,"bbox":[44,181,995,1085],"scale":0.9239653512993262,"cell":[32,32,992,992]}
Pool numbers: {"scale":1,"authorCell":[152,152,872,872],"cell":[152,152,872,872]}
offset 01-hanzi-guide main hanzi:三 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 01-hanzi-guide queue hanzi:三 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 01-hanzi-guide queue hanzi:上 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 01-hanzi-guide queue hanzi:中 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 01-hanzi-guide queue hanzi:书 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
rendered 01-hanzi-guide {"svgs":5,"hanziCentered":5,"digitSourceOffset":0,"insideCell":5,"gridIsCell":5,"digitWidthAndScale":0,"existingGeometry":20,"originalMetadata":5,"poolScale":5,"widths":{}} 86556 bytes
offset 03-hanzi-complex main hanzi:中 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 03-hanzi-complex queue hanzi:一 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 03-hanzi-complex queue hanzi:三 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 03-hanzi-complex queue hanzi:上 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 03-hanzi-complex queue hanzi:中 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
offset 03-hanzi-complex queue hanzi:书 渲染偏移=(0.000000,0.000000) CSSpx=(0.000000,0.000000) error=0.000000 tolerance=0.000100
rendered 03-hanzi-complex {"svgs":6,"hanziCentered":6,"digitSourceOffset":0,"insideCell":6,"gridIsCell":6,"digitWidthAndScale":0,"existingGeometry":23,"originalMetadata":6,"poolScale":6,"widths":{}} 95804 bytes
offset 02-number-queue main numbers:7 源偏移=(8.000000,-2.000000) → 渲染偏移=(8.000000,-2.000000) CSSpx=(2.312500,-0.578125) error=0.000000 tolerance=0.000100
offset 02-number-queue queue numbers:1 源偏移=(-22.000000,-2.000000) → 渲染偏移=(-22.000000,-2.000000) CSSpx=(-0.902344,-0.082031) error=0.000000 tolerance=0.000100
offset 02-number-queue queue numbers:7 源偏移=(8.000000,-2.000000) → 渲染偏移=(8.000000,-2.000000) CSSpx=(0.312500,-0.078125) error=0.000000 tolerance=0.000100
offset 02-number-queue queue numbers:5 源偏移=(13.000000,-7.000000) → 渲染偏移=(13.000000,-7.000000) CSSpx=(0.533203,-0.287109) error=0.000000 tolerance=0.000100
rendered 02-number-queue {"svgs":4,"hanziCentered":0,"digitSourceOffset":4,"insideCell":4,"gridIsCell":4,"digitWidthAndScale":1,"existingGeometry":5,"originalMetadata":4,"poolScale":4,"widths":{"numbers:1":{"width":13.453125,"scale":1,"viewportScale":0.041015625},"numbers:7":{"width":15.9375,"scale":1,"viewportScale":0.0390625},"numbers:5":{"width":15.09375,"scale":1,"viewportScale":0.041015625}}} 75932 bytes
汉字池 totals: {"hanziCentered":11,"digitSourceOffset":0,"insideCell":11,"gridIsCell":11,"digitWidthAndScale":0,"existingGeometry":43,"originalMetadata":11,"poolScale":11}
数字池 totals: {"hanziCentered":0,"digitSourceOffset":4,"insideCell":4,"gridIsCell":4,"digitWidthAndScale":1,"existingGeometry":5,"originalMetadata":4,"poolScale":4}
Geometry totals: {"hanziCentered":11,"digitSourceOffset":4,"insideCell":15,"gridIsCell":15,"digitWidthAndScale":1,"existingGeometry":48,"originalMetadata":15,"poolScale":15}
Mockup console/pageerror: 0
Geometry failures: []
styles.css byte-identical to current/styles.css
GEN_EXIT=0
```

汉字池精确居中 11/11，包含一、三、上、中、书，字心−格心均为 `(0.000000,0.000000)`。数字池渲染零额外偏移 4/4：1 `(-22,-2)→(-22,-2)`、5 `(13,-7)→(13,-7)`、7 `(8,-2)→(8,-2)`（7 同时出现在主字与列表）。两池位置误差均为 `0.000000`，验收容差为 `1e-4` 设计单位。

不出格 15/15、格线等于字符格 15/15、原有逐笔同源/矩阵/起点 48/48、metadata 与独立原资产比对 15/15、池统一尺度 15/15；数字 1/7 宽度检查 1/1，实际为 `13.453125 / 15.9375 CSS px`。全部断言通过，`GEN_EXIT=0`，console/pageerror=0。

三张 PNG 均已重新生成并逐图查看：01 `86556` bytes、02 `75932` bytes、03 `95804` bytes，均为 720×1280；数字图保持作者位置。CSS 副本仍与 current/styles.css 逐字节相同。

产品不变校验：追加任务起始 HEAD 为 `9740210`，`git diff 9740210 -- current/` 为空；没有修改产品、其他分支或生产，未 push/merge/部署。

本轮手机回归真实末尾（exit 0）：

```text
✅ [Tiny phone    (320x568)] play:math-flash:6                    canvas=320x568 vpH=568 designH=612/640 zone[p1,s1,t0 295x178]
✅ [Tiny phone    (320x568)] play:math-flash:6:complete           canvas=320x568 vpH=568 designH=612/640 zone[p1,s1,t0 295x178]
---
Total: 413, Failed: 0
```
