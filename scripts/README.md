# Mobile 一屏可见回归测试

playwright 自动化测试，所有游戏在多种手机 viewport 下都一屏内可见（docH ≤ vpH，无滚动）。

## 用法

```bash
# 1. 启动本地服务（可选）
python3 -m http.server 4174 --directory current &

# 2. 跑测试
BASE_URL=http://127.0.0.1:4174/ node scripts/mobile-one-screen-test.js
# 不传 BASE_URL 默认 http://127.0.0.1:4174/
```

测试覆盖（trace-tian 重建期间）：
- 7 个手机 viewport（iPhone 13/SE/mini/8、Pixel 5、小屏、极小屏）
- 每个 viewport 跑 52 个测试点：lobby、7 个 setup、6 个三难度游戏 + 1 个四难度游戏，均覆盖 gameplay + complete
- 共 364 个断言

田字格描红恢复正式入口时，须同步将 `open-trace-tian`、其难度及 Zone 预期加回
`mobile-one-screen-test.js`，并更新本说明中的数量。

测试条件：`document.documentElement.scrollHeight ≤ window.innerHeight`
