# Mobile 一屏可见回归测试

Playwright 自动化测试，验证所有游戏在多种手机 viewport 下画布完整可见，内部不溢出，游戏 zone 数量正确。

## 用法

```bash
# 1. 在仓库根目录启动本地 current/ 服务（已有服务时复用）
python3 -m http.server 4174 --directory current &

# 2. 跑测试
BASE_URL=http://127.0.0.1:4174/ node scripts/mobile-one-screen-test.js
# 默认也是 http://127.0.0.1:4174/；远端测试须显式设置 BASE_URL。
```

测试覆盖：
- 7 个手机 viewport（iPhone 13/SE/mini/8、Pixel 5、小屏、极小屏）
- 每个 viewport 跑 64 个状态：lobby、9 个 setup、27 组游戏难度 × [gameplay + complete]
- 共 448 个状态检查；描红恢复后只开放数字（size 3）/汉字（size 5），拼音隐藏，因此比三池版本 462 少 14 个状态。断言强度不变。

测试条件：`.stage-canvas` 完全位于 viewport 内，`.screen.active.scrollHeight ≤ 640` 设计 px，并校验可见 zone 数量、主 zone 尺寸与画布边界。`Failed = 0` 才通过。

描红专项验收：

```bash
BASE_URL=http://127.0.0.1:4174/ node scripts/trace-restore-test.js
```

覆盖两池各 10 字描写/切字/完成/重玩、清除与 resize、全部 10 个数字和 73 个汉字的独立源数据/实际绘图矩阵/浏览器边界测量，以及桌面、横屏、iPad 的 9 游戏检查。汉字字心偏差须 ≤2px；数字保持源偏移，格线与统一尺度另行校验。像素只验证灰字/红迹存在且无蓝线，不用于估计几何。截图与详细测量保存到 `/tmp/trace_restore_shots/`。
