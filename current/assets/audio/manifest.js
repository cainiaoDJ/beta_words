window.BETA_WORDS_AUDIO = window.BETA_WORDS_AUDIO || {};

// === Design System v2 音效 manifest（feat/design-system-v2 Phase A，2026-07-31） ===
// 占位。Phase D 录制真实音频后填入路径。
// 当前空字符串：播放时按 SOP 第 6 条走 SpeechSynthesis fallback 或静默失败，0 影响。
// 4 个 key：
//   sfx.tap-pop          — 触控反馈短音（轻"咔"）
//   sfx.correct-ding     — 答对庆祝音（清脆上扬）
//   sfx.wrong-buzz       — 答错安慰音（柔和下降）
//   sfx.complete-fanfare — 完成欢庆音（多邻国式 fanfare）
window.BETA_WORDS_AUDIO["sfx.tap-pop"] = "";
window.BETA_WORDS_AUDIO["sfx.correct-ding"] = "";
window.BETA_WORDS_AUDIO["sfx.wrong-buzz"] = "";
window.BETA_WORDS_AUDIO["sfx.complete-fanfare"] = "";
