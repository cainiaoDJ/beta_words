# 识字小游戏设计 SOP

当前项目定位是“幼小衔接识字游戏合集”。后续新增游戏时，优先保持一致的交互、视觉和技术形态，不要为了单个游戏引入复杂架构。

## 1. 技术准则

项目保持纯静态前端：

```text
index.html
styles.css
app.js
assets/
favicon.png
favicon.ico
```

新增游戏默认继续写在现有静态结构里，不引入：

```text
Node.js 运行依赖
npm 构建流程
后端接口
数据库
登录系统
复杂路由
```

除非后续出现明确需求，例如账号体系、长期学习记录、多人同步、后台配置字库，否则不要升级成复杂工程。

目标部署方式仍然是：

```text
Gitee 托管代码
nginx / 对象存储 / CDN 发布静态文件
浏览器直接访问
```

## 2. 大厅入口准则

所有游戏从同一个大厅进入。

每个游戏入口使用统一结构：

```html
<button class="game-entry" type="button">
  <span class="entry-title">游戏名称</span>
  <span class="entry-copy">一句话玩法提示</span>
</button>
```

入口文案要短，适合孩子和家长快速理解。

示例：

```text
识字消消乐
找一找相同的字

识字翻翻乐
记一记，再翻出来
```

后续新增游戏也应保持：

```text
游戏名：5-7 个字左右
说明：一句话，不解释规则细节
```

## 3. 难度准则

当前游戏共用难度：

```text
3 x 3：轻松开始
4 x 4：多认几个
5 x 5：挑战一下
6 x 6：越来越难
7 x 7：极限挑战
```

后续识字棋盘类游戏优先复用这套难度，除非玩法天然不适合方阵棋盘。

棋盘规则：

- 偶数格：全部成对。
- 奇数格：使用一张奖励星星牌补位。
- 奖励星星不参与普通配对。
- 普通目标数量只统计汉字牌，不统计奖励星星。

## 4. 棋盘视觉准则

所有棋盘类游戏优先复用：

```text
.board
.tile
.tile.selected
.tile.bonus
```

棋盘保持正方形，自适应屏幕：

```text
最大宽度 620px
aspect-ratio: 1
grid-template-columns: repeat(size, 1fr)
```

字牌要求：

- 汉字足够大。
- 点击目标足够大。
- 圆角不超过 8px。
- 棋盘不放进额外装饰卡片。
- 不使用复杂背景或干扰孩子注意力的装饰。
- 状态变化要清楚，但动画要短。

已有状态语义：

```text
selected：当前选中
matched：已完成
bonus：奖励星星
hidden-face：翻翻乐背面牌
memory-matched：翻翻乐已配对但保留显示
```

后续新增游戏如果需要特殊状态，应使用游戏专属 class，避免改变已有游戏行为。

## 5. HUD 状态区准则

游戏页统一使用当前 HUD 结构：

```text
左侧：进度
中间：计时
右侧：提示
```

设计原则：

- 计时器必须独立居中。
- 计时器固定宽度，不受提示文字长度影响。
- 计时器颜色醒目，字号明显大于提示。
- 提示语可以变化，但不能导致计时器偏移。
- 手机端计时器独占第一行，进度和提示放第二行。

计时器适合显示：

```text
00:00
00:05
```

提示语要短，避免长句：

```text
点一个字，听一听
再找一个“人”
找对了
再试一次
翻出两个一样的字
记住这些字：05
```

## 6. 语音准则

识字游戏都应尽量保留读音反馈。所有游戏应调用 `playVoice(key, fallbackText)`，不要在玩法代码里直接调用 `speak(text)`。

播放优先级：

```text
1. assets/audio/manifest.js 中注册的静态音频
2. 浏览器 SpeechSynthesis
3. 静默失败，不阻塞游戏
```

当前方式：

```text
静态音频优先，浏览器 SpeechSynthesis 兜底
lang = zh-CN
rate = 0.82
pitch = 1.08
```

音频 manifest 示例：

