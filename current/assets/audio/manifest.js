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

// === Design System v2 多邻国式语音变体（feat/design-system-v2 Phase C，2026-07-31） ===
// 7 个 base prompt key × 3-6 个变体, 共 29 个 manifest key。
// app.js 的 playVoiceVariant() 每次调用随机选一个变体。
// 当前空字符串: 播放时按 SOP 第 6 条走 SpeechSynthesis fallback, 朗读 fallbackText。
// 0 影响 (无音频但有真实语音兜底). Phase D 可逐个填真实音频 key.
window.BETA_WORDS_AUDIO["prompt.start.1"] = "";
window.BETA_WORDS_AUDIO["prompt.start.2"] = "";
window.BETA_WORDS_AUDIO["prompt.start.3"] = "";
window.BETA_WORDS_AUDIO["prompt.start.4"] = "";

window.BETA_WORDS_AUDIO["prompt.bonus.1"] = "";
window.BETA_WORDS_AUDIO["prompt.bonus.2"] = "";
window.BETA_WORDS_AUDIO["prompt.bonus.3"] = "";

window.BETA_WORDS_AUDIO["prompt.correct.1"] = "";
window.BETA_WORDS_AUDIO["prompt.correct.2"] = "";
window.BETA_WORDS_AUDIO["prompt.correct.3"] = "";
window.BETA_WORDS_AUDIO["prompt.correct.4"] = "";
window.BETA_WORDS_AUDIO["prompt.correct.5"] = "";
window.BETA_WORDS_AUDIO["prompt.correct.6"] = "";

window.BETA_WORDS_AUDIO["prompt.tryAgain.1"] = "";
window.BETA_WORDS_AUDIO["prompt.tryAgain.2"] = "";
window.BETA_WORDS_AUDIO["prompt.tryAgain.3"] = "";
window.BETA_WORDS_AUDIO["prompt.tryAgain.4"] = "";

window.BETA_WORDS_AUDIO["prompt.complete.1"] = "";
window.BETA_WORDS_AUDIO["prompt.complete.2"] = "";
window.BETA_WORDS_AUDIO["prompt.complete.3"] = "";
window.BETA_WORDS_AUDIO["prompt.complete.4"] = "";
window.BETA_WORDS_AUDIO["prompt.complete.5"] = "";
window.BETA_WORDS_AUDIO["prompt.complete.6"] = "";

window.BETA_WORDS_AUDIO["prompt.remember.1"] = "";
window.BETA_WORDS_AUDIO["prompt.remember.2"] = "";
window.BETA_WORDS_AUDIO["prompt.remember.3"] = "";
window.BETA_WORDS_AUDIO["prompt.remember.4"] = "";

window.BETA_WORDS_AUDIO["prompt.flip.1"] = "";
window.BETA_WORDS_AUDIO["prompt.flip.2"] = "";
window.BETA_WORDS_AUDIO["prompt.flip.3"] = "";
