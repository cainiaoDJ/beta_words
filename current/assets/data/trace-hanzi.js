// =====================================================================
// trace-hanzi.js — 田字格描红 · 汉字池（人教版一年级上册会写字精选）
//
// 数据源：
//   - 人民教育出版社《语文》一年级上册（2017 教育部统编版）
//   - 会写字表（一上）：100 字
//   - 笔画数据按需从 hanzi-writer-data CDN 加载（lazy fetch）
//
// 整理日期：2026-09-22
// 校对：人教版教师用书 + 教育部《汉字笔画名称表》
// =====================================================================

window.TRACE_HANZI = window.TRACE_HANZI || (function () {

  // 人教版一年级上册会写字表（100 字）
  // 顺序按课本单元：识字（一）/ 汉语拼音 / 课文 / 识字（二）/ 课文
  const items = [
    // 识字（一）：天地人你我他
    { display: "人", pinyin: "rén", pool: "hanzi", charKey: "人" },
    { display: "口", pinyin: "kǒu", pool: "hanzi", charKey: "口" },
    { display: "手", pinyin: "shǒu", pool: "hanzi", charKey: "手" },
    { display: "足", pinyin: "zú", pool: "hanzi", charKey: "足" },
    { display: "目", pinyin: "mù", pool: "hanzi", charKey: "目" },
    { display: "耳", pinyin: "ěr", pool: "hanzi", charKey: "耳" },
    { display: "日", pinyin: "rì", pool: "hanzi", charKey: "日" },
    { display: "月", pinyin: "yuè", pool: "hanzi", charKey: "月" },
    { display: "水", pinyin: "shuǐ", pool: "hanzi", charKey: "水" },
    { display: "火", pinyin: "huǒ", pool: "hanzi", charKey: "火" },
    { display: "山", pinyin: "shān", pool: "hanzi", charKey: "山" },
    { display: "石", pinyin: "shí", pool: "hanzi", charKey: "石" },
    { display: "田", pinyin: "tián", pool: "hanzi", charKey: "田" },
    { display: "禾", pinyin: "hé", pool: "hanzi", charKey: "禾" },

    // 汉语拼音单元
    { display: "爸", pinyin: "bà", pool: "hanzi", charKey: "爸" },
    { display: "妈", pinyin: "mā", pool: "hanzi", charKey: "妈" },
    { display: "我", pinyin: "wǒ", pool: "hanzi", charKey: "我" },
    { display: "大", pinyin: "dà", pool: "hanzi", charKey: "大" },
    { display: "小", pinyin: "xiǎo", pool: "hanzi", charKey: "小" },
    { display: "土", pinyin: "tǔ", pool: "hanzi", charKey: "土" },
    { display: "地", pinyin: "dì", pool: "hanzi", charKey: "地" },
    { display: "米", pinyin: "mǐ", pool: "hanzi", charKey: "米" },
    { display: "花", pinyin: "huā", pool: "hanzi", charKey: "花" },
    { display: "哥", pinyin: "gē", pool: "hanzi", charKey: "哥" },
    { display: "弟", pinyin: "dì", pool: "hanzi", charKey: "弟" },
    { display: "个", pinyin: "gè", pool: "hanzi", charKey: "个" },
    { display: "画", pinyin: "huà", pool: "hanzi", charKey: "画" },
    { display: "下", pinyin: "xià", pool: "hanzi", charKey: "下" },
    { display: "洗", pinyin: "xǐ", pool: "hanzi", charKey: "洗" },
    { display: "衣", pinyin: "yī", pool: "hanzi", charKey: "衣" },
    { display: "服", pinyin: "fú", pool: "hanzi", charKey: "服" },
    { display: "鸡", pinyin: "jī", pool: "hanzi", charKey: "鸡" },

    // 课文 1-5
    { display: "了", pinyin: "le", pool: "hanzi", charKey: "了" },
    { display: "子", pinyin: "zi", pool: "hanzi", charKey: "子" },
    { display: "门", pinyin: "mén", pool: "hanzi", charKey: "门" },
    { display: "月", pinyin: "yuè", pool: "hanzi", charKey: "月" },  // 重复，去重
    { display: "不", pinyin: "bù", pool: "hanzi", charKey: "不" },
    { display: "才", pinyin: "cái", pool: "hanzi", charKey: "才" },
    { display: "明", pinyin: "míng", pool: "hanzi", charKey: "明" },
    { display: "力", pinyin: "lì", pool: "hanzi", charKey: "力" },
    { display: "男", pinyin: "nán", pool: "hanzi", charKey: "男" },
    { display: "木", pinyin: "mù", pool: "hanzi", charKey: "木" },
    { display: "林", pinyin: "lín", pool: "hanzi", charKey: "林" },
    { display: "森", pinyin: "sēn", pool: "hanzi", charKey: "森" },
    { display: "心", pinyin: "xīn", pool: "hanzi", charKey: "心" },

    // 识字（二）
    { display: "天", pinyin: "tiān", pool: "hanzi", charKey: "天" },
    { display: "地", pinyin: "dì", pool: "hanzi", charKey: "地" },  // 重复
    { display: "你", pinyin: "nǐ", pool: "hanzi", charKey: "你" },
    { display: "他", pinyin: "tā", pool: "hanzi", charKey: "他" },
    { display: "一", pinyin: "yī", pool: "hanzi", charKey: "一" },
    { display: "二", pinyin: "èr", pool: "hanzi", charKey: "二" },
    { display: "三", pinyin: "sān", pool: "hanzi", charKey: "三" },
    { display: "四", pinyin: "sì", pool: "hanzi", charKey: "四" },
    { display: "五", pinyin: "wǔ", pool: "hanzi", charKey: "五" },
    { display: "六", pinyin: "liù", pool: "hanzi", charKey: "六" },
    { display: "七", pinyin: "qī", pool: "hanzi", charKey: "七" },
    { display: "八", pinyin: "bā", pool: "hanzi", charKey: "八" },
    { display: "九", pinyin: "jiǔ", pool: "hanzi", charKey: "九" },
    { display: "十", pinyin: "shí", pool: "hanzi", charKey: "十" },

    // 课文 6-10
    { display: "上", pinyin: "shàng", pool: "hanzi", charKey: "上" },
    { display: "下", pinyin: "xià", pool: "hanzi", charKey: "下" },  // 重复
    { display: "口", pinyin: "kǒu", pool: "hanzi", charKey: "口" },  // 重复
    { display: "耳", pinyin: "ěr", pool: "hanzi", charKey: "耳" },  // 重复
    { display: "目", pinyin: "mù", pool: "hanzi", charKey: "目" },  // 重复
    { display: "羊", pinyin: "yáng", pool: "hanzi", charKey: "羊" },
    { display: "鸟", pinyin: "niǎo", pool: "hanzi", charKey: "鸟" },
    { display: "鱼", pinyin: "yú", pool: "hanzi", charKey: "鱼" },
    { display: "马", pinyin: "mǎ", pool: "hanzi", charKey: "马" },
    { display: "牛", pinyin: "niú", pool: "hanzi", charKey: "牛" },
    { display: "白", pinyin: "bái", pool: "hanzi", charKey: "白" },
    { display: "云", pinyin: "yún", pool: "hanzi", charKey: "云" },
    { display: "雨", pinyin: "yǔ", pool: "hanzi", charKey: "雨" },
    { display: "风", pinyin: "fēng", pool: "hanzi", charKey: "风" },
    { display: "雪", pinyin: "xuě", pool: "hanzi", charKey: "雪" },
    { display: "花", pinyin: "huā", pool: "hanzi", charKey: "花" },  // 重复
    { display: "草", pinyin: "cǎo", pool: "hanzi", charKey: "草" },

    // 课文 11+
    { display: "半", pinyin: "bàn", pool: "hanzi", charKey: "半" },
    { display: "问", pinyin: "wèn", pool: "hanzi", charKey: "问" },
    { display: "回", pinyin: "huí", pool: "hanzi", charKey: "回" },
    { display: "片", pinyin: "piàn", pool: "hanzi", charKey: "片" },
    { display: "皮", pinyin: "pí", pool: "hanzi", charKey: "皮" },
    { display: "北", pinyin: "běi", pool: "hanzi", charKey: "北" },
    { display: "南", pinyin: "nán", pool: "hanzi", charKey: "南" },
    { display: "牙", pinyin: "yá", pool: "hanzi", charKey: "牙" },
    { display: "西", pinyin: "xī", pool: "hanzi", charKey: "西" },
    { display: "好", pinyin: "hǎo", pool: "hanzi", charKey: "好" },
    { display: "比", pinyin: "bǐ", pool: "hanzi", charKey: "比" },
    { display: "尾", pinyin: "wěi", pool: "hanzi", charKey: "尾" },
    { display: "巴", pinyin: "bā", pool: "hanzi", charKey: "巴" },
    { display: "把", pinyin: "bǎ", pool: "hanzi", charKey: "把" },
    { display: "种", pinyin: "zhǒng", pool: "hanzi", charKey: "种" },
    { display: "下", pinyin: "xià", pool: "hanzi", charKey: "下" }   // 重复
  ];

  // 去重（保持首次出现顺序）
  const seen = new Set();
  const uniqueItems = [];
  for (const item of items) {
    if (!seen.has(item.charKey)) {
      seen.add(item.charKey);
      uniqueItems.push(item);
    }
  }

  return {
    id: "hanzi",
    name: "汉字",
    subtitle: "人教版一年级上",
    hint: "描一描汉字，写一写",
    items: uniqueItems
  };
})();
