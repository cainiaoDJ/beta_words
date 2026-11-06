# 部署记录

## 项目形态

本项目是纯静态前端游戏。运行时只需要浏览器加载以下静态文件，不需要 Node.js、npm、构建步骤、后端接口或数据库：

```text
index.html
styles.css
app.js
assets/
favicon.png
favicon.ico
```

因此可以部署到 nginx、对象存储静态网站、CDN 源站或静态托管平台。

## 推荐发布方式

### 国内访问优先

首选方案：

- Gitee 只作为 Git 代码仓库。
- 静态文件发布到国内云厂商对象存储静态网站，并接入 CDN。
- 可选平台：阿里云 OSS + CDN、腾讯云 COS + CDN，或已有服务器 nginx。

原因：

- 国内访问稳定性和速度更可控。
- 不需要长期运行应用服务。
- 后续加图片、音频资源时，CDN 缓存更合适。

### Gitee Pages

Gitee Pages 曾经适合本项目这类原始 HTML 静态站点，但 Gitee 官方帮助中心当前将 `Gitee Pages` 和 `Gitee Pages Pro` 标记为“功能已下线”。

官方帮助页：

- https://gitee.com/help/categories/56
- https://gitee.com/help/articles/4136
- https://gitee.com/help/articles/4228

如果账号仍然能看到 Pages 入口，可以尝试：

1. 创建 Gitee 仓库。
2. 将本目录内容放到仓库根目录，确保根目录存在 `index.html`。
3. 在 Pages 服务里选择发布默认分支。

如果账号没有 Pages 入口，建议改用“Gitee 托管代码 + OSS/COS/CDN 发布静态文件”。

## 当前内网部署

- 本地代码路径：`/home/alpha/codex/beta_words`
- 服务器：`alpha@192.168.31.155`
- 正式部署路径：`/home/alpha/apps/beta_words/current`
- 访问地址：`http://192.168.31.155:8091/`

## SSH

- 本地部署私钥：`/home/alpha/.ssh/beta_words_deploy`
- 本地部署公钥：`/home/alpha/.ssh/beta_words_deploy.pub`
- 服务器用户：`alpha`

连接示例：

```bash
ssh -i ~/.ssh/beta_words_deploy alpha@192.168.31.155
```

## 当前内网服务

- 服务类型：systemd user service
- 服务文件：`/home/alpha/.config/systemd/user/beta-words.service`
- 服务名：`beta-words.service`
- 监听端口：`8091`
- 说明：`8080` 已被 `qbittorrent-nox` 占用，因此本项目固定使用 `8091`。

常用命令：

```bash
systemctl --user status beta-words.service
systemctl --user restart beta-words.service
systemctl --user stop beta-words.service
journalctl --user -u beta-words.service -n 100 --no-pager
```

## 当前内网更新部署

在本地项目目录执行：

```bash
tar --exclude='./beta-words.service' -czf - index.html styles.css app.js README.md DEPLOYMENT.md assets \
  | ssh -i ~/.ssh/beta_words_deploy alpha@192.168.31.155 'tar -xzf - -C ~/apps/beta_words/current'

scp -i ~/.ssh/beta_words_deploy beta-words.service \
  alpha@192.168.31.155:~/.config/systemd/user/beta-words.service

ssh -i ~/.ssh/beta_words_deploy alpha@192.168.31.155 \
  'systemctl --user daemon-reload && systemctl --user restart beta-words.service'
```

部署后验证：

```bash
curl --noproxy '*' -I http://192.168.31.155:8091/
```

期望返回 `200 OK`。

## 开机保持

服务器已按正式路径部署。若未来发现重启后服务没有自动启动，在服务器上执行：

```bash
sudo loginctl enable-linger alpha
```

验证：

```bash
loginctl show-user alpha -p Linger
```

期望返回 `Linger=yes`。

## 公网部署（sophie520 / nginx）

生产路径：`/var/www/games/current/`
nginx：`location ^~ /games/ { alias /var/www/games/current/; }`
→ `/games/` 与 `/games/current/`（历史嵌套残留）**都会解析到该站点，部署必须同时更新两处**，
否则同一站点会对外提供两个版本。

### 2026-11-06 — 描红 SVG 方案回退上线

- 提交：`fbb908a`（merge `feat/trace-rebuild`），线上内容 == `main:current/`
- 变更：撤下田字格描红入口与全部运行路径（笔顺镜像、字线错位的老实现）；
  数字数据换为逐页核对教材的版本；拼音手写字形撤下；保留 73 字 hanzi-cache 骨架资产
- 备份（回滚用，路径原样勿手打）：
  - 外层：`/var/www/games/current.bak.trace-rollback-66adfd8-20261106-071602`
  - 嵌套：`/var/www/games/current.bak.trace-rollback-66adfd8-nested-20261106-071602`
