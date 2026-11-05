// 数据已撤下（无权威逐字来源 + 手写样本不一致），重建方案见 docs/phase-plans/phase-10-tracing-rebuild.md。
// 只保留原条目标识；letters 为空，所有 strokes/medians 为空，无可运行字形。
// 状态：BETA / withdrawn。不得把这些条目标识当作教材字形或笔顺验收。
window.TRACE_PINYIN = (function () {
  const letters = {};
  const items = [
    { display: "ā", pool: "pinyin", charKey: "a1", type: "pinyin", pinyin: "ā", strokes: [], medians: [] },
    { display: "á", pool: "pinyin", charKey: "a2", type: "pinyin", pinyin: "á", strokes: [], medians: [] },
    { display: "ǎ", pool: "pinyin", charKey: "a3", type: "pinyin", pinyin: "ǎ", strokes: [], medians: [] },
    { display: "à", pool: "pinyin", charKey: "a4", type: "pinyin", pinyin: "à", strokes: [], medians: [] },
    { display: "ō", pool: "pinyin", charKey: "o1", type: "pinyin", pinyin: "ō", strokes: [], medians: [] },
    { display: "ó", pool: "pinyin", charKey: "o2", type: "pinyin", pinyin: "ó", strokes: [], medians: [] },
    { display: "ǒ", pool: "pinyin", charKey: "o3", type: "pinyin", pinyin: "ǒ", strokes: [], medians: [] },
    { display: "ò", pool: "pinyin", charKey: "o4", type: "pinyin", pinyin: "ò", strokes: [], medians: [] },
    { display: "ē", pool: "pinyin", charKey: "e1", type: "pinyin", pinyin: "ē", strokes: [], medians: [] },
    { display: "é", pool: "pinyin", charKey: "e2", type: "pinyin", pinyin: "é", strokes: [], medians: [] },
    { display: "ě", pool: "pinyin", charKey: "e3", type: "pinyin", pinyin: "ě", strokes: [], medians: [] },
    { display: "è", pool: "pinyin", charKey: "e4", type: "pinyin", pinyin: "è", strokes: [], medians: [] },
    { display: "ī", pool: "pinyin", charKey: "i1", type: "pinyin", pinyin: "ī", strokes: [], medians: [] },
    { display: "í", pool: "pinyin", charKey: "i2", type: "pinyin", pinyin: "í", strokes: [], medians: [] },
    { display: "ǐ", pool: "pinyin", charKey: "i3", type: "pinyin", pinyin: "ǐ", strokes: [], medians: [] },
    { display: "ì", pool: "pinyin", charKey: "i4", type: "pinyin", pinyin: "ì", strokes: [], medians: [] },
    { display: "ū", pool: "pinyin", charKey: "u1", type: "pinyin", pinyin: "ū", strokes: [], medians: [] },
    { display: "ú", pool: "pinyin", charKey: "u2", type: "pinyin", pinyin: "ú", strokes: [], medians: [] },
    { display: "ǔ", pool: "pinyin", charKey: "u3", type: "pinyin", pinyin: "ǔ", strokes: [], medians: [] },
    { display: "ù", pool: "pinyin", charKey: "u4", type: "pinyin", pinyin: "ù", strokes: [], medians: [] },
    { display: "ǖ", pool: "pinyin", charKey: "ü1", type: "pinyin", pinyin: "ǖ", strokes: [], medians: [] },
    { display: "ǘ", pool: "pinyin", charKey: "ü2", type: "pinyin", pinyin: "ǘ", strokes: [], medians: [] },
    { display: "ǚ", pool: "pinyin", charKey: "ü3", type: "pinyin", pinyin: "ǚ", strokes: [], medians: [] },
    { display: "ǜ", pool: "pinyin", charKey: "ü4", type: "pinyin", pinyin: "ǜ", strokes: [], medians: [] },
  ];
  function getStrokeSpec(charKey) {
    if (!items.some(item => item.charKey === charKey)) return null;
    return { strokes: [], medians: [], source: "BETA: withdrawn" };
  }
  return {
    id: "pinyin",
    name: "拼音",
    items,
    letters,
    getStrokeSpec
  };
})();
