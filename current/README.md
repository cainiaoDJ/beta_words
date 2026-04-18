# 幼小衔接识字游戏

## 当前范围

- 大厅模式：当前开放“识字消消乐”和“识字翻翻乐”。
- 难度：支持 3x3、4x4、5x5、6x6、7x7。
- 识字消消乐：点击两个相同汉字即可消除，不限制寻路。
- 识字翻翻乐：先给固定时间记忆字牌，再翻出两个相同汉字；配对成功后字牌保持显示。
- 读音：点击汉字时用浏览器中文语音实时生成读音。
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

- 正式部署路径：`alpha@192.168.31.155:/home/alpha/apps/beta_words/current`
- 正式访问地址：`http://192.168.31.155:8091/`
- systemd 用户服务：`beta-words.service`

这只是当前内网服务器的运行方式，不是游戏本身必须依赖的架构。部署细节记录在 `DEPLOYMENT.md`。

## 后续扩展

- 将浏览器实时语音替换为固定音频文件或真人录音。
- 在大厅加入更多识字游戏。
- 增加学习记录、错字复习和分级字库。