```js
window.BETA_WORDS_AUDIO = {
  "prompt.start": "assets/audio/prompts/start.mp3",
  "prompt.correct": "assets/audio/prompts/correct.mp3",
  "prompt.tryAgain": "assets/audio/prompts/try-again.mp3",
  "prompt.complete": "assets/audio/prompts/complete.mp3",
  "word.u4eba": "assets/audio/words/ren.mp3",
  "pinyin.ma1": "assets/audio/pinyin/ma1.mp3"
};
```

汉字音频 key 使用 Unicode 码点，避免拼音转换表不完整：

```text
人 -> word.u4eba
口 -> word.u53e3
手 -> word.u624b
```

拼音音频 key 使用数字表示声调：

```text
pinyin.ma1
pinyin.ma2
pinyin.ma3
pinyin.ma4
pinyin.ma0
```

使用准则：

- 点击汉字时读出该字。
- 游戏开始可以读“开始”或玩法提示。
- 完成时读“都找到了”。
- 奖励星星读“真棒”。
- 语音失败不影响游戏继续。

后续如果换成真人录音，应保持同样调用语义，不要让玩法依赖音频加载成功。

## 7. 计时与记录准则

计时逻辑按游戏规则决定开始点。

当前规则：

- 识字消消乐：第一次点击普通字牌时开始计时。
- 识字翻翻乐：记忆阶段结束，正式开始翻牌时开始计时。
- 看字识颜色：进入游戏时就开始计时（认知训练反应时是关注点）。

完成时：

- 停止计时。
- 显示本次用时。
- 如果刷新最佳成绩，显示“新纪录！”。
- 最佳成绩保存在 `localStorage`。
- 记录有效期为 365 天。

看字识颜色额外：

- 完成时显示「成功率 X / N（Y%）」取代「本次用时」。
- 「下一关」按钮隐藏（不同尺寸颜色 + 字顺序不同，跨尺寸连关意义不大）。
- 仍保留 best record（记录反应时最佳成绩）。

记录 key 必须按游戏隔离：

```text
beta_words_match_best_3
beta_words_match_best_4
beta_words_memory_best_3
beta_words_memory_best_4
beta_words_stroop_train_best_3
beta_words_stroop_train_best_7
```

后续新增游戏格式建议：

```text
beta_words_<game_id>_best_<size>
```

不要让不同游戏互相覆盖记录。

## 8. 游戏状态准则

每个游戏至少要有这些状态：

```text
game：当前游戏类型
phase：当前阶段
size：棋盘大小
tiles：字牌数据
selectedId：当前选中牌
locked：是否暂时锁定输入
matchedCount：已完成普通字牌数量
totalTargets：普通字牌总数
```

有倒计时、预览、动画等待的游戏，必须在离开游戏时清理：

```text
clearTimeout
clearInterval
stopTimer
selectedId = null
locked = false
```

避免返回大厅后计时器或倒计时继续跑。

## 9. 玩法准则

当前游戏的玩法基线：

识字消消乐：

```text
所有字牌明面显示
点击两个相同汉字
匹配成功后消失
不限制寻路
```

识字翻翻乐：

```text
开局展示全部汉字
固定时间记忆
记忆结束后字牌翻面
翻出两个相同汉字
匹配成功后保持显示，不消失
翻错后重新盖回
```

拼音找朋友：

```text
显示一个汉字
播放这个字的读音
从 2-4 个拼音选项里选择正确拼音
答对进入下一题
答错停留当前题
```

听音点卡：

```text
不显示汉字
播放目标读音
从 2-4 个拼音选项里选择听到的拼音
答对进入下一题
答错停留当前题
```

看字识颜色（Stroop 训练）：

```text
字库：6 个颜色字（红、黄、蓝、绿、紫、橙）作为 “字本身”
棋盘 n×n：每个格子随机选一字 + 随机选一个不一致的颜色（Stroop 错位）
待选 n×n：初始完全空，底层米字格背景作草稿纸
颜色条：一行 N 个色字按钮（3x3 = 3 色，5x5 = 5 色，6x6/7x7 = 6 色）
顺序：棋盘 (0,0) → (n-1,n-1) row-major 逐格处理（cursor 强锁）
交互：点棋盘 cursor 格 → 点颜色条某色 → 待选 cursor 格填色 + 判定
判定：一致（待选色 == 字实际颜色）→ 变绿 + TTS 读汉字读音（zh-CN）+ TTS 读英文读音（en-US，静默失败）
     不一致 → 变红 + 只提示「是×不是×」
重玩：判定后不可反悔；cursor 自动推进
完成：所有格判定后显示成功率（X / N + 百分比），隐藏 “下一关”
训练目标：认知控制 + 专注力 + 颜色识别，不是识字
```