- 回滚命令：

```bash
ssh -T sophie520 "cp -a '/var/www/games/current.bak.trace-rollback-66adfd8-20261106-071602' /var/www/games/current"
ssh -T sophie520 "cp -a '/var/www/games/current.bak.trace-rollback-66adfd8-nested-20261106-071602' /var/www/games/current/current"
```

- 验收：两个路径 md5 均 == `main:current/`（110/110 文件一致）；
  浏览器冒烟 8 个入口、描红入口与 DOM 全不存在、console error 0、pageerror 0
- 描红重建方案：`docs/phase-plans/phase-10-tracing-rebuild.md`（重建完成并通过移动端回归后再开放入口）

### 2026-11-06 — 描红游戏恢复上线（撤销误删 + 移除 SVG 笔顺层）

- 提交：`d69305a`（merge `feat/trace-restore`），线上内容 == `main:current/`（110/110 文件 md5 一致）
- 背景：2026-11-06 上午那次「回退描红」把**整个描红游戏**误删（app.js 700 行 / CSS 278 行 /
  大厅入口），主人明确只要求回退 SVG 笔顺那一层。本轮把游戏恢复，笔顺层照旧撤下。
- 变更：
  - 恢复大厅第 9 个入口、米字格 canvas、灰色范字、红色笔迹、待选字列表、
    清除/下一字、进度与完成流程
  - 移除 `#trace-order-svg`、`renderTraceOrderSvg()`、`playStrokeGuide()`、起点圆点与序号、
    以及只服务于引导层的汉字 CDN 依赖（线上 jsdelivr 引用 = 0）
  - 灰字改由数据 path 渲染（数字描边 / 汉字填充），`fillText` 清零，不再用系统字体
  - 拼音池无字形数据，选关页隐藏 size 4
- 备份（回滚用，路径原样勿手打）：
  - 外层：`/var/www/games/current.bak.trace-restore-448-20261106-125406`
  - 嵌套：`/var/www/games/current.bak.trace-restore-448-nested-20261106-125406`
- 回滚命令：

```bash
ssh -T sophie520 "cp -a '/var/www/games/current.bak.trace-restore-448-20261106-125406' /var/www/games/current"
ssh -T sophie520 "cp -a '/var/www/games/current.bak.trace-restore-448-nested-20261106-125406' /var/www/games/current/current"
```

- 验收：110/110 文件 md5 == `main:current/`；移动端回归 Total: 448, Failed: 0；
  公网浏览器实测 9 入口 / 两池可玩 / 汉字字心偏差 0.5px / 笔迹落点偏差 0.5px /
  console error 0 / pageerror 0 / CDN 请求 0

### 2026-11-06 — 笔顺动画引导重做上线（自动播）

- 变更：只重做「笔顺引导」这一层，灰字/格子/红笔迹/工具栏/进度一律不动
  - 引导线与灰字**共用同一个 canvas 与同一个 ctx transform**（scale → translate → scale），
    从机制上排除旧 SVG 方案「两套坐标系各自 auto-fit」造成的镜像与错位
  - 汉字走 `medians`（中轴）Catmull-Rom 平滑后展平；数字走 `strokes`（教材点线字形）弧长采样
  - 进场与换字**自动播**一遍：逐笔按弧长生长，笔间停顿 90ms；单笔 280~560ms，
    最长字「旗」14 笔约 5.3s；演示期间 `.trace-stage.is-locked` 锁画布并提示「先看一遍笔顺，等一下再描」
  - 演示结束后引导线与序号常驻，作为描红底稿；工具栏新增「重看笔顺」（重播不清空笔迹）
  - 序号圆心严格等于 `medians[i][0]` 经同一 transform 的映射，序号正立；
    起笔点完全重合时（数字 4 / 8）合并为一个圆点、标签为 `1·2`，圆心仍是该起点
  - 四色循环 `#3E88B5` / `#8863A2` / `#28816A` / `#A9761B`，**刻意避开橙红**：
    孩子笔迹是 `#d86d4c`，橙褐引导线会和自己的笔迹糊在一起
- 数据文件零改动：`trace-numbers.js` / `trace-hanzi.js` / `hanzi-cache/` 字节不变
- 验收：
  - `scripts/mobile-one-screen-test.js` → **Total: 448, Failed: 0**
  - `scripts/trace-restore-test.js` → exit 0；汉字字心误差 4.6e-05px、
    数字额外偏移 1.9e-04px、最小留白 16.6px、console/pageerror/CDN 请求均 0
  - 浏览器逐字复核：数字 1–10 无镜像；数字 8 序号合并为 `1·2`；汉字「子」三色引导线贴合灰字
- 回滚：见本文件上一条（回退轮）的备份路径；回滚到恢复版即 `current.bak.trace-restore-448-*`
