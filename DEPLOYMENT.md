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
