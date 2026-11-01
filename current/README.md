# 幼小衔接识字游戏

## 当前范围

- 大厅模式：当前开放“识字消消乐”、“识字翻翻乐”、“拼音找朋友”、“听音点卡”、“看字识颜色”、“看图比大小”、“成语填空”和“田字格描红”。
- 难度：支持 3x3、4x4、5x5、6x6、7x7。
- 识字消消乐：点击两个相同汉字即可消除，不限制寻路。
- 识字翻翻乐：先给固定时间记忆字牌，再翻出两个相同汉字；配对成功后字牌保持显示。
- 拼音找朋友：看汉字、听读音，从选项里选出对应拼音。
- 听音点卡：只听读音，从选项里点出对应拼音。
- 看字识颜色：Stroop 认知训练。棋盘 n×n 是颜色字（红黄蓝绿紫橙），字色 ≠ 字义；下方有 n×n 待选区（米字格背景、初始全空）和一行可点击的颜色条。按棋盘 (0,0) → (n-1,n-1) 顺序，玩家点颜色条选色，填入待选对应格：一致变绿 + 读汉字读音 + 读英文读音；不一致变红。完成后显示成功率。
- 田字格描红：每页一个大米字格，格内灰色显示示范字；先播笔顺动画（蓝色笔顺 + 起点序号），再让玩家用手指/鼠标沿灰色字描写，笔迹为红色。难度按练习包切换：数字（一-十）/ 拼音（人教版，含整体认读音节）/ 汉字（人教版一年级上册会写字）。每关 1 个字，工具栏提供「清除笔迹」与「下一字」；不用语音朗读。字库数据在 `assets/data/trace-{numbers,pinyin,hanzi}.js`，汉字笔顺来自 `hanzi-writer-data`。
- 读音：点击汉字时用浏览器中文语音实时生成读音；看字识颜色会额外读英文色名（en-US）；田字格描红不发声。
- 视觉：极简布局、清晰按钮、低干扰颜色、简单过渡动画。

## 技术形态

这是一个纯静态前端游戏，不依赖 Node.js、npm、构建工具、后端接口或数据库。

部署时只需要发布本目录里的静态文件：

```text
index.html
styles.css
app.js
assets/
assets/audio/
favicon.png
favicon.ico
```

可以直接放到 nginx、对象存储静态网站、CDN 源站或任意静态托管服务中。

新增游戏的设计和开发准则记录在 `GAME_SOP.md`。

## 音频替换

游戏默认使用浏览器中文语音朗读。若需要替换为预生成音频，在 `assets/audio/manifest.js` 中注册音频 key：

```js
window.BETA_WORDS_AUDIO = {
  "prompt.start": "assets/audio/prompts/start.mp3",
  "prompt.bonus": "assets/audio/prompts/bonus.mp3",
  "prompt.complete": "assets/audio/prompts/complete.mp3",
  "word.u4eba": "assets/audio/words/ren.mp3"
};
```

播放时会优先使用 manifest 中的音频文件，缺失或播放失败时自动回退到浏览器语音。

当前提示音 key：

```text
prompt.start
prompt.bonus
prompt.correct
prompt.tryAgain
prompt.remember
prompt.flip
prompt.complete
```

汉字音频 key 使用 Unicode 码点，例如：

```text
人 -> word.u4eba
口 -> word.u53e3
手 -> word.u624b
```

## 运行

直接打开 `index.html`，或启动静态服务：

```bash
python3 -m http.server 4173
```

然后访问 `http://127.0.0.1:4173/`。

## 部署建议

推荐把代码托管在 Gitee，然后用国内云厂商的静态网站或 CDN 发布，例如：

- 阿里云 OSS 静态网站 + CDN
- 腾讯云 COS 静态网站 + CDN
- 已有服务器上的 nginx 静态目录

Gitee Pages 曾经适合这种项目，但 Gitee 官方帮助中心当前将 `Gitee Pages` 标记为“功能已下线”。如果你的账号仍能看到 Pages 入口，可以尝试直接发布本目录；否则不建议把它作为主要方案。

如果使用普通静态托管，站点根目录应能直接访问到 `index.html`。如果托管平台只支持仓库根目录发布，可以把本目录内容放到仓库根目录，或使用单独的发布分支。

## 当前内网部署记录

- **开发路径**：`/home/alpha/codex/beta_words/`（git 仓库，origin = sophie520:22000/Alpha/beta_words.git）
- **正式部署路径**：`/home/alpha/apps/beta_words/current`（仅部署用，不再本地开发）
- **正式访问地址**：`http://192.168.31.60:8091/`（本机服务，x86 Debian）
- **公网同步地址**：`https://sophie520.top/games/`（走 tar+ssh 流式同步）
- systemd 用户服务：`beta-words.service`

这不是游戏必须依赖的架构，只是当前服务器的部署方式。部署细节记录在 `DEPLOYMENT.md`。

## 后续扩展

- 将浏览器实时语音替换为固定音频文件或真人录音。
- 在大厅加入更多识字游戏。
- 增加学习记录、错字复习和分级字库。
