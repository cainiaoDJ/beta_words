// =====================================================================
// trace-numbers.js — 田字格描红 · 数字池
// 数据源：人教版小学语文一年级上册「识字（一）」+「识字（二）」
//        + 教育部《汉语拼音字母表》数字字符
// 整理日期：2026-09-22
// 内容：一-十 10 个汉字 + 对应阿拉伯数字 + 笔顺指针
// 笔顺数据按需从 hanzi-writer-data CDN 加载（首字 + 预热后续 3 个）
// =====================================================================

window.TRACE_NUMBERS = window.TRACE_NUMBERS || (function () {
  const items = [
    { display: "一", pinyin: "yī", pool: "numbers", charKey: "一" },
    { display: "二", pinyin: "èr", pool: "numbers", charKey: "二" },
    { display: "三", pinyin: "sān", pool: "numbers", charKey: "三" },
    { display: "四", pinyin: "sì", pool: "numbers", charKey: "四" },
    { display: "五", pinyin: "wǔ", pool: "numbers", charKey: "五" },
    { display: "六", pinyin: "liù", pool: "numbers", charKey: "六" },
    { display: "七", pinyin: "qī", pool: "numbers", charKey: "七" },
    { display: "八", pinyin: "bā", pool: "numbers", charKey: "八" },
    { display: "九", pinyin: "jiǔ", pool: "numbers", charKey: "九" },
    { display: "十", pinyin: "shí", pool: "numbers", charKey: "十" }
  ];
  return {
    id: "numbers",
    name: "数字",
    subtitle: "一-十 / 人教版",
    hint: "描一描数字，写一写",
    items
  };
})();
