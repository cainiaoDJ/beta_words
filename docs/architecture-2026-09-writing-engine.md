# 书写引擎架构调研（2026-09-24）

> 主人原文转发了一份关于拼音/数字/汉字书写引擎架构的深度调研结论。
> 本文记录调研结论、引擎边界与实施决策。

---

## 1. 主人转发的核心结论（独立调研）

主人推荐的母项目是 **Hanzi Writer + Make Me a Hanzi**，参考"single-line font / stroke font"思路做拼音和数字。

数据模型应该是：

```text
skeleton（书写轨迹 / median）
   ↓
Bézier fitting
   ↓
Pen model（笔锋粗细 + 端点 + 连接）
   ↓
stroke expansion
   ↓
outline（最终 SVG 渲染结果）
```

**核心数据：skeleton / median。outline 是渲染产物，不是数据。**

参考链接：
- [Hanzi Writer GitHub](https://github.com/chanind/hanzi-writer)
- [Hanzi Writer Data Explorer](https://chanind.github.io/hanzi-writer-data/)
- [Make Me a Hanzi GitHub](https://github.com/skishore/makemeahanzi)

Primitive Stroke Library（拼音专用骨架）：

```text
P01 横
P02 竖
P03 撇
P04 捺
P05 点
P06 提
P07 横折
P08 竖弯
P09 圆弧
P10 环形
P11 钩

L01 left-loop
L02 right-loop
L03 oval
L04 ascender
L05 descender
```

例如：
```text
o = oval
a = oval + right-descender
c = open-oval
e = entry-stroke + loop
```

参数化控制字风：
```text
oval(
  width=0.78, height=0.92, slant=2.5°,
  topFlatness=0.16, leftBulge=0.12, rightTension=0.08
)
```

---

## 2. 我们当前实现（符合/不符合这个架构）

### 2.1 汉字部分（`trace-hanzi.js` + `hanzi-cache/*.json`）✅ 符合

```json
{
  "strokes": ["M 311 681 Q ...", ...],   // outline
  "medians": [[[296,725],...]],          // skeleton（中轴线）
  "radStrokes": [5,6,7]
}
```

直接消费 Hanzi Writer CDN 数据，已是 skeleton + outline 结构。

### 2.2 拼音部分（`trace-pinyin.js`）❌ 不符合

```js
a: {
  strokes: ["M 605.3 456.0 C ...", ...],   // 只有 outline
  medians: [[605, 456]],                  // 存在但渲染没用到
}
```

- 数据只有 outline，**skeleton 没作为独立层**
- 没有 pen model（笔锋粗细、cap、join）
- 不同声调用了不同手写实例（a-1/e-2/o-1 各 4 份） → **4 个 e 永远长不一样**（被 VLM 和 27B 同时指出）
- 数据源问题：22 个其他字母 + 10 个数字 **完全没有源**

### 2.3 数字部分（`trace-numbers.js`）❌ 仅有占位 path，质量未定

### 2.4 渲染层（`engine/stroke/zone-stroke.js`）

```js
class Stroke {
  path: string,           // ← 直接拿 outline 渲染
  medianStart, medianEnd:  // 没用上
  transform: { dx, dy }    // 没用上
}
```

2026-10-01 已补上最小 skeleton 消费链：`Stroke.median[]` 保留汉字中轴线，
`ZoneStroke.getValidationGuide()` 将它转换到 auto-fit 后的渲染坐标，`PenTool`
在同一坐标系校验用户笔迹。拼音/数字尚无可信 median 时，临时从其中心线 SVG
path 采样；这不是权威 skeleton，不能把它当作数据验收完成。

仍未实现 pen model、Bézier fitting 与 outline expansion；当前 SVG path 仍是渲染素材。

---

## 3. 为什么"4 个 e 长不一样"是架构 bug，不是数据 bug

e3"双层/党帽"的根因：

1. 我把**主人在 22:43 手写照片里的 4 个手写样本**（e-1/e-2/e-3/e-4）当成 4 个"独立字母"
2. 每个手写样本的 SVG path 微妙差异（手写自然变体）
3. 渲染层**只缩放和居中**，不处理"笔锋粗细 / 起收笔形态 / 视觉一致性"
4. e-3 在源图里因为光线/墨迹导致笔锋看起来"双层"，渲染层原样保留了

**架构层面错的**：渲染层应该用 skeleton + pen model 把 4 个 e **强行渲染成视觉一致**，而不是依赖源 SVG path 的微小数值差异。

---

## 4. 候选方案

主人原文："如果让我帮你给这个项目选一个'参考母项目'，我会首选 Hanzi Writer + Make Me a Hanzi。"

我提了 4 个候选路径，等主人决策：

### 方案 A：立即重构（彻底改架构）

- **改什么**：renderer (`zone-stroke.js`) 重写为 skeleton→贝塞尔拟合→pen model→outline
- **数据**：把 `trace-pinyin.js` 的 a/o/e/c 从 outline-only 改造成 skeleton + outline
- **代价**：4-6 小时。期间暂停 letter 调优
- **风险**：renderer 重写可能引入新 bug
- **收益**：架构正确，以后加数字/汉字/书写判定都直接接得上

### 方案 B：先解决数据源（再重构）

- **改什么**：去 GitHub 找 `pinyin-font` / `chinese-font-pinyin` 之类开源骨架数据
- **数据**：有了源后再决定怎么重构
- **代价**：0.5-1 小时调研
- **风险**：可能根本找不到合适的 pinyin skeleton 数据
- **收益**：拿到权威骨架数据，避免我手工 sketch

### 方案 C：当前 SVG 模型继续推进（承认架构债）

- **改什么**：不动架构，把 26 字母 + 10 数字 + 100 常用汉字用现有 SVG 路径模型做"能跑"
- **代价**：架构债之后要还（主人原话："做到汉字和书写评判阶段，会有非常明显的重构成本"）
- **风险**：到书写判定时基本要重写
- **收益**：短期可见交付

### 方案 D：混合（局部重构）

- **改什么**：
  - 汉字继续用 Hanzi Writer 数据（已是 skeleton+outline）
  - 拼音用 Primitive Stroke Library（oval + descender 等）参数化
  - 数字同上
- **代价**：中等
- **风险**：Primitive Stroke Library 的参数化建模我之前没做过
- **收益**：拼音/数字可参数化生成，汉字用现成的

---

## 5. 我的建议

- **如果主人想长期做这个产品**（拼音声调评测、汉字书写判定）→ 选 A
- **如果主人想快速出 demo** → 选 C
- **如果主人想花点时间调研不急** → 选 B
- **如果主人想稳一点** → 选 D

---

## 6. 主人决策记录

**2026-10-01 决策：先完成可验证的描红判定基础，再进行内容与视觉扩展。**

- [x] 坐标统一：逻辑坐标 ↔ auto-fit 渲染坐标由 `ZoneStroke` 单一管理。
- [x] 判定升级：起/落点距离 + 目标覆盖率 + 偏离走廊，取代八扇区终点判定。
- [x] 数据接入：新增 `Stroke.fromTraceSpec()`，拼音/数字 demo 统一使用。
- [x] 回归：新增 `scripts/stroke-engine-test.js`（汉字正/反例、拼音、数字）。
- [ ] 拼音/数字改成权威 skeleton 与参数化 pen model（后续对应方案 D）。
- [ ] 描红游戏 UI 重新接入（引擎回归稳定后再做）。

这不是方案 A 的完整 renderer 重写，也不是承认技术债的方案 C；是先把方案 D
所需的“可用且可测的判定层”落地，再补齐拼音/数字数据模型。

---

## 7. 相关文件

- `engine/stroke/stroke.js` — Stroke 模型（需要扩展支持 skeleton + pen）
- `engine/stroke/zone-stroke.js` — 渲染层（需要重写为 skeleton→outline）
- `current/assets/data/trace-pinyin.js` — 拼音数据（需要从 outline-only 改 skeleton+outline）
- `current/assets/data/trace-numbers.js` — 数字数据
- `current/assets/data/trace-hanzi.js` — 汉字 Hanzi Writer wrapper（已符合架构）
- `current/assets/data/hanzi-cache/*.json` — 73 字 Hanzi Writer 数据缓存

## 9. 当前验收边界（2026-10-01）

引擎契约测试运行方式：

```bash
python3 -m http.server 4174 --directory current
BASE_URL=http://127.0.0.1:4174/ node scripts/stroke-engine-test.js
```

它验证：auto-fit 后可见起点可以起笔、沿 target median 的轨迹通过、经过远离目标
角落的伪造轨迹被拒绝，以及拼音/数字 demo 可渲染且没有无效 SVG transform。
它不替代正式游戏的手机一屏测试，也不代表拼音/数字字形已通过教材验收。

## 10. 下一步计划（2026-10-01 暂定）

### 当前冻结边界

- 汉字引擎与 demo 作为下一阶段 UI 接入的稳定基线；修复只接受有契约测试覆盖的回归。
- 拼音与数字可演示、可走轨迹判定，但字形、笔顺和 median 数据仍为 BETA；不提前在正式大厅开放。

### Phase 1：数字 1–10 素材验收（优先）

1. 从人教版数学一年级上册的田字格示范逐字提取可追溯参考。
2. 为每个数字记录笔顺、起落点与完整 centerline median；不再依赖 path 采样回退。
3. 将每个数字加入 `stroke-engine-test.js` 的正例、偏离反例与起笔反例。
4. 仅在数据、引擎测试和 364 项移动端回归全绿后提交独立 `asset(numbers):` commit。

### Phase 2：拼音素材验收

1. 先完成 a/o/e/i/u/ü 的四线三格基线和四声位置，再扩展到其他字母与整体认读音节。
2. 按 Primitive Stroke Library 建立参数化 skeleton，避免同一字母的不同声调出现不同手写实例。
3. 每一组字母注明课本页码或明确标记为 BETA，不以“教育部规范”作无来源背书。

### Phase 3：恢复正式描红游戏（汉字试点）

1. 仅恢复汉字池入口与一个 `.screen.active` 试点：笔顺演示 → 描写 → 清除 → 下一字。
2. 接入完成判定、错误提示和无障碍标签；不在试点混入拼音/数字。
3. 通过 `stroke-engine-test.js`、364 项移动端回归及手测后，再逐个接入数字、拼音。

## 8. 证据等级

- Hanzi Writer / Make Me a Hanzi 公开 GitHub 仓库 → 公开教学资源
- "教育部《汉语拼音字母表》手写体规范" → **该规范不存在**（教育部明确答复拼音字母笔顺无国家标准）
- Hanzi Writer 数据结构 → 公开教学资源（Hanzi Writer 文档可见）
- single-line font / Hershey font → 通用排版常识

---

*此文档由主人在 2026-09-24 转发调研后建立，等主人决策下一步方向。*
