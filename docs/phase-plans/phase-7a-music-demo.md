# Phase 0 — 音乐 demo 选型（详细规划）

> 📁 父文档：[`../PLAN-2026-08-deep-optimization.md`](../PLAN-2026-08-deep-optimization.md) §Phase 0
>
> 状态：🔵 planning（待主人启动 music_generate）

---

## 🎯 目标

用 `music_generate` 工具出 6 首 30s BGM demo（5 游戏 + lobby），主人试听后挑选 / 重做，再集成进 Phase 6。

---

## 📋 需求点

### R-0.1 跑出 6 首 demo

每首对应一个游戏 / 场景，按总纲 brief：

| ID | 文件名 | Brief | BPM |
|---|---|---|---|
| M-L | `lobby.mp3` | ukulele + 风铃 + 轻拍手，"欢迎来到识字小屋" | 85 |
| M-Match | `match.mp3` | 木琴 + xylophone + 拍手，"找朋友"轻快感 | 90 |
| M-Memory | `memory.mp3` | music box + 柔和 pad，"记忆宫殿"神秘但友好 | 70 |
| M-Pinyin | `pinyinFriend.mp3` | 长笛 + 钢琴，"学本领"专注但不沉闷 | 75 |
| M-Listen | `listenCard.mp3` | 吉他拨弦 + 铃声，"听故事"放松 | 80 |
| M-Stroop | `stroopTrain.mp3` | marimba + 风铃 + 彩色木琴，"色彩派对"活泼 | 100 |

**验收标准**
- 6 个 MP3 文件生成成功，单首 ≤ 500KB，长度 25-35s
- instrumental 优先（避免歌词抢 TTS）；如有歌词需主人确认是否重做
- 存到 `current/assets/music/{id}.mp3`

**自测步骤**
```bash
ls -la /home/alpha/codex/beta_words/current/assets/music/
# 应有 6 个 MP3，每个 ≤ 500KB
ffprobe /home/alpha/codex/beta_words/current/assets/music/lobby.mp3 2>&1 | grep Duration
# 时长 25-35s
```

### R-0.2 主人试听挑选

**验收标准**
- 主人在 webchat 或飞书听过 6 首 demo
- 主人书面回复哪些 OK / 哪些要重做 / brief 是否要调整
- 全部 OK 才算 R-0.2 通过（部分 OK → 进 R-0.3 重做）

### R-0.3 不满意的 demo 重做（最多 2 轮）

每首 demo 主人可要求重做，最多 2 轮。如果 2 轮后仍不满意，转【c：不做这首，由主人自选第三方音乐】

**验收标准**
- 重做后主人回复 OK
- 或主人确认改用第三方 / 不做

### R-0.4 入库归档

6 首 demo 全部确认后：

- 移动到 `current/assets/music/{id}.mp3` 最终位置（如不在）
- 更新 `current/DEPLOYMENT.md` 资源清单（如有需要）
- 写 commit `asset(music): Phase 0 — 6 首 BGM demo 经主人确认入库`

**自测步骤**
```bash
cd /home/alpha/codex/beta_words
git status  # 确认 6 个 MP3 已 tracked
git add current/assets/music/
git commit -m "asset(music): Phase 0 — 6 首 BGM demo 经主人确认入库"
```

---

## 🔧 实施步骤

### Step 1：跑 music_generate 出 6 首 demo

使用 `music_generate` 工具，每首单独跑（避免相互影响）：

```python
# 伪代码示例
music_generate(
    prompt="<brief>",
    instrumental=True,
    durationSeconds=30,
    filename="lobby.mp3"
)
```

**注意**
- 主人决策点：要不要先跑 1-2 首 demo 试风格再批量？
- 默认建议：先跑 lobby + stroopTrain（风格差异最大），主人确认 brief 合适再批量出剩下 4 首

### Step 2：上传到主人试听渠道

6 首 MP3 通过以下方式给主人试听（按平台友好度）：

| 方式 | 适合 |
|---|---|
| **MEDIA 附件直接放 webchat / 飞书** | 主人有在线环境，文件 ≤ 5MB |
| **HTML demo 页** | 主人想听 loop 接缝，把 6 首放单页用 `<audio>` 排好 |
| **base64 内联到 markdown 链接** | 单首 demo 验证风格用 |

**默认**：6 首各跑一遍 `music_generate`，每首通过 `MEDIA:` 附件发到当前对话让主人试听。

### Step 3：等主人反馈

主人在当前对话回复：
- 「全部 OK」 → 进 R-0.4 入库
- 「第 N 首不行，新 brief：...」 → R-0.3 重做
- 「都换第三方 / 不做 BGM」 → Phase 0 关闭，跳过 Phase 6

---

## ⚠️ 风险

| 风险 | 兜底 |
|---|---|
| music_generate 拒做某种风格（如歌谣 vs 纯音乐） | 调整 prompt 重做，最多 2 轮 |
| 生成的音乐时长不可控（要 30s 但给 20s） | 接受 25-35s 范围；超 35s 用 ffmpeg 截断 |
| instrumental 模式偶尔带背景人声 | 重做；或主人确认接受后保留 |
| BGM 风格与游戏主题色冲突（音乐太"成人"） | 重做 prompt 加 "for 4-6 years old kids" |

---

## 🚦 验收 Checklist

Phase 0 完成时：

- [ ] R-0.1 6 首 demo MP3 已生成并放 `current/assets/music/`
- [ ] R-0.2 主人书面回复确认 OK（或部分要改）
- [ ] R-0.3 重做轮次 ≤ 2，主人最终确认
- [ ] R-0.4 commit 已入 git 历史
- [ ] 主人确认可以进入 Phase 6 集成

完成后此文档标题状态改为 `✅ completed`，并附实际生成耗时 / 重做轮次 / 主人反馈摘要。