后续新增玩法应遵守：

- 一局规则不超过 2-3 句话能讲清楚。
- 点击反馈即时明确。
- 错误不惩罚过重。
- 不加入复杂分数、生命值、道具系统。
- 完成目标清晰。
- 对幼小衔接孩子来说，玩法服务于识字，不喧宾夺主。

## 10. 文案准则

界面文案只写给孩子和家长看。

推荐风格：

```text
轻松开始
多认几个
挑战一下
点一个字，听一听
再试一次
找对了
都找到了
```

避免：

```text
系统提示
加载资源
组件状态
匹配算法
关卡配置
功能说明
```

不要在界面上解释技术或设计。

## 11. 样式准则

当前视觉方向：

- 明亮、低干扰。
- 背景浅色。
- 主色为绿色系，辅助色为黄色。
- 按钮、卡片、字牌圆角不超过 8px。
- 不使用大面积紫色、深蓝、棕色、米色主题。
- 不添加装饰性光球、渐变 blob、复杂背景。
- 不把主游戏区做成嵌入式预览卡片。

新增样式时优先复用现有变量：

```css
--bg
--panel
--ink
--muted
--line
--accent
--accent-strong
--sun
--good
--tile
--tile-selected
--tile-matched
--shadow
```

## 12. 可访问性准则

当前已有基础可访问性：

```text
button 使用真实 button
棋盘 role="grid"
字牌 role="gridcell"
aria-label 描述字牌
```

后续新增游戏应保持：

- 可点击元素使用 `button`。
- 图片有合适 `alt`。
- 状态文字清晰。
- 隐藏牌不要把真实字暴露在 `aria-label` 里，应显示“未翻开的字牌”。
- 游戏完成、提示变化保留在主区域内。

## 13. 新增游戏开发流程

后续新增一个游戏时，按这个顺序做：

1. 在 `GAMES` 中新增游戏配置：

   ```js
   id
   name
   title
   boardLabel
   startHint
   recordPrefix
   ```

2. 在大厅新增 `.game-entry` 入口。

3. 判断是否复用当前难度选择。

4. 判断使用棋盘视图还是答题视图：

   ```text
   棋盘类游戏使用 #board
   答题类游戏使用 #quiz
   ```

5. 在 `startGame(size)` 中加入该游戏的初始化分支。

6. 新增独立的点击处理函数：

   ```js
   handleNewGameTileClick(tileId)
   ```

7. 在 `handleTileClick(tileId)` 中按 `state.game` 分发。

8. 如需特殊牌面状态，新增游戏专属 CSS class。

9. 确保完成判定只统计普通汉字牌或答对题数。

10. 确保 `localStorage` 记录 key 按游戏隔离。

11. 更新 README 当前范围。

12. 验证：

    ```bash
    node --check current/app.js
    git diff --check
    python3 -m http.server 4173
    ```

13. 至少手测：

    ```text
    大厅入口
    难度选择
    3x3
    4x4
    7x7
    返回大厅
    再玩一次
    下一关
    语音按钮
    完成面板
    移动端布局
    ```

## 14. 什么时候才考虑重构

现在还不需要框架化。

可以继续维护单文件 JS，直到出现这些信号：

- 游戏数量超过 5 个。
- `app.js` 超过 1500 行且新增游戏明显困难。
- 多个游戏共享逻辑开始反复复制。
- 需要外部字库、关卡配置、音频资源管理。
- 需要自动化测试覆盖核心玩法。

到那时再考虑拆分为：

```text
games/match.js
games/memory.js
shared/board.js
shared/timer.js
shared/storage.js
```

但仍可保持纯静态，不必引入构建工具。
