# Mobile 一屏可见回归测试

playwright 自动化测试，所有游戏在多种手机 viewport 下都一屏内可见（docH ≤ vpH，无滚动）。

## 用法

```bash
# 1. 启动本地服务（可选）
python3 -m http.server 4173 &

# 2. 跑测试
node scripts/mobile-one-screen-test.js http://localhost:4173/
# 默认测试 http://192.168.31.60:8091/（内网部署版）
```

测试覆盖：
- 7 个手机 viewport（iPhone 13/SE/mini/8、Pixel 5、小屏、极小屏）
- 每个 viewport 跑 36 个测试点：lobby、5 个 setup、5 游戏 × 3 难度 × [gameplay + complete]
- 共 252 个断言

测试条件：`document.documentElement.scrollHeight ≤ window.innerHeight`
