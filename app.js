const WORDS = [
  "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
  "人", "口", "手", "足", "目", "耳", "头", "心", "大", "小",
  "上", "下", "左", "右", "中", "里", "外", "前", "后", "来",
  "去", "天", "地", "日", "月", "星", "云", "风", "雨", "雪",
  "山", "水", "田", "土", "石", "火", "木", "林", "花", "草",
  "苗", "叶", "果", "鸟", "鱼", "虫", "牛", "羊", "马", "犬",
  "猫", "兔", "鸡", "鸭", "鹅", "家", "门", "窗", "床", "桌",
  "椅", "灯", "书", "包", "笔", "尺", "纸", "画", "字", "本",
  "衣", "帽", "鞋", "袜", "米", "面", "饭", "菜", "汤", "肉",
  "蛋", "奶", "瓜", "豆", "红", "黄", "蓝", "绿", "白", "黑",
  "明", "亮", "早", "晚", "多", "少", "长", "短", "高", "低",
  "快", "慢", "好", "笑", "哭", "走", "跑", "跳", "坐", "立",
  "看", "听", "说", "读", "写", "唱", "拍", "拿", "放", "开",
  "关", "吃", "喝", "玩", "学", "问", "答", "爱", "亲", "朋",
  "友", "爸", "妈", "爷", "婆", "哥", "姐", "弟", "妹", "老",
  "师", "同", "生", "园", "校", "车", "船", "桥", "路", "街",
  "钟", "旗", "球", "鼓", "乐", "歌", "院", "房", "城", "国",
  "春", "夏", "秋", "冬", "冷", "热", "晴", "阴", "新", "旧",
  "平", "安", "正", "反", "轻", "重", "香", "甜", "圆", "方",
  "半", "全", "每", "只", "个", "片", "条", "朵", "双", "两"
];

const GAMES = {
  match: {
    id: "match",
    name: "识字消消乐",
    title: "找到相同的字",
    boardLabel: "识字消消乐棋盘",
    startHint: "点一个字，听一听",
    recordPrefix: "beta_words_match_best"
  },
  memory: {
    id: "memory",
    name: "识字翻翻乐",
    title: "翻出相同的字",
    boardLabel: "识字翻翻乐棋盘",
    startHint: "先记住这些字",
    recordPrefix: "beta_words_memory_best"
  },
  pinyinFriend: {
    id: "pinyinFriend",
    name: "拼音找朋友",
    title: "选出这个字的拼音",
    boardLabel: "拼音找朋友题目",
    startHint: "听一听，选拼音",
    recordPrefix: "beta_words_pinyin_friend_best"
  },
  listenCard: {
    id: "listenCard",
    name: "听音点卡",
    title: "听音，点拼音",
    boardLabel: "听音点卡题目",
    startHint: "听一听，点拼音",
    recordPrefix: "beta_words_listen_card_best"
  },
  stroopTrain: {
    id: "stroopTrain",
    name: "看字识颜色",
    title: "字是什么颜色",
    boardLabel: "看字识颜色棋盘",
    startHint: "看字，选颜色",
    recordPrefix: "beta_words_stroop_train_best"
  },
  // 看图比大小 (Phase 8B) — emoji 数量 + 多/少/一样
  compare: {
    id: "compare",
    name: "看图比大小",
    title: "哪边更多",
    boardLabel: "看图比大小",
    startHint: "看 emoji，比多少",
    recordPrefix: "beta_words_compare_best"
  },
  // Phase 8A — 成语填空（3 年级语文标准）
  idiomFill: {
    id: "idiomFill",
    name: "成语填空",
    title: "把成语填完整",
    boardLabel: "成语填空区",
    startHint: "先点一个空格，再选字",
    recordPrefix: "beta_words_idiom_fill_best"
  }
};

// 斯特鲁普训练用色卡
// 选色原则：
//   - 避开纯白/纯黑（避免字色和字本身识别不清）
//   - 颜色覆盖幼小衔接常见认知（红黄蓝绿 + 紫橙扩展）
//   - 黄字加细描边（见 styles.css .stroop-word）解决浅色字在浅底的对比度问题
//   - 英文名用于 TTS 朗读（en-US）
const STROOP_COLORS = [
  { name: "红", english: "red",    css: "#e94f4f" },
  { name: "黄", english: "yellow", css: "#f5cd2f" },
  { name: "蓝", english: "blue",   css: "#2f80e9" },
  { name: "绿", english: "green",  css: "#2fa84f" },
  { name: "紫", english: "purple", css: "#8a4fd6" },
  { name: "橙", english: "orange", css: "#f08c3a" }
];

// Phase 8B v2: 看图比大小 (主人 2026-08-14 12:36 批准 A+B 实施)
// 关卡制, 不再用 N×N 单纯堆题数; L4 加混合 emoji 维度升级
const COMPARE_EMOJIS = ["🍎", "🐱", "🐟", "🌸", "🍇"];
const COMPARE_LEVELS = {
  3: { name: "L1 数数入门",   questionCount: 6,  maxCount: 4, minDiff: 2, equalChance: 0,    mixedEmoji: false },  // 单 emoji, 差 ≥2
  4: { name: "L2 大小比较",   questionCount: 8,  maxCount: 6, minDiff: 1, equalChance: 0.3,  mixedEmoji: false },  // 单 emoji, = 1/3
  5: { name: "L3 凑数进阶",   questionCount: 10, maxCount: 7, minDiff: 1, equalChance: 0.25, mixedEmoji: false },  // 单 emoji, = 1/4, 相邻数陷阱
  6: { name: "L4 算式混合",   questionCount: 12, maxCount: 9, minDiff: 1, equalChance: 0.25, mixedEmoji: true  }   // 混合 emoji: 同组 2 种, 数总和
};
// 默认 difficulty 按钮文字 (其他游戏用, 改 compare 后会还原)
const DEFAULT_DIFFICULTY_LABELS = {
  3: { name: "3 x 3", sub: "轻松开始" },
  4: { name: "4 x 4", sub: "多认几个" },
  5: { name: "5 x 5", sub: "挑战一下" },
  6: { name: "6 x 6", sub: "越来越难" },
  7: { name: "7 x 7", sub: "极限挑战" }
};

// 看字识颜色难度：颜色种类 + 棋盘总格数
// 颜色种类跟着级别走（3=3 色基础 → 6=6 色全开）；
// 7 级保持 6 色（避免与 6 级颜色维度重复），靠总格数提升难度。
const STROOP_SETTINGS = {
  3: { boardSize: 3, colorCount: 3 },
  4: { boardSize: 4, colorCount: 4 },
  5: { boardSize: 5, colorCount: 5 },
  6: { boardSize: 6, colorCount: 6 },
  7: { boardSize: 6, colorCount: 6 }
};

// Phase stroop-marquee: 跑马灯速度按 board size 渐进
// size 3 (3x3) → 800ms 慢速 (容易读颜色)
// size 7 (6x6) → 300ms 快速 (制造紧张)
// 线性插值: 3→800, 4→675, 5→550, 6→425, 7→300
function getStroopInterval(size) {
  const minInterval = 300, maxInterval = 800;
  const ratio = Math.max(0, Math.min(1, (size - 3) / 4));
  return Math.round(maxInterval - ratio * (maxInterval - minInterval));
}

// Phase stroop-sliding Plan C: 竖向 DDR 队列 (FIFO, 5 note 同时可见)
// duration = interval * 4 → 4-5 note 队列自然形成
// hitZoneStart=0.7, hitZoneEnd=0.9 → 每个 note 在底部 hit zone 有 interval ms 时间
// size 3 (3x3=9 cells): interval 2000ms, duration 8000ms, 4 note 队列
// size 4 (4x4=16): interval 1500ms, duration 6000ms
// size 5 (5x5=25): interval 1200ms, duration 4800ms
// size 6 (6x6=36): interval 1000ms, duration 4000ms
// size 7 (6x6=36): 快, interval 800ms, duration 3200ms
function getStroopSlidingConfig(size) {
  const intervals = { 3: 2000, 4: 1500, 5: 1200, 6: 1000, 7: 800 };
  const interval = intervals[size] || 1500;
  return { interval: interval, duration: interval * 4 };
}

const MEMORY_SECONDS = {
  3: 5,
  4: 8,
  5: 12,
  6: 16,
  7: 20
};

const QUIZ_SETTINGS = {
  3: { questionCount: 6, optionCount: 2 },
  4: { questionCount: 8, optionCount: 3 },
  5: { questionCount: 10, optionCount: 4 },
  6: { questionCount: 12, optionCount: 4 },
  7: { questionCount: 15, optionCount: 4 }
};

const PINYIN_WORDS = [
  { word: "妈", pinyin: "ma" },
  { word: "爸", pinyin: "ba" },
  { word: "马", pinyin: "ma" },
  { word: "大", pinyin: "da" },
  { word: "米", pinyin: "mi" },
  { word: "木", pinyin: "mu" },
  { word: "土", pinyin: "tu" },
  { word: "水", pinyin: "shui" },
  { word: "火", pinyin: "huo" },
  { word: "山", pinyin: "shan" },
  { word: "人", pinyin: "ren" },
  { word: "口", pinyin: "kou" },
  { word: "手", pinyin: "shou" },
  { word: "天", pinyin: "tian" },
  { word: "月", pinyin: "yue" },
  { word: "日", pinyin: "ri" },
  { word: "云", pinyin: "yun" },
  { word: "雨", pinyin: "yu" },
  { word: "风", pinyin: "feng" },
  { word: "花", pinyin: "hua" },
  { word: "草", pinyin: "cao" },
  { word: "鸟", pinyin: "niao" },
  { word: "鱼", pinyin: "yu" },
  { word: "牛", pinyin: "niu" },
  { word: "羊", pinyin: "yang" },
  { word: "猫", pinyin: "mao" },
  { word: "犬", pinyin: "quan" },
  { word: "车", pinyin: "che" },
  { word: "书", pinyin: "shu" },
  { word: "家", pinyin: "jia" }
];

// Phase 8A — 成语填空（idiomFill）3 年级语文标准成语数据
// 数据范围：部编版 3 年级上下册常见成语，4 类共 40 个
//   - 寓言成语 (10)：亡羊补牢 / 揠苗助长 / 画蛇添足 / 守株待兔 / 叶公好龙 / 狐假虎威 / 自相矛盾 / 刻舟求剑 / 邯郸学步 / 杞人忧天
//   - 自然成语 (10)：五光十色 / 千姿百态 / 万紫千红 / 五颜六色 / 色彩斑斓 / 莺歌燕舞 / 春暖花开 / 形态各异 / 成群结队 / 芬芳迷人
//   - 习作性格 (10)：一丝不苟 / 专心致志 / 聚精会神 / 欢声笑语 / 争先恐后 / 各抒己见 / 津津有味 / 不紧不慢 / 垂头丧气 / 哈哈大笑
//   - ABAC/AABB/数字 (10)：摇摇摆摆 / 清清楚楚 / 明明白白 / 有说有笑 / 走来走去 / 又大又红 / 三心二意 / 五湖四海 / 四面八方 / 七上八下
// blankSlots: value 中可扣字的 index 数组（运行时随机选）
const IDIOMS = [
  // 寓言成语
  { id: "wybl", value: "亡羊补牢", blankSlots: [2, 3], pinyin: "wáng yáng bǔ láo", hint: "丢失了羊后修补羊圈。比喻出了问题以后想办法补救。" },
  { id: "ymzz", value: "揠苗助长", blankSlots: [2, 3], pinyin: "yà miáo zhù zhǎng", hint: "把苗拔高帮助它生长。比喻违反事物发展规律，急于求成反而坏事。" },
  { id: "hstz", value: "画蛇添足", blankSlots: [1, 3], pinyin: "huà shé tiān zú", hint: "画好蛇后再添几只脚。比喻做多余的事，反而把事情弄糟。" },
  { id: "szdt", value: "守株待兔", blankSlots: [2, 3], pinyin: "shǒu zhū dài tù", hint: "守着树桩等待兔子撞来。比喻死守经验，不知变通。" },
  { id: "yghl", value: "叶公好龙", blankSlots: [1, 3], pinyin: "yè gōng hào lóng", hint: "叶公喜欢龙，但真龙出现却吓坏了。比喻表面爱好某事物，实际上并不真爱好。" },
  { id: "hjhw", value: "狐假虎威", blankSlots: [1, 3], pinyin: "hú jiǎ hǔ wēi", hint: "狐狸借老虎的威风吓唬百兽。比喻倚仗别人的势力欺压人。" },
  { id: "zxmd", value: "自相矛盾", blankSlots: [2, 3], pinyin: "zì xiāng máo dùn", hint: "自己的言行前后抵触。比喻言语或行为自相抵触。" },
  { id: "kzqj", value: "刻舟求剑", blankSlots: [2, 3], pinyin: "kè zhōu qiú jiàn", hint: "在船上刻记号找掉入水中的剑。比喻拘泥固执，不知变通。" },
  { id: "hdxb", value: "邯郸学步", blankSlots: [2, 3], pinyin: "hán dān xué bù", hint: "到邯郸学走路。比喻盲目模仿别人，不但学不到本事，反而把原来的本领丢了。" },
  { id: "qryt", value: "杞人忧天", blankSlots: [2, 3], pinyin: "qǐ rén yōu tiān", hint: "杞国有个人怕天塌下来。比喻不必要或没有根据的忧虑。" },
  // 自然成语
  { id: "wgss", value: "五光十色", blankSlots: [1, 2], pinyin: "wǔ guāng shí sè", hint: "形容色彩鲜艳，花样繁多。" },
  { id: "qzbt", value: "千姿百态", blankSlots: [1, 3], pinyin: "qiān zī bǎi tài", hint: "形容姿态多种多样。" },
  { id: "wzqh", value: "万紫千红", blankSlots: [1, 3], pinyin: "wàn zǐ qiān hóng", hint: "形容百花齐放，色彩艳丽。" },
  { id: "wyll", value: "五颜六色", blankSlots: [1, 3], pinyin: "wǔ yán liù sè", hint: "形容色彩丰富繁多。" },
  { id: "scbl", value: "色彩斑斓", blankSlots: [2, 3], pinyin: "sè cǎi bān lán", hint: "形容色彩灿烂绚丽。" },
  { id: "ygyw", value: "莺歌燕舞", blankSlots: [1, 3], pinyin: "yīng gē yàn wǔ", hint: "黄莺唱歌，燕子飞舞。形容大好春光或大好形势。" },
  { id: "cnhk", value: "春暖花开", blankSlots: [1, 3], pinyin: "chūn nuǎn huā kāi", hint: "春天气候暖和，百花盛开。" },
  { id: "xtgy", value: "形态各异", blankSlots: [1, 3], pinyin: "xíng tài gè yì", hint: "形状姿态各不相同。" },
  { id: "cqjd", value: "成群结队", blankSlots: [2, 3], pinyin: "chéng qún jié duì", hint: "聚集到一起，形成队伍。" },
  { id: "ffmr", value: "芬芳迷人", blankSlots: [2, 3], pinyin: "fēn fāng mí rén", hint: "香气浓郁，使人沉醉、迷惑。" },
  // 习作/性格成语
  { id: "ysbg", value: "一丝不苟", blankSlots: [2, 3], pinyin: "yī sī bù gǒu", hint: "形容做事认真细致，一点儿不马虎。" },
  { id: "zxzz", value: "专心致志", blankSlots: [2, 3], pinyin: "zhuān xīn zhì zhì", hint: "集中精神，一心一意。" },
  { id: "jjhs", value: "聚精会神", blankSlots: [2, 3], pinyin: "jù jīng huì shén", hint: "集中精神，集中注意力。" },
  { id: "hsxy", value: "欢声笑语", blankSlots: [2, 3], pinyin: "huān shēng xiào yǔ", hint: "欢笑的声音和话语。形容气氛欢快热烈。" },
  { id: "zxkh", value: "争先恐后", blankSlots: [2, 3], pinyin: "zhēng xiān kǒng hòu", hint: "争着向前，唯恐落后。" },
  { id: "gsjj", value: "各抒己见", blankSlots: [2, 3], pinyin: "gè shū jǐ jiàn", hint: "各自发表自己的意见。" },
  { id: "jjyw", value: "津津有味", blankSlots: [2, 3], pinyin: "jīn jīn yǒu wèi", hint: "形容很有滋味或很有趣味。" },
  { id: "bjbm", value: "不紧不慢", blankSlots: [1, 3], pinyin: "bù jǐn bù màn", hint: "形容从容不迫的样子。" },
  { id: "ctsq", value: "垂头丧气", blankSlots: [2, 3], pinyin: "chuí tóu sàng qì", hint: "低着头，精神不振。形容失意懊丧的样子。" },
  { id: "hbdx", value: "哈哈大笑", blankSlots: [2, 3], pinyin: "hā hā dà xiào", hint: "形容开怀大笑。" },
  // ABAC/AABB/数字成语
  { id: "yybb", value: "摇摇摆摆", blankSlots: [1, 2, 3], pinyin: "yáo yáo bǎi bǎi", hint: "形容走路不稳或物体摇摆的样子。" },
  { id: "qqcc", value: "清清楚楚", blankSlots: [1, 2, 3], pinyin: "qīng qīng chǔ chǔ", hint: "清晰明白，容易辨认。" },
  { id: "mmbb", value: "明明白白", blankSlots: [1, 2, 3], pinyin: "míng míng bái bái", hint: "清清楚楚，明确无误。" },
  { id: "ysyx", value: "有说有笑", blankSlots: [1, 3], pinyin: "yǒu shuō yǒu xiào", hint: "形容人谈笑不止。" },
  { id: "zlzq", value: "走来走去", blankSlots: [1, 3], pinyin: "zǒu lái zǒu qù", hint: "来回往返，不停地走。" },
  { id: "ydyh", value: "又大又红", blankSlots: [2, 3], pinyin: "yòu dà yòu hóng", hint: "形容又大又红的样子。" },
  { id: "sxey", value: "三心二意", blankSlots: [2, 3], pinyin: "sān xīn èr yì", hint: "形容犹豫不决或意志不坚定。" },
  { id: "whsh", value: "五湖四海", blankSlots: [1, 3], pinyin: "wǔ hú sì hǎi", hint: "泛指四面八方，全国各地。" },
  { id: "smbf", value: "四面八方", blankSlots: [2, 3], pinyin: "sì miàn bā fāng", hint: "各个方向，各个地方。" },
  { id: "qsbx", value: "七上八下", blankSlots: [1, 2], pinyin: "qī shàng bā xià", hint: "形容心里慌乱不安。" },
];

// 难度梯度（主人 2026-08-09 18:48 拍板）：idiomCount + blankPerIdiom + 干扰字
// 干扰字从已选成语的未扣字里随机抽（保持纯净，不引入其他字）
const IDIOM_SETTINGS = {
  3: { idiomCount: 3, blankPerIdiom: 1 },
  4: { idiomCount: 4, blankPerIdiom: 1 },
  5: { idiomCount: 5, blankPerIdiom: 2 },
  6: { idiomCount: 6, blankPerIdiom: 2 },
  7: { idiomCount: 7, blankPerIdiom: 2 },
};

const state = {
  game: GAMES.match.id,
  phase: "playing",
  size: 3,
  tiles: [],
  questions: [],
  questionIndex: 0,
  currentQuestion: null,
  options: [],
  selectedId: null,
  locked: false,
  matchedCount: 0,
  totalTargets: 0,
  timerStarted: false,
  timerStartTime: null,
  timerInterval: null,
  memoryCountdownInterval: null,
  memoryRevealTimeout: null,
  replayVoiceKey: null,
  replayText: null,
  lastVoiceKey: null,
  lastSpoken: "识字消消乐",
  // 看字识颜色专用
  stroopQuestions: [],
  stroopFilledColors: [],   // 玩家逐格填入的颜色（null = 还未填）
  stroopCursor: 0,          // 当前待填 idx
  stroopCorrectCount: 0,    // 已判定且正确
  stroopLocked: false,      // 提交后短期锁定防双击
  stroopNoteInstances: [],   // SlidingNote 实例数组 (Phase stroop-sliding, DDR 风格滑动音符)
  // Phase 8A — 成语填空专用 state（Phase 8B 接交互）
  idioms: [],               // 本局选的成语数组（按滚筒顺序）[{id, value, blanks, pinyin, hint, selectedBlanks: [slotIdx, ...]}, ...]
  idiomBlanks: {},          // 各成语被扣字位置 {idiomId: [slotIdx, ...]}（已选）
  idiomFilled: {},          // 各成语已填字 {idiomId: {slotIdx: char}}
  idiomCompleted: {},       // 已完成成语 {idiomId: true}
  idiomCandidates: [],      // 候选字池（被扣字 + 干扰字打乱）
  idiomCurrentIdx: 0,       // 滚筒当前 focus 的成语 idx
  idiomSelectedSlot: null,  // 两段式第一步选中的空格 {idiomId, slotIdx} | null
  idiomTotalCompleted: 0    // 已完成成语数
};

const AUDIO_MAP = window.BETA_WORDS_AUDIO || {};
let currentAudio = null;

// === Design System v2 Phase C — 多邻国化助手（feat/design-system-v2，2026-07-31） ===
// 7 个 base prompt key × 3-6 个变体，每次调用随机选一个变体朗读 (Duolingo 式随机赞美/鼓励)
// SOP 第 6 条播放优先级保持: manifest[KEY] → SpeechSynthesis fallback.
const VOICE_VARIANTS = {
  "prompt.start": [
    { key: "prompt.start.1", text: "开始" },
    { key: "prompt.start.2", text: "准备好啦" },
    { key: "prompt.start.3", text: "出发" },
    { key: "prompt.start.4", text: "加油" },
  ],
  "prompt.bonus": [
    { key: "prompt.bonus.1", text: "真棒" },
    { key: "prompt.bonus.2", text: "哇，太好了" },
    { key: "prompt.bonus.3", text: "厉害呀" },
  ],
  "prompt.correct": [
    { key: "prompt.correct.1", text: "找对了" },
    { key: "prompt.correct.2", text: "太棒了" },
    { key: "prompt.correct.3", text: "答得真好" },
    { key: "prompt.correct.4", text: "完美" },
    { key: "prompt.correct.5", text: "厉害" },
    { key: "prompt.correct.6", text: "哇，找到了" },
  ],
  "prompt.tryAgain": [
    { key: "prompt.tryAgain.1", text: "再试一次" },
    { key: "prompt.tryAgain.2", text: "没关系" },
    { key: "prompt.tryAgain.3", text: "再想想" },
    { key: "prompt.tryAgain.4", text: "差一点了" },
  ],
  "prompt.complete": [
    { key: "prompt.complete.1", text: "都找到了" },
    { key: "prompt.complete.2", text: "完成啦" },
    { key: "prompt.complete.3", text: "太厉害啦" },
    { key: "prompt.complete.4", text: "好极了" },
    { key: "prompt.complete.5", text: "完美通关" },
    { key: "prompt.complete.6", text: "哇，你赢了" },
  ],
  "prompt.remember": [
    { key: "prompt.remember.1", text: "先记住这些字" },
    { key: "prompt.remember.2", text: "看清楚啦" },
    { key: "prompt.remember.3", text: "记住这些字" },
    { key: "prompt.remember.4", text: "看好咯" },
  ],
  "prompt.flip": [
    { key: "prompt.flip.1", text: "开始翻牌" },
    { key: "prompt.flip.2", text: "来翻牌吧" },
    { key: "prompt.flip.3", text: "准备好了吗" },
  ],
};

function playVoiceVariant(baseKey, options = {}) {
  const variants = VOICE_VARIANTS[baseKey];
  if (!variants || variants.length === 0) {
    playVoice(baseKey, baseKey, options);
    return;
  }
  const pick = variants[Math.floor(Math.random() * variants.length)];
  playVoice(pick.key, pick.text, options);
}

// Mascot 4 状态切换（用 <img class="mascot-host"> src 切换 + .bounce 动画触发）
// 重要：DOM 里有多个 .mascot-host（大厅 + 游戏区），必须全部同步，否则 querySelector
// 只返回第一个（大厅那个被隐藏的），游戏区始终停在 wave.svg。
function setMascotState(state, bounce = true) {
  const states = {
    wave: "assets/mascot-wave.svg",
    happy: "assets/mascot-happy.svg",
    sad: "assets/mascot-sad.svg",
    celebrate: "assets/mascot-celebrate.svg",
  };
  if (!states[state]) return;
  const mascotImgs = document.querySelectorAll(".mascot-host");
  if (!mascotImgs.length) return;
  mascotImgs.forEach((mascotImg) => {
    mascotImg.src = states[state];
    if (bounce) {
      mascotImg.classList.remove("bounce");
      void mascotImg.offsetWidth; // force reflow to restart animation
      mascotImg.classList.add("bounce");
    }
  });
}

// Confetti 粒子（多邻国式完成撒花）
// Phase 4B 决策 3 选 A：随机彩色 hsl（之前是 4 色固定，扩展为全色相）
function spawnConfetti(count = 24) {
  const host = document.createElement("div");
  host.className = "confetti-host";
  document.body.appendChild(host);
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    // 随机色相 + 亮彩 + 随机色（亮黄/粉/蓝/绿...）
    const hue = Math.floor(Math.random() * 360);
    const sat = 75 + Math.floor(Math.random() * 20);  // 75-95%
    const light = 55 + Math.floor(Math.random() * 15); // 55-70%
    piece.style.background = `hsl(${hue}, ${sat}%, ${light}%)`;
    piece.style.animationDelay = `${Math.random() * 300}ms`;
    host.appendChild(piece);
  }
  setTimeout(() => host.remove(), 1500);
}

// ============================================================
// Phase 5A — 反馈动效基础设施（小彩屑 + 红光闪）
// 父文档：docs/phase-plans/phase-5-feedback-animations.md
// 决策：决策 1/2/3 选 A A A（每次答对彩屑 / 屏幕红光闪 / mascot 不动）
// ============================================================

// R-5A.1：答对小彩屑（从 (x, y) burst 散开 8 片）
// Phase 5A fix：pieces 直接 appendChild 到 body（跳过 host div 避免 height:0 截断）
function spawnMiniConfetti(x, y, hue, count = 8) {
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-mini-piece";
    // 圆形 burst 散开 + 随机角度抖动
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const distance = 30 + Math.random() * 40;
    piece.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--ty", `${Math.sin(angle) * distance}px`);
    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;
    // 主色 + 邻近色相随机
    piece.style.background = `hsl(${(hue || 30) + (Math.random() * 30 - 15)}, 80%, 60%)`;
    document.body.appendChild(piece);
    pieces.push(piece);
  }
  setTimeout(() => pieces.forEach((p) => p.remove()), 800);
}

// R-5A.2：屏幕边缘红光闪（答错时）
function flashError() {
  const flash = document.createElement("div");
  flash.className = "error-flash";
  document.body.appendChild(flash);
  requestAnimationFrame(() => flash.classList.add("is-active"));
  setTimeout(() => {
    flash.classList.remove("is-active");
    setTimeout(() => flash.remove(), 400);
  }, 80);
}

// ============================================================
// Phase 4B — 奖杯 + 星星 + 历史最佳
// 父文档：docs/phase-plans/phase-4-complete-panel.md
// 决策：1/2/3 选 A A A
// ============================================================

// 决策 1 A：简单档位 stars
// rate<0.5: 0 颗, <0.8: 1 颗, <1.0: 2 颗, 1.0: 3 颗
function calcStarCount(correct, total) {
  if (!total) return 0;
  const rate = correct / total;
  if (rate < 0.5) return 0;
  if (rate < 0.8) return 1;
  if (rate < 1.0) return 2;
  return 3;
}

// 奖杯档位：rate<0.5 不显示，<0.8 铜，<1.0 银，1.0 金
function calcTrophyTier(correct, total) {
  if (!total) return null;
  const rate = correct / total;
  if (rate < 0.5) return null;
  if (rate < 0.8) return "bronze";
  if (rate < 1.0) return "silver";
  return "gold";
}

// 决策 2 A：奖杯 + 星星都显示
// showTrophy: 只显示 1 档奖杯（init 全部 hidden，动态显示 1 档）
function showTrophy(tier) {
  document.querySelectorAll(".trophy").forEach((t) => { t.hidden = true; });
  if (!tier) return;
  const el = document.querySelector(`.trophy[data-tier="${tier}"]`);
  if (el) el.hidden = false;
}

// showStars: 标记 earned（只 mark 已点亮，未点亮保持浅灰）
function showStars(starCount) {
  document.querySelectorAll(".complete-panel .star").forEach((s, i) => {
    s.classList.toggle("is-earned", i < starCount);
  });
}

// 统一调用：phase 4B 打包入口
function renderTrophiesAndStars(correct, total) {
  const stars = calcStarCount(correct, total);
  const tier = calcTrophyTier(correct, total);
  showTrophy(tier);
  showStars(stars);
}

// Phase victory-popup-v2: 胜利弹窗 tier-based 内容
// - Title: per game + per tier (perfect/good/tryAgain) — 修 HTML 硬编码 "都找到了"
// - Audio: rate >= 0.5 → prompt.complete (庆祝), rate < 0.5 → prompt.tryAgain (鼓励)
// - 修 bug: 0% 完成不再喊 "太棒了/完美通关" 等庆祝话
const COMPLETE_TITLES = {
  match:        { perfect: "全部配对成功！", good: "完成啦！",     tryAgain: "再试一次" },
  memory:       { perfect: "全部记起来啦！", good: "完成啦！",     tryAgain: "再多看几次" },
  pinyinFriend: { perfect: "拼音全对！",     good: "完成啦！",     tryAgain: "再听一次" },
  listenCard:   { perfect: "听得全对！",     good: "听对了不少！", tryAgain: "再听一次" },
  compare:      { perfect: "比得全对！",     good: "多数对了！",   tryAgain: "再数一数" },
  stroopTrain:  { perfect: "完美读色！",     good: "颜色对了不少！", tryAgain: "颜色对应看仔细" },
  idiomFill:    { perfect: "成语全通关！",   good: "填对不少！",   tryAgain: "再读几遍" }
};

function renderCompletePanel(gameId, correct, total) {
  const rate = total > 0 ? correct / total : 0;
  const tier = rate >= 1.0 ? "perfect" : rate >= 0.5 ? "good" : "tryAgain";
  const titleText = COMPLETE_TITLES[gameId]?.[tier] || "完成啦！";
  const titleEl = document.querySelector(".complete-title");
  if (titleEl) {
    titleEl.textContent = titleText;
    titleEl.dataset.tier = tier;
  }
  // Audio: rate >= 0.5 → celebratory, rate < 0.5 → encouraging (修 bug: 0% 不喊太棒了)
  const audioKey = rate >= 0.5 ? "prompt.complete" : "prompt.tryAgain";
  playVoiceVariant(audioKey, { replayable: false });
}


const screens = {
  lobby: document.querySelector("#lobby"),
  setup: document.querySelector("#setup"),
  game: document.querySelector("#game")
};

const board = document.querySelector("#board");
const progress = document.querySelector("#progress");
const timer = document.querySelector("#timer");
const hint = document.querySelector("#hint");
const completePanel = document.querySelector("#complete-panel");
const completeTime = document.querySelector("#complete-stats");  // Phase 4A: 改用 #complete-stats
const bestRecord = document.querySelector("#best-record");
const gameSubtitle = document.querySelector("#game-subtitle");
const gameTitle = document.querySelector("#game-title");
const setupTitle = document.querySelector("#setup-title");
const quiz = document.querySelector("#quiz");
const quizMain = document.querySelector("#quiz-main");
const optionGrid = document.querySelector("#option-grid");
const stroopHost = document.querySelector("#stroop-host");
const compareHost = document.querySelector("#compare-host");
const compareQuestion = document.querySelector("#compare-question");
const compareButtons = document.querySelector("#compare-buttons");
const stroopBoard = document.querySelector("#stroop-board");
const stroopSelect = document.querySelector("#stroop-select");
const stroopPalette = document.querySelector("#stroop-palette");
// Phase 8A — 成语填空专用 DOM
const idiomHost = document.querySelector("#idiom-host");
const idiomTrack = document.querySelector("#idiom-track");
const idiomPool = document.querySelector("#idiom-pool");
// 鼠标滚轮（中键滚动）切换成语 — 主人 2026-08-09 20:47 验收标准
idiomTrack.addEventListener("wheel", handleIdiomWheel, { passive: false });

const BEST_RECORD_TTL = 365 * 24 * 60 * 60 * 1000;

document.querySelector("#open-match").addEventListener("click", () => chooseGame(GAMES.match.id));
document.querySelector("#open-memory").addEventListener("click", () => chooseGame(GAMES.memory.id));
document.querySelector("#open-pinyin-friend").addEventListener("click", () => chooseGame(GAMES.pinyinFriend.id));
document.querySelector("#open-listen-card").addEventListener("click", () => chooseGame(GAMES.listenCard.id));
document.querySelector("#open-stroop-train").addEventListener("click", () => chooseGame(GAMES.stroopTrain.id));
// 看图比大小入口 (Phase 8B)
document.querySelector("#open-compare")?.addEventListener("click", () => chooseGame(GAMES.compare.id));
// Phase 8A — 成语填空入口
document.querySelector("#open-idiom-fill")?.addEventListener("click", () => chooseGame(GAMES.idiomFill.id));
document.querySelector("#play-again").addEventListener("click", () => startGame(state.size));
document.querySelector("#replay-sound").addEventListener("click", () => playReplayVoice());
// “再听一遍” 按钮在听音点卡 + 看字识颜色 中隐藏（不依赖读音重播）

// 页面初始化：默认 lobby 主题（即使还没点任何卡，body 也有正确 data-game）
syncTheme("lobby");

// Voice picker：齿轮打开 / 点 backdrop 或 ✕ 关闭
document.querySelector("#open-voice-picker")?.addEventListener("click", () => {
  waitForVoices().then(openVoicePicker);
});
document.querySelectorAll('[data-close="voice-picker"]').forEach((el) => {
  el.addEventListener("click", closeVoicePicker);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !document.getElementById("voice-picker").hidden) {
    closeVoicePicker();
  }
});
// 提前把 voices 拉一遍（让首答时不要等）
waitForVoices();
function syncReplayVisibility() {
  const replayBtn = document.querySelector("#replay-sound");
  if (!replayBtn) return;
  const needsReplay = state.game !== GAMES.stroopTrain.id;
  replayBtn.hidden = !needsReplay;
}

// 看字识颜色：计时器保留（结算页新纪录判定依赖 elapsedMs），进度靠视觉感知故隐藏
function syncStroopHud() {
  const isStroop = state.game === GAMES.stroopTrain.id;
  const hudTimer = document.querySelector(".hud-timer");
  const hudProgress = document.querySelector(".hud-progress");
  if (hudTimer) hudTimer.hidden = false;
  if (hudProgress) hudProgress.hidden = isStroop;
}
document.querySelector("#next-board").addEventListener("click", () => {
  const next = nextSize(state.size);
  if (next) startGame(next);
});

document.querySelectorAll(".difficulty").forEach((button) => {
  button.addEventListener("click", () => startGame(Number(button.dataset.size)));
});

document.querySelectorAll("[data-action='back-lobby']").forEach((button) => {
  button.addEventListener("click", () => {
    leaveGame();
    showScreen("lobby");
  });
});

document.querySelectorAll("[data-action='back-setup']").forEach((button) => {
  button.addEventListener("click", () => {
    leaveGame();
    showScreen("setup");
  });
});

// Game Stage Engine：初始化设计画布 + 等比缩放
const stage = new GameStage(document.querySelector(".stage"));

window.addEventListener("resize", () => { stage.update(); calcTileFont(); calcStroopFont(); });
window.visualViewport?.addEventListener("resize", () => { stage.update(); calcTileFont(); calcStroopFont(); });
new ResizeObserver(() => calcTileFont).observe(document.querySelector("#board"));
if (stroopBoard) new ResizeObserver(() => calcStroopFont()).observe(stroopBoard);

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  // 返回 lobby 时重置主题色（默认进 setup 不走这个，因为 chooseGame 会主动设）
  if (name === "lobby") syncTheme(null);
}

// Per-game 主题色同步（Phase 1A，2026-08-01 立）
// gameId 传 null / undefined / 'lobby' → 默认 lobby 主题
function syncTheme(gameId) {
  document.body.dataset.game = gameId || "lobby";
  // Phase 6A：同步 letterbox 背景
  syncBgLayer(gameId || "lobby");
}

// Phase 6A：letterbox 背景切换（fade 400ms）
function syncBgLayer(gameId) {
  const target = document.querySelector(`.letterbox-bg[data-bg="${gameId}"]`);
  if (!target) return;
  document.querySelectorAll('.letterbox-bg').forEach((el) => el.classList.remove('is-active'));
  target.classList.add('is-active');
}

function leaveGame() {
  stopMemoryCountdown();
  stopTimer();
  state.locked = false;
  state.selectedId = null;
  state.currentQuestion = null;
  state.options = [];
  state.stroopQuestions = [];
  state.stroopFilledColors = [];
  state.stroopCursor = 0;
  state.stroopCorrectCount = 0;
  state.stroopLocked = false;
  state.compareQuestions = [];
  state.compareAnswers = [];
  state.compareCursor = 0;
  state.compareCorrectCount = 0;
  // Phase 8A: 成语填空 state 清理
  state.idioms = [];
  state.idiomBlanks = {};
  state.idiomFilled = {};
  state.idiomCompleted = {};
  state.idiomCandidates = [];
  state.idiomCurrentIdx = 0;
  state.idiomSelectedSlot = null;
  state.idiomTotalCompleted = 0;
  // Phase 7B: 离开 play 页面 — fadeOut BGM
  window.bgmController?.stop();
}

function chooseGame(gameId) {
  state.game = gameId;
  const game = getCurrentGame();
  setupTitle.textContent = `${game.name} · 选择难度`;
  syncTheme(gameId);  // 同步主题色到 body[data-game]
  syncReplayVisibility();
  syncStroopHud();
  setRecommendedDifficulty(gameId);  // Phase 2A.2：按游戏标记推荐难度
  syncSetupForGame(gameId);  // Phase 8B v2: compare 用 L1-L4 关卡, 其他还原默认
  showScreen("setup");
}

// Phase 8B v2: compare 用 L1-L4 关卡 (难度设计 A), 其他游戏还原默认难度文字 (不动其他游戏)
function syncSetupForGame(gameId) {
  const isCompare = gameId === GAMES.compare.id;
  document.querySelectorAll('#setup .difficulty').forEach((btn) => {
    const size = parseInt(btn.dataset.size, 10);
    const strongEl = btn.querySelector('strong');
    const spanEl = btn.querySelector('span');
    if (isCompare) {
      // size 7 没在 COMPARE_LEVELS, 隐藏
      btn.hidden = (size === 7);
      const cfg = COMPARE_LEVELS[size];
      if (cfg && strongEl && spanEl) {
        strongEl.textContent = cfg.name;
        spanEl.textContent = `${cfg.questionCount}题`;
      }
    } else {
      btn.hidden = false;
      const cfg = DEFAULT_DIFFICULTY_LABELS[size];
      if (cfg && strongEl && spanEl) {
        strongEl.textContent = cfg.name;
        spanEl.textContent = cfg.sub;
      }
    }
  });
}

// Phase 2A.2：每个游戏的"黄金难度"（详见 docs/phase-plans/phase-2-lobby-setup.md）
const RECOMMENDED_SIZE = {
  match: 4,        // 4×4 黄金难度
  memory: 4,       // 4×4
  pinyinFriend: 4, // 4×4（setup 没有 6 题选项，取最近意思）
  listenCard: 4,   // 4×4
  stroopTrain: 3,  // 3×3 入门（颜色字少不晕）
  compare: 3,      // 看图比大小 3×3 入门
  idiomFill: 4,    // 4 个成语，1 字/成语（入门梯度）
};

function setRecommendedDifficulty(gameId) {
  const size = RECOMMENDED_SIZE[gameId];
  document.querySelectorAll('#setup .difficulty').forEach((btn) => {
    btn.removeAttribute('data-recommended');
    if (parseInt(btn.dataset.size, 10) === size) {
      btn.setAttribute('data-recommended', 'true');
    }
  });
}

function startGame(size) {
  stopMemoryCountdown();
  resetTimer();
  state.size = size;
  state.phase = state.game === GAMES.memory.id ? "preview" : "playing";
  state.selectedId = null;
  state.locked = false;
  state.matchedCount = 0;
  state.questions = [];
  state.questionIndex = 0;
  state.currentQuestion = null;
  state.options = [];
  state.replayVoiceKey = null;
  state.replayText = null;
  completePanel.hidden = true;
  bestRecord.hidden = true;
  if (completeTime) completeTime.textContent = "用时 00:00 · 成功率 0 / 0（0%）";
  const game = getCurrentGame();
  gameSubtitle.textContent = `${game.name} ${size} x ${size}`;
  gameTitle.textContent = game.title;
  board.setAttribute("aria-label", game.boardLabel);
  board.classList.toggle("memory", state.game === GAMES.memory.id);
  const isQuizGame = isCurrentQuizGame();
  const isStroopGame = state.game === GAMES.stroopTrain.id;
  const isCompareGame = state.game === GAMES.compare.id;
  if (isStroopGame) {
    board.hidden = true;
    quiz.hidden = true;
    if (stroopHost) stroopHost.hidden = false;
    if (idiomHost) idiomHost.hidden = true;
    if (compareHost) compareHost.hidden = true;
  } else if (isCompareGame) {
    board.hidden = true;
    quiz.hidden = true;
    if (stroopHost) stroopHost.hidden = true;
    if (idiomHost) idiomHost.hidden = true;
    if (compareHost) compareHost.hidden = false;
  } else if (state.game === GAMES.idiomFill.id) {
    // Phase 8A: 成语填空（独立 zone-stack，不复用 board/quiz/stroopHost）
    board.hidden = true;
    quiz.hidden = true;
    if (stroopHost) stroopHost.hidden = true;
    if (idiomHost) idiomHost.hidden = false;
    if (compareHost) compareHost.hidden = true;
  } else {
    board.hidden = isQuizGame;
    quiz.hidden = !isQuizGame;
    if (stroopHost) stroopHost.hidden = true;
    if (idiomHost) idiomHost.hidden = true;
    if (compareHost) compareHost.hidden = true;
  }
  syncStroopHud();
  optionGrid.innerHTML = "";
  quizMain.innerHTML = "";

  if (isQuizGame) {
    startQuizGame(size);
    showScreen("game");
    window.bgmController?.playForGame(state.game);
    return;
  }

  if (state.game === GAMES.stroopTrain.id) {
    startStroopGame(size);
    showScreen("game");
    window.bgmController?.playForGame(state.game);
    return;
  }

  // Phase 8B: 看图比大小分支
  if (state.game === GAMES.compare.id) {
    startCompareGame(size);
    showScreen("game");
    window.bgmController?.playForGame(state.game);
    return;
  }

  // Phase 8A: 成语填空分支
  if (state.game === GAMES.idiomFill.id) {
    startIdiomFillGame(size);
    showScreen("game");
    window.bgmController?.playForGame(state.game);
    return;
  }

  state.tiles = createTiles(size);
  if (state.game === GAMES.memory.id) {
    state.tiles.forEach((tile) => {
      tile.revealed = true;
      if (tile.kind === "bonus") {
        tile.matched = true;
      }
    });
  }
  state.totalTargets = state.tiles.filter((tile) => tile.kind === "word").length;
  board.style.setProperty("--size", size);
  renderBoard();
  updateProgress();
  showScreen("game");
  calcTileFont();

  if (state.game === GAMES.memory.id) {
    startMemoryPreview(size);
    return;
  }

  setHint(game.startHint);
  playVoiceVariant("prompt.start", { replayable: false });
  // Phase 7B: 进 play 页面 — 启动当前游戏 BGM
  window.bgmController?.playForGame(state.game);
}

function calcTileFont() {
  if (screens.game.classList.contains("active") === false) return;
  const boardEl = document.querySelector("#board");
  if (!boardEl) return;
  const boardW = boardEl.offsetWidth;
  const style = getComputedStyle(boardEl);
  const gap = parseFloat(style.gap) || 8;
  const tileSize = (boardW - gap * (state.size - 1)) / state.size;
  const fontSize = tileSize * (state.size >= 6 ? 0.54 : 0.62);
  board.style.setProperty("--tile-font", `${Math.max(12, Math.floor(fontSize))}px`);
}

// 看字识颜色棋盘：随格子实际大小自动调字号，避免 6×6/7×7 字溢出
function calcStroopFont() {
  if (!stroopBoard) return;
  const boardW = stroopBoard.offsetWidth;
  const style = getComputedStyle(stroopBoard);
  const gap = parseFloat(style.gap) || 4;
  // 用实际 boardSize（state.size=7 时仍渲染 6×6，见 STROOP_SETTINGS），不用 state.size
  const sizeVar = parseInt(stroopBoard.style.getPropertyValue("--size"), 10) || 3;
  const cellSize = (boardW - gap * (sizeVar - 1)) / sizeVar;
  const ratio = sizeVar >= 6 ? 0.45 : 0.5;
  const fontSize = Math.max(10, Math.floor(cellSize * ratio));
  stroopBoard.style.setProperty("--stroop-cell-font", `${fontSize}px`);
  // 同步到待选格
  if (stroopSelect) stroopSelect.style.setProperty("--stroop-cell-font", `${fontSize}px`);
}


function createTiles(size) {
  const cellCount = size * size;
  const pairCount = Math.floor(cellCount / 2);
  const picked = shuffle([...WORDS]).slice(0, pairCount);
  const tiles = picked.flatMap((word) => [
    createTile("word", word),
    createTile("word", word)
  ]);

  if (cellCount % 2 === 1) {
    tiles.push(createTile("bonus", "星"));
  }

  return shuffle(tiles).map((tile, index) => ({ ...tile, id: `tile-${index}` }));
}

function createTile(kind, value) {
  return {
    kind,
    value,
    revealed: false,
    matched: false
  };
}

function renderBoard() {
  board.innerHTML = "";
  const isMemory = state.game === GAMES.memory.id;
  state.tiles.forEach((tile, index) => {
    const button = document.createElement("button");
    button.className = `tile ${tile.kind === "bonus" ? "bonus" : ""}`;
    button.type = "button";
    button.dataset.id = tile.id;
    button.setAttribute("role", "gridcell");
    // Phase 3D 决策 1：memory 3D 翻牌 — 只在 memory 模式加 .tile-face / .tile-back DOM
    // match 模式直接用 button textContent（避免多出来 "?"）
    if (isMemory) {
      button.innerHTML =
        `<span class="tile-face tile-back" aria-hidden="true">?</span>` +
        `<span class="tile-face tile-front" aria-hidden="true"></span>`;
    }
    updateTileButton(button, tile);
    button.style.transitionDelay = `${Math.min(index * 8, 80)}ms`;
    button.addEventListener("click", () => handleTileClick(tile.id));
    board.appendChild(button);
  });
}

function handleTileClick(tileId) {
  if (state.game === GAMES.memory.id) {
    handleMemoryTileClick(tileId);
    return;
  }

  handleMatchTileClick(tileId);
}

function handleMatchTileClick(tileId) {
  if (state.locked) return;

  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.matched) return;

  if (tile.kind === "bonus") {
    tile.matched = true;
    playVoiceVariant("prompt.bonus", { replayable: false });
    markTile(tileId, "is-bonus");
    setHint("奖励星星");
    setMascotState("happy");
    checkComplete();
    return;
  }

  playVoice(getWordVoiceKey(tile.value), tile.value);

  if (!state.selectedId) {
    state.selectedId = tileId;
    startTimer();
    markTile(tileId, "is-selected");
    setHint(`再找一个“${tile.value}”`);
    return;
  }

  if (state.selectedId === tileId) {
    state.selectedId = null;
    markTile(tileId, "is-selected", false);
    setHint("点一个字，听一听");
    return;
  }

  const selectedTile = state.tiles.find((item) => item.id === state.selectedId);
  const selectedButton = getTileButton(state.selectedId);

  if (selectedTile && selectedTile.value === tile.value) {
    const firstId = state.selectedId;
    const secondId = tileId;
    state.locked = true;
    tile.matched = true;
    selectedTile.matched = true;
    state.matchedCount += 2;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    markTile(firstId, "is-correct");
    markTile(secondId, "is-correct");
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });
    // Phase 5B：match 配对成功 — 从第二个 tile 位置 burst 8 片橙色小彩屑
    // match 主题色 hue=30（暖橙）
    const secondRect = getTileButton(secondId)?.getBoundingClientRect();
    if (secondRect) {
      spawnMiniConfetti(
        secondRect.left + secondRect.width / 2,
        secondRect.top + secondRect.height / 2,
        30,  // match 主题色 hue
        8
      );
    }

    window.setTimeout(() => {
      markTile(firstId, "is-correct", false);
      markTile(secondId, "is-correct", false);
      markTile(firstId, "matched");  // 旧 class alias: 触发 fade-out
      markTile(secondId, "matched");
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 520);
  } else {
    state.locked = true;
    // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景
    markTile(tileId, "is-wrong");
    setHint("再试一次");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    setMascotState("sad");
    playVoice("sfx.wrong-buzz", "", { replayable: false });
    // Phase 5B：match 配对错误 — 屏幕边缘红光闪
    flashError();

    window.setTimeout(() => {
      markTile(tileId, "is-wrong", false);
      selectedButton?.classList.remove("is-selected");
      state.selectedId = null;
      state.locked = false;
      setHint("点一个字，听一听");
    }, 420);
  }
}

function handleMemoryTileClick(tileId) {
  if (state.locked || state.phase !== "playing") return;

  const tile = state.tiles.find((item) => item.id === tileId);
  if (!tile || tile.matched || tile.revealed) return;

  tile.revealed = true;
  playVoice(getWordVoiceKey(tile.value), tile.value);
  markTile(tileId, "is-selected");
  updateTile(tileId);

  if (!state.selectedId) {
    state.selectedId = tileId;
    setHint(`再翻一个“${tile.value}”`);
    return;
  }

  const selectedTile = state.tiles.find((item) => item.id === state.selectedId);
  const selectedId = state.selectedId;

  if (selectedTile && selectedTile.value === tile.value) {
    state.locked = true;
    tile.matched = true;
    selectedTile.matched = true;
    state.matchedCount += 2;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    markTile(tile.id, "is-correct");
    markTile(selectedId, "is-correct");
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });
    // Phase 5C.2：memory 配对成功 — 从 tile 位置 burst 8 片紫色小彩屑
    // memory 主题色 hue=270（紫）
    const memCorrectRect = getTileButton(tile.id)?.getBoundingClientRect();
    if (memCorrectRect) {
      spawnMiniConfetti(
        memCorrectRect.left + memCorrectRect.width / 2,
        memCorrectRect.top + memCorrectRect.height / 2,
        270,  // memory 主题色 hue
        8
      );
    }

    window.setTimeout(() => {
      markTile(tile.id, "is-correct", false);
      markTile(selectedId, "is-correct", false);
      // memory 风格: 保留显示 (旧 class alias .memory-matched 保留绿底显示)
      markTile(tile.id, "memory-matched");
      markTile(selectedId, "memory-matched");
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      updateProgress();
      checkComplete();
    }, 520);
  } else {
    state.locked = true;
    // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景 (两张都错)
    markTile(tile.id, "is-wrong");
    markTile(selectedId, "is-wrong");
    setHint("再试一次");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    setMascotState("sad");
    playVoice("sfx.wrong-buzz", "", { replayable: false });
    // Phase 5C.2：memory 配对错误 — 屏幕边缘红光闪
    flashError();

    window.setTimeout(() => {
      tile.revealed = false;
      if (selectedTile) {
        selectedTile.revealed = false;
      }
      markTile(tile.id, "is-wrong", false);
      markTile(selectedId, "is-wrong", false);
      updateTile(tile.id);
      updateTile(selectedId);
      state.selectedId = null;
      state.locked = false;
      setHint("翻出两个一样的字");
    }, 680);
  }
}

function startQuizGame(size) {
  const settings = QUIZ_SETTINGS[size] || QUIZ_SETTINGS[3];
  state.questions = createPinyinQuestions(settings.questionCount);
  state.totalTargets = state.questions.length;
  state.matchedCount = 0;
  updateProgress();
  setHint(getCurrentGame().startHint);
  showQuizQuestion();
  startTimer();
}

function createPinyinQuestions(count) {
  return shuffle(PINYIN_WORDS).slice(0, count).map((question, index) => ({
    ...question,
    id: `pinyin-question-${index}`,
    audioKey: getWordVoiceKey(question.word),
    fallbackText: question.word
  }));
}

function showQuizQuestion() {
  const question = state.questions[state.questionIndex];
  if (!question) {
    completeQuizGame();
    return;
  }

  const settings = QUIZ_SETTINGS[state.size] || QUIZ_SETTINGS[3];
  state.currentQuestion = question;
  state.options = createPinyinOptions(question, settings.optionCount);
  state.locked = false;

  quizMain.innerHTML = "";
  renderQuizMain(question);

  optionGrid.innerHTML = "";
  state.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.setAttribute("role", "listitem");
    button.setAttribute("aria-label", `拼音 ${option}（点我听）`);
    // Phase 3C — pinyin/listen 小耳朵图标（决策 2 A：HTML 结构化）
    // SVG 喇叭图标，hover 时摆动，提示"点我听"
    button.innerHTML =
      `<span class="option-text">${option}</span>` +
      `<svg class="option-ear" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">` +
        `<path d="M11 5L6 9H2v6h4l5 4V5z"/>` +
        `<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>` +
        `<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>` +
      `</svg>`;
    button.addEventListener("click", () => handleQuizOptionClick(option, button));
    optionGrid.appendChild(button);
  });

  setHint(getCurrentGame().startHint);
  playVoice(question.audioKey, question.fallbackText);
}

function renderQuizMain(question) {
  if (state.game === GAMES.listenCard.id) {
    const prompt = document.createElement("div");
    prompt.className = "listen-prompt";
    prompt.setAttribute("aria-label", "听音题目");

    const mark = document.createElement("span");
    mark.className = "listen-mark";
    mark.textContent = "听";

    const copy = document.createElement("span");
    copy.className = "listen-copy";
    copy.textContent = "听一听";

    prompt.appendChild(mark);
    prompt.appendChild(copy);
    quizMain.appendChild(prompt);
    return;
  }

  const word = document.createElement("div");
  word.className = "quiz-word";
  word.textContent = question.word;
  word.setAttribute("aria-label", `汉字 ${question.word}`);
  quizMain.appendChild(word);
}

function createPinyinOptions(question, optionCount) {
  const distractors = uniqueValues(PINYIN_WORDS.map((item) => item.pinyin))
    .filter((pinyin) => pinyin !== question.pinyin);
  return shuffle([question.pinyin, ...shuffle(distractors).slice(0, optionCount - 1)]);
}

function uniqueValues(items) {
  return [...new Set(items)];
}

function handleQuizOptionClick(option, button) {
  if (state.locked || !state.currentQuestion) return;

  if (option === state.currentQuestion.pinyin) {
    state.locked = true;
    // 统一状态类: .is-correct 触发 tile-correct-spring 弹簧 + 绿色背景
    button.classList.add("is-correct");
    state.matchedCount += 1;
    updateProgress();
    setHint("找对了");
    playVoiceVariant("prompt.correct", { replayable: false });  // 多邻国式随机赞美
    setMascotState("happy");
    playVoice("sfx.correct-ding", "", { replayable: false });
    // Phase 5C.2：pinyin / listen 答对 — 从 button 位置 burst 8 片彩屑
    // 主题色 hue: pinyinFriend=210（蓝）, listenCard=130（绿）
    const quizHue = state.game === GAMES.listenCard.id ? 130 : 210;
    const quizRect = button.getBoundingClientRect();
    spawnMiniConfetti(
      quizRect.left + quizRect.width / 2,
      quizRect.top + quizRect.height / 2,
      quizHue,
      8
    );

    window.setTimeout(() => {
      button.classList.remove("is-correct");
      state.questionIndex += 1;
      showQuizQuestion();
    }, 520);
    return;
  }

  // 统一状态类: .is-wrong 触发 tile-wrong-shake + 红色背景
  button.classList.add("is-wrong");
  setHint("再试一次");
  playVoiceVariant("prompt.tryAgain", { replayable: false });  // 多邻国式随机鼓励
  setMascotState("sad");
  playVoice("sfx.wrong-buzz", "", { replayable: false });
  // Phase 5C.2：pinyin / listen 答错 — 屏幕边缘红光闪
  flashError();

  window.setTimeout(() => {
    button.classList.remove("is-wrong");
  }, 520);
}

function completeQuizGame() {
  state.currentQuestion = null;
  state.options = [];
  state.locked = true;
  setHint("完成");
  stopTimer();
  const elapsedMs = getElapsedTime();
  const best = getBestRecord(state.size);
  const isNewRecord = !best || elapsedMs < best.elapsedMs;
  updateTimerDisplay(elapsedMs);
  if (completeTime) completeTime.textContent = `本次用时 ${formatTime(elapsedMs)}`;
  const showRecord = isNewRecord && state.matchedCount > 0;
  bestRecord.hidden = !showRecord;
  if (showRecord) {
    saveBestRecord(state.size, elapsedMs);
  }
  setMascotState("celebrate");  // 多邻国式 mascot 庆祝
  renderCompletePanel(state.game, state.matchedCount, state.totalTargets);
  // Phase 4C：pinyin / listen quiz 类 — 奖杯 + 星星
  renderTrophiesAndStars(state.matchedCount, state.totalTargets);
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
    spawnConfetti(28);  // 多邻国式撒花
  }, 260);
}

function markTile(tileId, className, enabled = true) {
  const button = getTileButton(tileId);
  if (!button) return;
  button.classList.toggle(className, enabled);
}

function getTileButton(tileId) {
  return board.querySelector(`[data-id="${tileId}"]`);
}

function updateTile(tileId) {
  const tile = state.tiles.find((item) => item.id === tileId);
  const button = getTileButton(tileId);
  if (!tile || !button) return;
  updateTileButton(button, tile);
}

function updateTileButton(button, tile) {
  const isMemory = state.game === GAMES.memory.id;
  const isHidden = isMemory && tile.kind === "word" && !tile.revealed && !tile.matched;
  button.classList.toggle("hidden-face", isHidden);
  button.classList.toggle("memory-matched", isMemory && tile.kind === "word" && tile.matched);
  // Phase 3D 决策 1：memory 翻开时加 .flipped（3D rotateY 翻牌）
  const isFlipped = isMemory && tile.kind === "word" && (tile.revealed || tile.matched) && !isHidden;
  button.classList.toggle("flipped", isFlipped);
  button.setAttribute("aria-label", getTileLabel(tile, isHidden));
  if (isMemory) {
    // 内部结构化 — 文字写到 .tile-front，.tile-back 是 "?"
    const front = button.querySelector(".tile-front");
    if (front) front.textContent = getTileText(tile, isHidden);
  } else {
    // match 模式：直接用 button textContent（无 DOM 结构）
    button.textContent = getTileText(tile, false);
  }
}

function getTileText(tile, isHidden) {
  if (tile.kind === "bonus") return "★";
  return isHidden ? "?" : tile.value;
}

function getTileLabel(tile, isHidden) {
  if (tile.kind === "bonus") return "奖励星星";
  return isHidden ? "未翻开的字牌" : tile.value;
}

function updateProgress() {
  progress.textContent = `${state.matchedCount} / ${state.totalTargets}`;
}

function resetTimer() {
  stopTimer();
  state.timerStarted = false;
  state.timerStartTime = null;
  updateTimerDisplay(0);
}

function startTimer() {
  if (state.timerStarted) return;
  state.timerStarted = true;
  state.timerStartTime = Date.now();
  updateTimerDisplay(0);
  state.timerInterval = window.setInterval(() => {
    updateTimerDisplay(getElapsedTime());
  }, 250);
}

function stopTimer() {
  if (state.timerInterval) {
    window.clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function getElapsedTime() {
  if (!state.timerStartTime) return 0;
  return Date.now() - state.timerStartTime;
}

function updateTimerDisplay(elapsedMs) {
  timer.textContent = formatTime(elapsedMs);
  // Phase 5A R-5A.3：计时器阈值变橙/红
  // 阈值：>30s warning（橙），>60s danger（红+脉动）
  const hudTimerEl = document.querySelector(".hud-timer");
  if (hudTimerEl) {
    hudTimerEl.classList.toggle("warning", elapsedMs > 30000 && elapsedMs <= 60000);
    hudTimerEl.classList.toggle("danger", elapsedMs > 60000);
  }
}

function formatTime(elapsedMs) {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function startMemoryPreview(size) {
  const seconds = MEMORY_SECONDS[size] || 10;
  let remaining = seconds;
  state.locked = true;
  setHint(`记住这些字：${String(remaining).padStart(2, "0")}`);
  timer.textContent = `00:${String(remaining).padStart(2, "0")}`;
  playVoiceVariant("prompt.remember", { replayable: false });  // 随机变体

  state.memoryCountdownInterval = window.setInterval(() => {
    remaining -= 1;
    setHint(`记住这些字：${String(Math.max(remaining, 0)).padStart(2, "0")}`);
    timer.textContent = `00:${String(Math.max(remaining, 0)).padStart(2, "0")}`;
  }, 1000);

  state.memoryRevealTimeout = window.setTimeout(() => {
    stopMemoryCountdown();
    hideMemoryTiles();
    state.phase = "playing";
    state.locked = false;
    state.selectedId = null;
    resetTimer();
    startTimer();
    setHint("翻出两个一样的字");
    playVoiceVariant("prompt.flip", { replayable: false });  // 随机变体
  }, seconds * 1000);
}

function stopMemoryCountdown() {
  if (state.memoryCountdownInterval) {
    window.clearInterval(state.memoryCountdownInterval);
    state.memoryCountdownInterval = null;
  }

  if (state.memoryRevealTimeout) {
    window.clearTimeout(state.memoryRevealTimeout);
    state.memoryRevealTimeout = null;
  }
}

function hideMemoryTiles() {
  state.tiles.forEach((tile) => {
    if (tile.kind === "word" && !tile.matched) {
      tile.revealed = false;
      updateTile(tile.id);
    }
  });
}

function getBestRecordKey(size) {
  return `${getCurrentGame().recordPrefix}_${size}`;
}

function getLegacyBestRecordKey(size) {
  return state.game === GAMES.match.id ? `beta_words_best_${size}` : null;
}

function getBestRecord(size) {
  const key = getBestRecordKey(size);

  try {
    const legacyKey = getLegacyBestRecordKey(size);
    const raw = window.localStorage.getItem(key) || (legacyKey ? window.localStorage.getItem(legacyKey) : null);
    if (!raw) return null;

    const record = JSON.parse(raw);
    if (!record || typeof record.elapsedMs !== "number" || typeof record.timestamp !== "number") {
      window.localStorage.removeItem(key);
      return null;
    }

    if (Date.now() - record.timestamp > BEST_RECORD_TTL) {
      window.localStorage.removeItem(key);
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

function saveBestRecord(size, elapsedMs) {
  try {
    window.localStorage.setItem(
      getBestRecordKey(size),
      JSON.stringify({
        elapsedMs,
        timestamp: Date.now()
      })
    );
  } catch {
    // Ignore storage errors so completing a board still works.
  }
}

function setHint(text) {
  hint.textContent = text;
}

function checkComplete() {
  // 看图比大小：按 compareCursor / compareAnswers 判定
  if (state.game === GAMES.compare.id) {
    const total = state.compareQuestions.length;
    const filledCount = state.compareAnswers.filter((c) => c !== null).length;
    if (filledCount < total) return;
    setHint("完成");
    stopTimer();
    const correct = state.compareCorrectCount;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsedMs = getElapsedTime();
    const best = getBestRecord(state.size);
    const isNewRecord = !best || elapsedMs < best.elapsedMs;
    updateTimerDisplay(elapsedMs);
    completeTime.textContent = `用时 ${formatTime(elapsedMs)}\n成功率 ${correct} / ${total}（${rate}%）`;
    const showRecord = isNewRecord && correct > 0;
    bestRecord.hidden = !showRecord;
    if (showRecord) {
      saveBestRecord(state.size, elapsedMs);
    }
    setMascotState("celebrate");
    renderCompletePanel(state.game, correct, total);
    renderTrophiesAndStars(correct, total);
    if (compareHost) compareHost.hidden = true;
    window.setTimeout(() => {
      completePanel.hidden = false;
      const next = nextSize(state.size);
      document.querySelector("#next-board").hidden = !next;
      spawnConfetti(28);
    }, 260);
    return;
  }

  // 看字识颜色：按 stroopCursor / stroopFilledColors 判定
  if (state.game === GAMES.stroopTrain.id) {
    const total = state.stroopQuestions.length;
    const filledCount = state.stroopFilledColors.filter((c) => c !== null).length;
    if (filledCount < total) return;
    setHint("完成");
    stopTimer();
    const correct = state.stroopCorrectCount;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const elapsedMs = getElapsedTime();
    const best = getBestRecord(state.size);
    const isNewRecord = !best || elapsedMs < best.elapsedMs;
    updateTimerDisplay(elapsedMs);
    completeTime.textContent = `用时 ${formatTime(elapsedMs)}\n成功率 ${correct} / ${total}（${rate}%）`;
    const showRecord = isNewRecord && correct > 0;
    bestRecord.hidden = !showRecord;
    if (showRecord) {
      saveBestRecord(state.size, elapsedMs);
    }
    setMascotState("celebrate");  // 多邻国式 mascot 庆祝
    renderCompletePanel(state.game, correct, total);
    // Phase 4C：stroop 推广 — 奖杯 + 星星
    renderTrophiesAndStars(correct, total);
    // 隐藏 stroop-host 避免与 complete-panel 同时出现造成 823 > 640 溢出
    if (stroopHost) stroopHost.hidden = true;
    window.setTimeout(() => {
      completePanel.hidden = false;
      // 与其他游戏一致：3→4→…→7 提供“下一关”（7 到头隐藏），新棋盘重新生成颜色+字序
      const next = nextSize(state.size);
      document.querySelector("#next-board").hidden = !next;
      spawnConfetti(28);  // 多邻国式撒花
    }, 260);
    return;
  }

  const allDone = state.tiles.every((tile) => tile.kind !== "word" || tile.matched);
  if (!allDone) return;

  setHint("完成");
  stopTimer();
  const elapsedMs = getElapsedTime();
  const best = getBestRecord(state.size);
  const isNewRecord = !best || elapsedMs < best.elapsedMs;
  updateTimerDisplay(elapsedMs);
  if (completeTime) completeTime.textContent = `本次用时 ${formatTime(elapsedMs)}`;
  const showRecord = isNewRecord && state.matchedCount > 0;
  bestRecord.hidden = !showRecord;
  if (showRecord) {
    saveBestRecord(state.size, elapsedMs);
  }
  setMascotState("celebrate");  // 多邻国式 mascot 庆祝
  renderCompletePanel(state.game, state.matchedCount, state.totalTargets);
  // Phase 4B：match / memory 通用 — 奖杯 + 星星（状态类已包含）
  renderTrophiesAndStars(state.matchedCount, state.totalTargets);
  window.setTimeout(() => {
    completePanel.hidden = false;
    const next = nextSize(state.size);
    document.querySelector("#next-board").hidden = !next;
    spawnConfetti(28);  // 多邻国式撒花
  }, 260);
}

// ============================================================
// 看字识颜色 (stroopTrain) 游戏逻辑
// ============================================================
//
// 棋盘 n×n：棋子是带颜色的颜色字（红黄蓝绿紫橙），颜色与字义错位形成 Stroop 干扰。
// 待选 n×n：初始完全空，底层田字格背景作为草稿纸；玩家依次填入棋盘每一格的
//           “字颜色”。
// 颜色条：一行 6 个色字 + 颜色背景的可点击按钮。
//
// 流程：
//   1. 按棋盘 (0,0) → (n-1,n-1) row-major 顺序逐格处理。
//   2. 当前 cursor 格可点；其他棋盘格 + 未 cursor 的待选格不可点。
//   3. 点棋盘 cursor 格 → 该格点亮为“待选色”状态。
//   4. 点颜色条某色 → 填入待选 cursor 格 → 系统判定：
//      - 一致（待选色 == 字实际颜色）→ 待选格变绿 + 读汉字读音 + 读英文读音
//      - 不一致 → 待选格变红
//   5. 判定后 cursor 推进一格，不可反悔。
//   6. 全部判定完成后显示成功率（X / N + %），隐藏“下一关”按钮。

function startStroopGame(size) {
  const settings = STROOP_SETTINGS[size] || STROOP_SETTINGS[3];
  const boardSize = settings.boardSize;
  const colorCount = settings.colorCount;
  const total = boardSize * boardSize;

  state.size = size;
  state.stroopQuestions = createStroopQuestions(total, colorCount);
  state.stroopFilledColors = new Array(total).fill(null);
  state.stroopCursor = 0;
  state.stroopCorrectCount = 0;
  state.stroopLocked = false;
  state.totalTargets = total;
  state.matchedCount = 0;

  // 渲染三个区：棋盘 + 待选 + 颜色条
  if (stroopBoard) stroopBoard.style.setProperty("--size", boardSize);
  if (stroopSelect) stroopSelect.style.setProperty("--size", boardSize);
  renderStroopBoard();
  renderStroopColorBar();
  scheduleStroopNotes();
  updateProgress();
  setHint(getCurrentGame().startHint);
  playVoiceVariant("prompt.start", { replayable: false });
  startTimer();
}

// 生成 Stroop 题目。
// 棋盘 total 格，每格一个颜色字 + 1 个错位颜色。
// 关键约束：colorIdx !== wordIdx（字色 ≠ 字义），否则不构成 Stroop 冲突。
function createStroopQuestions(total, colorCount) {
  const colors = STROOP_COLORS.slice(0, colorCount);
  const questions = [];
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / Math.sqrt(total));
    const col = i % Math.sqrt(total);
    const wordIdx = Math.floor(Math.random() * colors.length);
    let colorIdx = Math.floor(Math.random() * colors.length);
    let attempts = 0;
    while (colorIdx === wordIdx && attempts < 8) {
      colorIdx = Math.floor(Math.random() * colors.length);
      attempts += 1;
    }
    if (colorIdx === wordIdx) {
      colorIdx = (wordIdx + 1) % colors.length;
    }
    const wordColor = colors[wordIdx];
    const displayColor = colors[colorIdx];
    questions.push({
      id: `stroop-cell-${i}`,
      row,
      col,
      word: wordColor.name,        // 字本身（颜色字，如「红」）
      wordEnglish: wordColor.english, // 字英文名（"red"）
      colorName: displayColor.name,  // 字实际显示的颜色（可能与字义不同）
      colorCss: displayColor.css
    });
  }
  return questions;
}

// Phase stroop-sliding: 棋盘改为 DDR 风格 track (单条 lane, hit zone 在中间)
function renderStroopBoard() {
  if (!stroopBoard) return;
  // 清理旧 SlidingNote instances
  if (state.stroopNoteInstances) {
    state.stroopNoteInstances.forEach(n => n.destroy());
  }
  state.stroopNoteInstances = [];
  // 清理旧 marquee engines (保留向后兼容)
  stroopBoard.querySelectorAll(".stroop-cell").forEach((cell) => {
    if (cell._marqueeEngine) cell._marqueeEngine.stop();
  });
  // track 模式: 单一横向 lane, hit zone 已在 CSS ::before 标记
  stroopBoard.innerHTML = "";
  stroopBoard.className = "stroop-track";
}

// Phase stroop-sliding: 调度所有 SlidingNote 按节奏 spawn
function scheduleStroopNotes() {
  if (!stroopBoard) return;
  const config = getStroopSlidingConfig(state.size);

  state.stroopNoteInstances = state.stroopQuestions.map((q, idx) => {
    const note = new SlidingNote({
      question: q,
      trackElement: stroopBoard,
      duration: config.duration,
      delay: idx * config.interval,
      onHit: (note) => {
        state.stroopCorrectCount = (state.stroopCorrectCount || 0) + 1;
        state.matchedCount = (state.matchedCount || 0) + 1;
        setMascotState("happy");
        playVoice("sfx.correct-ding", "", { replayable: false });
        // 从 note 位置 burst 8 片红色小彩屑
        const rect = note.element.getBoundingClientRect();
        spawnMiniConfetti(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          0,  // stroop 主题色 hue
          8
        );
        // Plan C: hit 后 400ms 淡出 + destroy, 防止 hit zone 堆叠
        if (note.element) note.element.classList.add("fading-out");
        setTimeout(() => note.destroy(), 400);
      },
      onMiss: (note) => {
        setMascotState("sad");
        playVoice("sfx.wrong-buzz", "", { replayable: false });
        flashError();
        // Plan C: miss 后 400ms 淡出 + destroy
        if (note.element) note.element.classList.add("fading-out");
        setTimeout(() => note.destroy(), 400);
      }
    });
    note.start();
    return note;
  });

  // 调度完成检查 (最后一个 note 滑出后)
  const totalTime = (state.stroopQuestions.length - 1) * config.interval + config.duration + 500;
  setTimeout(() => {
    checkStroopAllDone();
  }, totalTime);
}

// Phase stroop-sliding: 所有 note 都 done → 弹完成面板
function checkStroopAllDone() {
  if (!state.stroopNoteInstances || !state.stroopNoteInstances.length) return;

  const allDone = state.stroopNoteInstances.every((n) =>
    n.state === "done" || n.state === "hit" || n.state === "miss" || n.state === "missed"
  );

  if (!allDone) return;

  stopTimer();
  const total = state.stroopQuestions.length;
  const correct = state.stroopCorrectCount || 0;
  const elapsedMs = getElapsedTime();
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
  const best = getBestRecord(state.size);
  const isNewRecord = !best || elapsedMs < best.elapsedMs;

  updateTimerDisplay(elapsedMs);
  if (completeTime) {
    completeTime.textContent = `用时 ${formatTime(elapsedMs)}\n成功率 ${correct} / ${total}（${rate}%）`;
  }

  const showRecord = isNewRecord && correct > 0;
  bestRecord.hidden = !showRecord;
  if (showRecord) {
    saveBestRecord(state.size, elapsedMs);
  }

  setMascotState("celebrate");
  renderCompletePanel(state.game, correct, total);
  renderTrophiesAndStars(correct, total);
  if (stroopHost) stroopHost.hidden = true;

  const next = nextSize(state.size);
  const nb = document.querySelector("#next-board");
  if (nb) nb.hidden = !next;
  spawnConfetti(28);

  setTimeout(() => {
    completePanel.hidden = false;
  }, 260);
}

// 渲染待选 n×n：初始完全空，底层米字格背景
function renderStroopSelectPanel() {
  if (!stroopSelect) return;
  stroopSelect.innerHTML = "";
  state.stroopQuestions.forEach((q, idx) => {
    const cell = document.createElement("div");
    cell.className = "stroop-select-cell";
    cell.dataset.idx = String(idx);
    cell.setAttribute("role", "gridcell");
    stroopSelect.appendChild(cell);
  });
}

// 渲染颜色条：一行 N 个颜色按钮（colorCount 个）
function renderStroopColorBar() {
  if (!stroopPalette) return;
  stroopPalette.innerHTML = "";
  const settings = STROOP_SETTINGS[state.size] || STROOP_SETTINGS[3];
  const colors = STROOP_COLORS.slice(0, settings.colorCount);
  colors.forEach((c) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "stroop-color-btn";
    btn.style.setProperty("--btn-color", c.css);
    btn.textContent = c.name;
    btn.dataset.colorName = c.name;
    btn.setAttribute("aria-label", `选颜色 ${c.name}（${c.english}）`);
    btn.addEventListener("click", () => applyStroopColor(state.stroopCursor, c.name));
    stroopPalette.appendChild(btn);
  });
}

// 点亮 cursor 所在棋盘 + 待选格，其他格变淡不可点
function setStroopActive() {
  if (!stroopBoard || !stroopSelect) return;
  const cursor = state.stroopCursor;
  const total = state.stroopQuestions.length;

  // 重置 (统一状态类 .is-active / .is-disabled)
  stroopBoard.querySelectorAll(".stroop-cell").forEach((el) => {
    el.classList.remove("is-active", "is-disabled");
  });
  stroopSelect.querySelectorAll(".stroop-select-cell").forEach((el) => {
    el.classList.remove("is-active", "is-disabled");
  });

  if (cursor >= total) return;

  // cursor 格子点亮 (统一状态类)
  const boardCell = stroopBoard.querySelector(`[data-idx="${cursor}"]`);
  if (boardCell) boardCell.classList.add("is-active");
  const selectCell = stroopSelect.querySelector(`[data-idx="${cursor}"]`);
  if (selectCell) selectCell.classList.add("is-active");

  // 其他格子变淡 + 不可点 (统一状态类 .is-disabled)
  stroopBoard.querySelectorAll(".stroop-cell").forEach((el) => {
    if (el.dataset.idx !== String(cursor)) el.classList.add("is-disabled");
  });
  stroopSelect.querySelectorAll(".stroop-select-cell").forEach((el) => {
    if (el.dataset.idx !== String(cursor)) el.classList.add("is-disabled");
  });
}

// ============================================================
// Phase 8A — 成语填空 idiomFill（静态展示 + 候选字池 + 滚筒）
// Phase 8B: 看图比大小
// ============================================================
// 看图比大小 N×N: 每题两组 emoji, 玩家点 多/少/一样
// 难度 (per COMPARE_SETTINGS[size]):
//   - 3×3: 数量 1-4, 差 ≥ 2 (无陷阱)
//   - 4×4: 数量 1-6, 差 ≥ 1 (= 1/3)
//   - 5×5: 数量 1-7, 差 ≥ 1 (= 1/4)
//   - 6×6: 数量 1-9, 差 ≥ 1 (= 1/4, 相邻数陷阱)
//
// 流程:
//   1. cursor 顺序逐题
//   2. 点 多/少/一样 按钮 → 判定对错
//   3. 对 → 绿闪 + 推进 cursor; 错 → 红闪 + 正确答案高亮 800ms + 推进

// shuffle: Fisher-Yates
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 生成混合 emoji 组 (L4 用): 拆成 2 个不同 emoji, 随机混合顺序
function generateMixedGroup(total) {
  const split = 1 + Math.floor(Math.random() * (total - 1));
  const count1 = split;
  const count2 = total - split;
  const emoji1 = COMPARE_EMOJIS[Math.floor(Math.random() * COMPARE_EMOJIS.length)];
  let emoji2;
  do {
    emoji2 = COMPARE_EMOJIS[Math.floor(Math.random() * COMPARE_EMOJIS.length)];
  } while (emoji2 === emoji1);
  const arr = [];
  for (let i = 0; i < count1; i++) arr.push(emoji1);
  for (let i = 0; i < count2; i++) arr.push(emoji2);
  return shuffleArray(arr).join('');
}

function createCompareQuestions(total, size) {
  const config = COMPARE_LEVELS[size] || COMPARE_LEVELS[3];
  const questions = [];
  for (let i = 0; i < total; i++) {
    const emoji = COMPARE_EMOJIS[Math.floor(Math.random() * COMPARE_EMOJIS.length)];
    const equalAllowed = config.equalChance > 0 && Math.random() < config.equalChance;
    let countA, countB;
    if (equalAllowed) {
      countA = 1 + Math.floor(Math.random() * config.maxCount);
      countB = countA;
    } else {
      countA = 1 + Math.floor(Math.random() * config.maxCount);
      let attempts = 0;
      do {
        countB = 1 + Math.floor(Math.random() * config.maxCount);
        attempts++;
      } while (Math.abs(countA - countB) < config.minDiff && attempts < 8);
    }
    let answer;
    if (countA > countB) answer = "more";
    else if (countA < countB) answer = "less";
    else answer = "equal";

    let groupA, groupB;
    if (config.mixedEmoji) {
      groupA = generateMixedGroup(countA);
      groupB = generateMixedGroup(countB);
    } else {
      const emoji = COMPARE_EMOJIS[Math.floor(Math.random() * COMPARE_EMOJIS.length)];
      groupA = emoji.repeat(countA);
      groupB = emoji.repeat(countB);
    }

    questions.push({
      id: `compare-${i}`,
      idx: i,
      groupA,
      groupB,
      countA,
      countB,
      answer,
      mixed: config.mixedEmoji
    });
  }
  return questions;
}

function renderCompareBoard() {
  if (!compareQuestion || !compareButtons) return;
  compareQuestion.innerHTML = "";
  compareButtons.innerHTML = "";

  const q = state.compareQuestions[state.compareCursor];
  if (!q) return;

  // 答题状态（每次新题重置）
  let numA = null;
  let numB = null;
  let symbol = null;
  const updateSubmit = () => {
    const submitBtn = compareButtons.querySelector(".compare-submit");
    if (!submitBtn) return;
    const ready = numA !== null && numB !== null && symbol !== null;
    submitBtn.disabled = !ready;
  };

  // 主人 2026-08-16 23:11 反馈: 数字框位置不对，要放在图形框下面
  // 改垂直栈布局: emoji 一行 → 数字一行 → 符号一行
  const area = document.createElement("div");
  area.className = "compare-area";

  // Row 1: 左 emoji + 右 emoji（上下主题、主并排）
  const emojisRow = document.createElement("div");
  emojisRow.className = "compare-row compare-row-emojis";

  const left = document.createElement("div");
  left.className = "compare-group";
  left.setAttribute("aria-label", "左边一组");
  left.dataset.side = "A";
  // emoji 拆 span + Array.from() 避免 surrogate pair 拆开
  left.innerHTML = Array.from(q.groupA).map((e) => `<span class="compare-emoji">${e}</span>`).join("");

  const right = document.createElement("div");
  right.className = "compare-group";
  right.setAttribute("aria-label", "右边一组");
  right.dataset.side = "B";
  right.innerHTML = Array.from(q.groupB).map((e) => `<span class="compare-emoji">${e}</span>`).join("");

  emojisRow.appendChild(left);
  emojisRow.appendChild(right);
  area.appendChild(emojisRow);

  // Row 2: 左数字输入 + 右数字输入（紧贴 emoji 下面）
  const inputsRow = document.createElement("div");
  inputsRow.className = "compare-row compare-row-inputs";

  const inputA = document.createElement("input");
  inputA.type = "number";
  inputA.className = "compare-num-input";
  inputA.dataset.side = "A";
  inputA.min = "0";
  inputA.max = "20";
  inputA.inputMode = "numeric";
  inputA.placeholder = "填";
  inputA.setAttribute("aria-label", "左边有几个");

  const inputB = document.createElement("input");
  inputB.type = "number";
  inputB.className = "compare-num-input";
  inputB.dataset.side = "B";
  inputB.min = "0";
  inputB.max = "20";
  inputB.inputMode = "numeric";
  inputB.placeholder = "填";
  inputB.setAttribute("aria-label", "右边有几个");

  inputsRow.appendChild(inputA);
  inputsRow.appendChild(inputB);
  area.appendChild(inputsRow);

  // Row 3: 3 个符号按钮（水平排列）
  const symbolsRow = document.createElement("div");
  symbolsRow.className = "compare-row compare-row-symbols";

  const symbolsBox = document.createElement("div");
  symbolsBox.className = "compare-symbols";
  const symbolDefs = [
    { symbol: ">", value: "more",  label: "大于号" },
    { symbol: "<", value: "less",  label: "小于号" },
    { symbol: "=", value: "equal", label: "等于号" },
  ];
  const symbolButtons = [];
  symbolDefs.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "compare-symbol-btn";
    btn.textContent = d.symbol;
    btn.dataset.value = d.value;
    btn.dataset.symbol = d.symbol;
    btn.setAttribute("aria-label", `选 ${d.label}`);
    btn.addEventListener("click", () => {
      symbolButtons.forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      symbol = d.value;
      playVoice("compare.symbol", d.label);  // TTS 读符号名
      updateSubmit();
    });
    symbolsBox.appendChild(btn);
    symbolButtons.push(btn);
  });
  symbolsRow.appendChild(symbolsBox);
  area.appendChild(symbolsRow);

  compareQuestion.appendChild(area);

  // Twemoji 兑底：把 unicode emoji 换成 PNG SVG（手机 100% 能看，不依赖系统字体）
  if (window.twemoji) {
    try {
      twemoji.parse(compareQuestion, { folder: 'svg', ext: '.svg' });
    } catch (e) {
      console.warn('twemoji parse failed:', e);
    }
  }

  // 数字输入事件：读出当前数字
  const onNumInput = (side) => (ev) => {
    const v = parseInt(ev.target.value, 10);
    if (Number.isFinite(v) && v >= 0 && v <= 99) {
      if (side === "A") numA = v;
      else numB = v;
      // TTS 读数字（zh-CN Web Speech）
      playVoice("compare.numeral", String(v));
    } else {
      if (side === "A") numA = null;
      else numB = null;
    }
    updateSubmit();
  };
  inputA.addEventListener("input", onNumInput("A"));
  inputB.addEventListener("input", onNumInput("B"));

  // 提交按钮（仍在 compare-buttons toolbar 里）
  const submit = document.createElement("button");
  submit.type = "button";
  submit.className = "compare-submit";
  submit.textContent = "提交";
  submit.disabled = true;
  submit.addEventListener("click", () => {
    if (numA === null || numB === null || symbol === null) return;
    applyCompareAnswer({ numA, numB, symbol });
  });
  compareButtons.appendChild(submit);

  // 入题提示：让小孩先数
  playVoice("compare.intro", "数一数左边有几个，右边有几个");
}

function startCompareGame(size) {
  const config = COMPARE_LEVELS[size] || COMPARE_LEVELS[3];
  const total = config.questionCount;

  state.size = size;
  state.game = GAMES.compare.id;
  state.compareQuestions = createCompareQuestions(total, size);
  state.compareAnswers = new Array(total).fill(null);
  state.compareCursor = 0;
  state.compareCorrectCount = 0;
  state.totalTargets = total;
  state.matchedCount = 0;

  renderCompareBoard();
  updateProgress();
  setHint(getCurrentGame().startHint);
  playVoiceVariant("prompt.start", { replayable: false });
  startTimer();
}

function applyCompareAnswer({ numA, numB, symbol }) {
  const q = state.compareQuestions[state.compareCursor];
  if (!q) return;

  // 锁定所有控件（反馈期间防止重复提交）
  const lockAll = () => {
    compareQuestion.querySelectorAll(".compare-num-input, .compare-symbol-btn").forEach((el) => {
      el.disabled = true;
      el.classList.add("is-locked");
    });
    const submit = compareButtons.querySelector(".compare-submit");
    if (submit) submit.disabled = true;
  };
  const unlockAll = () => {
    compareQuestion.querySelectorAll(".compare-num-input, .compare-symbol-btn").forEach((el) => {
      el.disabled = false;
      el.classList.remove("is-locked");
      el.classList.remove("is-wrong");
    });
    // 符号按钮如果是错选，清掉选中态让小孩重选
    compareQuestion.querySelectorAll(".compare-symbol-btn.is-selected").forEach((b) => {
      if (b.classList.contains("is-wrong")) b.classList.remove("is-selected");
    });
    const submit = compareButtons.querySelector(".compare-submit");
    if (submit) submit.disabled = false;
  };
  lockAll();

  // 第一阶段：验证数字（小孩数对了才能进入符号判断）
  const numAOk = numA === q.countA;
  const numBOk = numB === q.countB;
  if (!numAOk || !numBOk) {
    setMascotState("sad");
    playVoice("compare.hint.count-again", "再数一数");  // TTS fallback
    flashError();
    if (!numAOk) compareQuestion.querySelector('.compare-num-input[data-side="A"]')?.classList.add("is-wrong");
    if (!numBOk) compareQuestion.querySelector('.compare-num-input[data-side="B"]')?.classList.add("is-wrong");
    setTimeout(unlockAll, 1500);
    return;  // 不跳下一题，让小孩重新数
  }

  // 第二阶段：验证符号
  if (symbol !== q.answer) {
    setMascotState("sad");
    playVoice("compare.hint.symbol-wrong", "符号选错了，再看看哪个大");  // TTS fallback
    flashError();
    const wrongBtn = compareQuestion.querySelector(`.compare-symbol-btn[data-value="${symbol}"]`);
    if (wrongBtn) wrongBtn.classList.add("is-wrong");
    setTimeout(unlockAll, 1500);
    return;  // 不跳下一题，让小孩重选
  }

  // 全对
  state.compareAnswers[state.compareCursor] = q.answer;
  state.compareCorrectCount += 1;
  state.matchedCount += 1;
  setMascotState("happy");
  playVoice("sfx.correct-ding", "", { replayable: false });
  // TTS 读出比较结果
  const correctText = q.answer === "more"
    ? `${q.countA} 比 ${q.countB} 多`
    : q.answer === "less"
    ? `${q.countA} 比 ${q.countB} 少`
    : `${q.countA} 和 ${q.countB} 一样多`;
  setTimeout(() => playVoice("compare.correct", correctText), 400);

  const rect = compareQuestion.getBoundingClientRect();
  spawnMiniConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 0, 8);
  compareQuestion.querySelectorAll(".compare-symbol-btn.is-selected").forEach((b) =>
    b.classList.add("correct-flash")
  );

  // 主人 2026-08-14 11:56 反馈: 进度一直 0/9 不动
  // 修: cursor += 1 后立刻刷进度
  state.compareCursor += 1;
  state.matchedCount = state.compareCursor;
  updateProgress();

  // 主人 2026-08-14 07:53 反馈: 加停顿, 展示对错效果
  const delay = 1400;  // 答对多等 400ms 让 TTS 读完比较结果
  setTimeout(() => {
    if (state.compareCursor >= state.compareQuestions.length) {
      checkComplete();
      return;
    }
    renderCompareBoard();
  }, delay);
}

// 父文档：docs/phase-plans/phase-8-idiom-fill.md
// 数据：IDIOMS（40 个 3 年级成语）+ IDIOM_SETTINGS（5 档难度）
// 状态机：Phase 8B 接交互（点 slot + 点候选字 + 退回）
// ============================================================

function startIdiomFillGame(size) {
  // Bug 修复: 切到 idiomFill 前清掉 compare 上次游戏状态
  if (compareHost) compareHost.hidden = true;
  const settings = IDIOM_SETTINGS[size];
  // 从 40 个成语里随机选 idiomCount 个
  const pickedIdioms = shuffle([...IDIOMS]).slice(0, settings.idiomCount);
  // 给每个成语随机选 blankPerIdiom 个 blanks
  pickedIdioms.forEach((idiom) => {
    const candidates = idiom.blankSlots;
    const blankCount = Math.min(settings.blankPerIdiom, candidates.length);
    idiom.selectedBlanks = shuffle(candidates).slice(0, blankCount).sort((a, b) => a - b);
  });
  state.idioms = pickedIdioms;
  state.idiomBlanks = Object.fromEntries(pickedIdioms.map((i) => [i.id, i.selectedBlanks]));
  state.idiomFilled = {};
  state.idiomCompleted = {};
  state.idiomCurrentIdx = 0;
  state.idiomSelectedSlot = null;
  state.idiomTotalCompleted = 0;
  // 候选字池：把所有成语的被扣字打乱 + 干扰字（从已选成语未扣字里抽，保持纯净）
  const blanksChars = pickedIdioms.flatMap((idiom) => idiom.selectedBlanks.map((idx) => idiom.value[idx]));
  const distractorsPool = pickedIdioms.flatMap((idiom) =>
    idiom.value.split("").filter((_, idx) => !idiom.selectedBlanks.includes(idx))
  );
  const uniqueDistractors = [...new Set(distractorsPool)];
  const distractorCount = size <= 4 ? 1 : 2;
  const distractors = shuffle(uniqueDistractors).slice(0, distractorCount);
  state.idiomCandidates = shuffle([...blanksChars, ...distractors]);
  // 计时器：从进入游戏开始（GAME_SOP §7，stroop 模式）
  startTimer();
  renderIdiomFill();
}

// 成语行渲染（从 state 重建 .idiom-rows 容器 — 拖拽后 + 状态恢复时复用，idempotent）
// 主人 2026-08-09 20:17 反馈：滚筒效果打回重做，密码锁 3D rotateX 旋转木马方向
//   每个 idiom-row 在 3D 空间绕 X 轴定位（rotateX(angle) translateZ(radius)）
//   focusIdiom = 旋转整个 .idiom-rows 容器让目标 row 转到最前面
const ROTATE_ANGLE = 35;  // 每行间隔 35°（4-7 行总弧度 105°-210°）
const ROTATE_RADIUS = 100; // 旋转半径（缩小：避免 row 视觉过大撑满棋盘框，主人 2026-08-09 20:33 反馈）

function renderIdiomRows() {
  if (!idiomTrack) return;
  let rowsContainer = idiomTrack.querySelector(".idiom-rows");
  if (!rowsContainer) {
    rowsContainer = document.createElement("div");
    rowsContainer.className = "idiom-rows";
    idiomTrack.innerHTML = "";
    idiomTrack.appendChild(rowsContainer);
  }
  rowsContainer.innerHTML = "";
  state.idioms.forEach((idiom, idx) => {
    const row = document.createElement("div");
    row.className = "idiom-row" + (idx === 0 ? " is-current" : " is-next");
    row.dataset.idiomId = idiom.id;
    row.dataset.idx = String(idx);
    // 3D 旋转木马：每个 row 在 3D 空间绕 X 轴定位（rotateX + translateZ）
    // 通过 CSS 变量传 angle/radius，让 CSS transform 用 var() 读取
    row.style.setProperty("--angle", `${idx * ROTATE_ANGLE}deg`);
    row.style.setProperty("--radius", `${ROTATE_RADIUS}px`);
    row.style.transform = `translate(-50%, -50%) rotateX(${idx * ROTATE_ANGLE}deg) translateZ(${ROTATE_RADIUS}px)`;
    // 不再用 HTML5 drag API（主人 2026-08-09 20:05 反馈：桌面+移动都没生效）
    //   原因 1：HTML5 drag 在移动端（touch 设备）默认不触发
    //   原因 2：滚筒 .idiom-row 有 transform: scale(0.7/0.74)，让 drop target 定位错乱
    // 改用 Pointer Events（桌面+移动统一支持，详见下面 idiomDragState）
    row.setAttribute("aria-label", `成语 ${idiom.value}`);
    // 4 个槽位（恢复已填字 + 完成状态 — 拖拽后保留）
    const slotsRow = document.createElement("div");
    slotsRow.className = "idiom-slots";
    for (let slotIdx = 0; slotIdx < 4; slotIdx++) {
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "idiom-slot";
      slot.dataset.idiomId = idiom.id;
      slot.dataset.slotIdx = String(slotIdx);
      const isBlank = idiom.selectedBlanks.includes(slotIdx);
      const filledChar = state.idiomFilled[idiom.id]?.[slotIdx];
      if (isBlank) {
        slot.classList.add("is-blank");
        slot.setAttribute("aria-label", "空格，点这里选字");
        if (filledChar) {
          // 恢复已填字（拖拽后从 state.idiomFilled 还原 DOM）
          slot.textContent = filledChar;
          slot.classList.remove("is-blank");
          slot.classList.add("is-filled");
        } else {
          slot.textContent = "";
        }
      } else {
        slot.classList.add("is-fixed");
        slot.textContent = idiom.value[slotIdx];
        slot.setAttribute("aria-label", `${idiom.value[slotIdx]} 字`);
      }
      slot.addEventListener("click", () => handleIdiomSlotClick(idiom.id, slotIdx));
      slotsRow.appendChild(slot);
    }
    row.appendChild(slotsRow);
    if (idiom.hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "idiom-hint";
      hintEl.textContent = idiom.hint;
      row.appendChild(hintEl);
    }
    if (state.idiomCompleted[idiom.id]) row.classList.add("is-complete");
    // Pointer Events 拖拽（桌面 + 移动统一支持）
    row.addEventListener("pointerdown", handleIdiomPointerDown);
    // 点击成语切换焦点（主人 2026-08-09 20:33 反馈：在棋盘里选择成语）
    // Pointer Events 拖拽期间（>5px）不会触发 click，5px 内点击触发 → focusIdiomAndMaybeSelect
    row.addEventListener("click", () => handleIdiomRowClick(idiom.id));
    rowsContainer.appendChild(row);
  });
}

// ============================================================
// Phase 8B — 成语拖拽（Pointer Events：桌面 + 移动统一支持）
// 主人 2026-08-09 20:05 反馈：HTML5 drag API 在手机和电脑都没生效
// 原因 1：移动端 touch 设备不原生触发 dragstart
// 原因 2：滚筒 .idiom-row 有 transform (scale 0.7/0.74)，drop target 坐标错乱
// 解决：用 pointerdown/pointermove/pointerup + 5px 阈值（区分 click vs drag）
// ============================================================

let idiomDragState = null;
const DRAG_THRESHOLD_PX = 5; // 移动超过 5px 才进入 drag mode（区分 click vs drag）

function handleIdiomPointerDown(e) {
  // 只在主按钮触发（左键 / 单指）
  if (e.button !== undefined && e.button !== 0) return;
  // 用户点 slot（而不是 row 空白处）→ 不进入 drag 模式，让 fill/slot 逻辑正常
  if (e.target.classList.contains("idiom-slot")) return;
  const row = e.currentTarget;
  const rect = row.getBoundingClientRect();
  idiomDragState = {
    phase: "pending", // pending → dragging
    row,
    startY: e.clientY,
    startX: e.clientX,
    rowTop: rect.top,
    rowLeft: rect.left,
    rowHeight: rect.height,
    rowWidth: rect.width,
    fromIdx: parseInt(row.dataset.idx, 10),
    pointerId: e.pointerId,
    targetIdx: parseInt(row.dataset.idx, 10),
    targetAfter: false,
  };
  // 在 window 上监听后续事件（指针移出 row 仍能继续追踪）
  window.addEventListener("pointermove", handleIdiomPointerMove);
  window.addEventListener("pointerup", handleIdiomPointerUp);
  window.addEventListener("pointercancel", handleIdiomPointerCancel);
  e.preventDefault(); // 阻止默认（text selection）
}

function handleIdiomPointerMove(e) {
  if (!idiomDragState || idiomDragState.phase === "idle") return;
  const dy = e.clientY - idiomDragState.startY;
  const dx = e.clientX - idiomDragState.startX;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // 阈值内不进入 drag（让 click 事件继续 → 正常填字）
  if (idiomDragState.phase === "pending" && dist < DRAG_THRESHOLD_PX) return;
  if (idiomDragState.phase === "pending") {
    // 进入 dragging：fixed 定位 + 视觉跟随手指/鼠标
    idiomDragState.phase = "dragging";
    const row = idiomDragState.row;
    row.classList.add("is-dragging");
    row.style.position = "fixed";
    row.style.width = idiomDragState.rowWidth + "px";
    row.style.left = idiomDragState.rowLeft + "px";
    row.style.top = idiomDragState.rowTop + "px";
    row.style.zIndex = "1000";
    row.style.pointerEvents = "none"; // 跟随时不再触发 row 自己事件
    // 拖拽时清空 row 的 3D rotateX 变换（防止旋转木马旋转 + 拖拽定位叠加错乱）
    row.style.transform = "none";
    try {
      idiomDragState.row.setPointerCapture(e.pointerId);
    } catch (err) {
      // iOS Safari 可能抛 InvalidStateError
    }
  }
  // 视觉跟随
  const row = idiomDragState.row;
  row.style.left = (idiomDragState.rowLeft + dx) + "px";
  row.style.top = (idiomDragState.rowTop + dy) + "px";
  // 更新 drop target 指示
  updateIdiomDropTarget(e.clientY);
}

function updateIdiomDropTarget(clientY) {
  if (!idiomDragState) return;
  const rows = Array.from(idiomTrack.querySelectorAll(".idiom-row:not(.is-dragging)"));
  let targetIdx = idiomDragState.fromIdx;
  let targetAfter = false;
  for (let i = 0; i < rows.length; i++) {
    const rRect = rows[i].getBoundingClientRect();
    if (clientY >= rRect.top + rRect.height / 2) {
      targetIdx = parseInt(rows[i].dataset.idx, 10);
      targetAfter = true;
    } else {
      break;
    }
  }
  rows.forEach((r) => r.classList.remove("is-drop-target-before", "is-drop-target-after"));
  const targetRow = rows.find((r) => parseInt(r.dataset.idx, 10) === targetIdx);
  if (targetRow) {
    if (targetAfter) targetRow.classList.add("is-drop-target-after");
    else targetRow.classList.add("is-drop-target-before");
  }
  idiomDragState.targetIdx = targetIdx;
  idiomDragState.targetAfter = targetAfter;
}

function handleIdiomPointerUp(e) {
  if (!idiomDragState) return;
  const row = idiomDragState.row;
  if (idiomDragState.phase === "dragging") {
    // 清理拖起 row 的 inline style（包括 transform — 渲染时会从 CSS 变量重新生成 3D rotateX）
    row.style.position = "";
    row.style.width = "";
    row.style.left = "";
    row.style.top = "";
    row.style.zIndex = "";
    row.style.pointerEvents = "";
    row.style.transform = "";
    row.classList.remove("is-dragging");
    idiomTrack.querySelectorAll(".idiom-row").forEach((r) => r.classList.remove("is-drop-target-before", "is-drop-target-after"));
    // 计算最终插入 idx（targetAfter = 在 targetIdx 之后插入）
    let insertIdx = idiomDragState.targetIdx + (idiomDragState.targetAfter ? 1 : 0);
    // 移除原位置
    const [moved] = state.idioms.splice(idiomDragState.fromIdx, 1);
    // 如果 fromIdx < insertIdx，splice 已移除 fromIdx，insertIdx 需要 -1
    if (idiomDragState.fromIdx < insertIdx) insertIdx--;
    state.idioms.splice(insertIdx, 0, moved);
    // 重新渲染（从 state 恢复 idiomFilled + idiomCompleted + 重新绑定 Pointer 事件）
    const prevSelectedSlot = state.idiomSelectedSlot ? { ...state.idiomSelectedSlot } : null;
    renderIdiomRows();
    // 恢复焦点成语 = prevSelectedSlot 所在成语 or 当前 idiomCurrentIdx 所在成语
    const idiomIdx = prevSelectedSlot
      ? state.idioms.findIndex((i) => i.id === prevSelectedSlot.idiomId)
      : state.idiomCurrentIdx;
    const focusIdx = idiomIdx >= 0 ? idiomIdx : 0;
    state.idiomCurrentIdx = focusIdx;
    focusIdiom(focusIdx);
    // 恢复 selectedSlot 的 .is-selected
    if (prevSelectedSlot) {
      const slotEl = idiomTrack.querySelector(
        `.idiom-slot[data-idiom-id="${prevSelectedSlot.idiomId}"][data-slot-idx="${prevSelectedSlot.slotIdx}"]`
      );
      if (slotEl && slotEl.classList.contains("is-blank")) {
        slotEl.classList.add("is-selected");
      }
    }
  }
  // else: phase=pending（点击未移动 < 5px）— 让 click 事件正常触发（不阻止）
  cleanupIdiomDragListeners();
  idiomDragState = null;
}

function handleIdiomPointerCancel(e) {
  if (!idiomDragState) return;
  const row = idiomDragState.row;
  row.style.position = "";
  row.style.width = "";
  row.style.left = "";
  row.style.top = "";
  row.style.zIndex = "";
  row.style.pointerEvents = "";
  row.style.transform = "";
  row.classList.remove("is-dragging");
  idiomTrack.querySelectorAll(".idiom-row").forEach((r) => r.classList.remove("is-drop-target-before", "is-drop-target-after"));
  cleanupIdiomDragListeners();
  idiomDragState = null;
}

function cleanupIdiomDragListeners() {
  window.removeEventListener("pointermove", handleIdiomPointerMove);
  window.removeEventListener("pointerup", handleIdiomPointerUp);
  window.removeEventListener("pointercancel", handleIdiomPointerCancel);
}

function renderIdiomFill() {
  if (!idiomHost || !idiomTrack || !idiomPool) return;
  idiomHost.hidden = false;
  // 滚筒渲染（slot-machine + draggable 拖拽）
  renderIdiomRows();
  // 候选字池渲染（底部）
  idiomPool.innerHTML = "";
  state.idiomCandidates.forEach((char, idx) => {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "candidate-tile";
    tile.dataset.idx = String(idx);
    tile.dataset.char = char;
    tile.textContent = char;
    tile.setAttribute("aria-label", `候选字 ${char}`);
    tile.addEventListener("click", () => handleIdiomCandidateClick(idx));
    idiomPool.appendChild(tile);
  });
  // 更新 HUD 进度
  const progressEl = document.querySelector("#progress");
  if (progressEl) progressEl.textContent = `0 / ${state.idioms.length}`;
  // 滚筒初始居中第一个成语 + 自动指针指向第一个空
  requestAnimationFrame(() => {
    focusIdiom(0);
    setHint(state.idioms[0].hint);
    selectFirstBlank(state.idioms[0].id);
  });
}

// ============================================================
// Phase 8B — 成语填空交互（两段式：先选空格，再选字）
// 7-05 bug 防护：state.idiomSelectedSlot 单一来源 + 10px 行间距 + .is-selected class 复用
// ============================================================

// 滚筒切换：3D rotateX 让 idx 行转到最前面（密码锁旋转木马效果）
function focusIdiom(idx) {
  if (!idiomTrack) return;
  const rowsContainer = idiomTrack.querySelector(".idiom-rows");
  const rows = idiomTrack.querySelectorAll(".idiom-row");
  if (!rowsContainer || !rows[idx]) return;
  state.idiomCurrentIdx = idx;
  // 旋转整个 .idiom-rows 容器，让 idx 对应 row 的 rotateX 从 idx*ANGLE 变成 0（前面）
  // 计算：idx row 当前 rotateX = idx * ANGLE，要把它变成 0，需要 container.rotateX(-idx * ANGLE)
  rowsContainer.style.transform = `rotateX(${-idx * ROTATE_ANGLE}deg)`;
  // class 更新：当前 is-current，其他 is-passed/is-next（CSS 控制 opacity + filter）
  rows.forEach((row, i) => {
    row.classList.toggle("is-current", i === idx);
    row.classList.toggle("is-passed", i < idx);
    row.classList.toggle("is-next", i > idx);
  });
}

// 滚筒切换 + 指针逻辑（主人 2026-08-09 20:33 反馈）
//   - 新成语未填完 → 自动设置指针到第一个空字（selectFirstBlank）
//   - 新成语已填完 → 不动字框指针（保留原 selectedSlot 指向原成语）
// 主人 2026-08-09 20:47 反馈：动画时长根据成语状态决定
//   - 未填完成语 → baseDurationMs（默认 1000ms，每个成语滑动 1s）
//   - 已填完成语 → 500ms 快速跳过（跳过 0.5s）
// idiomScrolling 锁：动画期间忽略新切换（wheel/click 不叠加、不跨格）
let idiomScrolling = false;
function focusIdiomAndMaybeSelect(idx, baseDurationMs = 1000) {
  const idiom = state.idioms[idx];
  if (!idiom) return;
  if (idiomScrolling) return; // 动画进行中，忽略新切换（防止叠加滚多格）
  // 已完成成语：0.5s 快速跳过；未完成：1s 标准滑动
  const durationMs = state.idiomCompleted[idiom.id] ? 500 : baseDurationMs;
  idiomScrolling = true;
  const rowsContainer = idiomTrack.querySelector(".idiom-rows");
  if (rowsContainer) {
    rowsContainer.style.transition = `transform ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }
  focusIdiom(idx);
  setHint(idiom.hint);
  // 已完成的成语不动指针（保留原 selectedSlot）
  if (!state.idiomCompleted[idiom.id]) {
    selectFirstBlank(idiom.id);
  }
  // 动画完成解锁（允许下一次切换）
  setTimeout(() => { idiomScrolling = false; }, durationMs);
}

// 手动点击 idiom-row 切换焦点成语（主人 2026-08-09 20:33 反馈：在棋盘里选择成语）
function handleIdiomRowClick(idiomId) {
  const idx = state.idioms.findIndex((i) => i.id === idiomId);
  if (idx < 0 || idx === state.idiomCurrentIdx) return;
  focusIdiomAndMaybeSelect(idx);
}

// 鼠标滚轮（中键滚动）切换成语 — 主人 2026-08-09 20:47 验收标准
// 滚下 → 下一个成语；滚上 → 上一个成语
// 每次 1 个成语 + 1s 平滑动画（已完成成语 0.5s 快速跳过）
// idiomScrolling 锁：动画期间忽略 wheel（避免叠加，动画完成自动解锁）
function handleIdiomWheel(e) {
  e.preventDefault();
  if (idiomScrolling) return; // 动画进行中，忽略连续 wheel
  const direction = e.deltaY > 0 ? 1 : -1;
  const newIdx = state.idiomCurrentIdx + direction;
  if (newIdx < 0 || newIdx >= state.idioms.length) return;
  focusIdiomAndMaybeSelect(newIdx, 1000);
}

// 自动指针：选中指定成语的第一个未填空格（主人 2026-08-09 UX 反馈：自动指向第一个空，保留两段式能力）
function selectFirstBlank(idiomId) {
  const idiom = state.idioms.find((i) => i.id === idiomId);
  if (!idiom) return;
  // 找第一个 selectedBlanks 里还没填的位置
  const nextSlotIdx = idiom.selectedBlanks.find((slotIdx) => !state.idiomFilled[idiomId]?.[slotIdx]);
  if (nextSlotIdx === undefined) return; // 全部填完（checkIdiomComplete 会接管）
  // 清除旧选中
  if (state.idiomSelectedSlot) {
    const prevEl = idiomTrack.querySelector(
      `.idiom-slot[data-idiom-id="${state.idiomSelectedSlot.idiomId}"][data-slot-idx="${state.idiomSelectedSlot.slotIdx}"]`
    );
    if (prevEl) prevEl.classList.remove("is-selected");
  }
  // 设置新选中
  state.idiomSelectedSlot = { idiomId, slotIdx: nextSlotIdx };
  const slotEl = idiomTrack.querySelector(
    `.idiom-slot[data-idiom-id="${idiomId}"][data-slot-idx="${nextSlotIdx}"]`
  );
  if (slotEl) slotEl.classList.add("is-selected");
}

// 两段式第一步：点空格（选中 / 取消 / 退字）
function handleIdiomSlotClick(idiomId, slotIdx) {
  const idiom = state.idioms.find((i) => i.id === idiomId);
  if (!idiom) return;
  if (state.idiomCompleted[idiomId]) return; // 已完成成语不可再点
  const slotEl = idiomTrack.querySelector(
    `.idiom-slot[data-idiom-id="${idiomId}"][data-slot-idx="${slotIdx}"]`
  );
  if (!slotEl) return;
  const isBlank = idiom.selectedBlanks.includes(slotIdx);
  if (!isBlank) return; // 实字不可点

  // 情况 1：已填字 → 退回候选字池 + 自动指向第一个未填空
  if (state.idiomFilled[idiomId] && state.idiomFilled[idiomId][slotIdx]) {
    const char = state.idiomFilled[idiomId][slotIdx];
    delete state.idiomFilled[idiomId][slotIdx];
    slotEl.textContent = "";
    slotEl.classList.remove("is-filled", "is-selected");
    slotEl.classList.add("is-blank");
    restoreCandidateToPool(char);
    state.idiomSelectedSlot = null;
    selectFirstBlank(idiomId);
    setHint("再选一个空格");
    return;
  }

  // 情况 2：该 slot 已是选中 → 取消选中
  if (
    state.idiomSelectedSlot &&
    state.idiomSelectedSlot.idiomId === idiomId &&
    state.idiomSelectedSlot.slotIdx === slotIdx
  ) {
    state.idiomSelectedSlot = null;
    slotEl.classList.remove("is-selected");
    setHint("点下面的字");
    return;
  }

  // 情况 3：切换选中（清除旧选中）
  if (state.idiomSelectedSlot) {
    const prevEl = idiomTrack.querySelector(
      `.idiom-slot[data-idiom-id="${state.idiomSelectedSlot.idiomId}"][data-slot-idx="${state.idiomSelectedSlot.slotIdx}"]`
    );
    if (prevEl) prevEl.classList.remove("is-selected");
  }

  state.idiomSelectedSlot = { idiomId, slotIdx };
  slotEl.classList.add("is-selected");
  setHint("点下面的字");
}

// 候选字点击处理（两段式第二步：填字 / 无选中时抖动提示）
function handleIdiomCandidateClick(idx) {
  const char = state.idiomCandidates[idx];
  if (!char) return; // 已被用掉

  // 无 selectedSlot → 抖动候选字池 + TTS 提示先点空格
  if (!state.idiomSelectedSlot) {
    const tileEl = idiomPool.querySelector(`.candidate-tile[data-idx="${idx}"]`);
    if (tileEl) {
      tileEl.classList.add("is-shake");
      setTimeout(() => tileEl.classList.remove("is-shake"), 400);
    }
    setHint("先点一个空格");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    return;
  }

  const { idiomId, slotIdx } = state.idiomSelectedSlot;
  const idiom = state.idioms.find((i) => i.id === idiomId);
  if (!idiom) return;
  const slotEl = idiomTrack.querySelector(
    `.idiom-slot[data-idiom-id="${idiomId}"][data-slot-idx="${slotIdx}"]`
  );
  if (!slotEl) return;

  // ★ 答案校验（主人 2026-08-09 22:43 发现 bug）：检查 char 是不是 slot 期望的字
  // 否则候选字池里的干扰字（已选成语未扣字）会被误接受为正确
  const expectedChar = idiom.value[slotIdx];
  if (char !== expectedChar) {
    // 答错反馈：屏幕红光闪 + 候选字抖动 + TTS "再想想" + 保持 selectedSlot
    flashError();
    const tileEl = idiomPool.querySelector(`.candidate-tile[data-idx="${idx}"]`);
    if (tileEl) {
      tileEl.classList.add("is-shake");
      setTimeout(() => tileEl.classList.remove("is-shake"), 400);
    }
    setHint("再想想");
    playVoiceVariant("prompt.tryAgain", { replayable: false });
    return; // 不填字、不动 selectedSlot，让用户重新选
  }

  // 填字（已通过答案校验）
  if (!state.idiomFilled[idiomId]) state.idiomFilled[idiomId] = {};
  state.idiomFilled[idiomId][slotIdx] = char;
  slotEl.textContent = char;
  slotEl.classList.remove("is-blank", "is-selected");
  slotEl.classList.add("is-filled");

  // 候选字池标记已用（置灰不可点）
  state.idiomCandidates[idx] = null;
  const tileEl = idiomPool.querySelector(`.candidate-tile[data-idx="${idx}"]`);
  if (tileEl) {
    tileEl.classList.add("is-used");
    tileEl.disabled = true;
  }
  state.idiomSelectedSlot = null;

  // TTS 读该字 + 小彩屑（青绿 hue 174）
  playVoice(getWordVoiceKey(char), char, { replayable: false });
  const rect = slotEl.getBoundingClientRect();
  spawnMiniConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 174, 6);

  // 自动指针：填字成功后指向下一个空（保留两段式：用户可点别处切换）
  selectFirstBlank(idiomId);

  // 选字时滚筒自动切回焦点成语（让用户看到字填进哪；主人 2026-08-09 UX 要求）
  const idiomIdx = state.idioms.findIndex((i) => i.id === idiomId);
  if (idiomIdx >= 0 && idiomIdx !== state.idiomCurrentIdx) {
    focusIdiom(idiomIdx);
  }

  // 检查成语是否完成
  checkIdiomComplete(idiomId);
}

// 退字：把字放回候选字池第一个空位
function restoreCandidateToPool(char) {
  const idx = state.idiomCandidates.findIndex((c) => c === null);
  if (idx >= 0) {
    state.idiomCandidates[idx] = char;
    const tileEl = idiomPool.querySelector(`.candidate-tile[data-idx="${idx}"]`);
    if (tileEl) {
      tileEl.textContent = char;
      tileEl.classList.remove("is-used");
      tileEl.disabled = false;
      tileEl.setAttribute("aria-label", `候选字 ${char}`);
    }
  }
}

// 完成判定：所有 blanks 填满 + 填的字都正确 → 标记完成 + TTS 读成语 + 自动推进
// ★ 主人 2026-08-09 22:43 反馈：之前只检查"填满"，不检查"正确"——加 allCorrect 保险检查
function checkIdiomComplete(idiomId) {
  const idiom = state.idioms.find((i) => i.id === idiomId);
  if (!idiom) return;
  const filled = state.idiomFilled[idiomId] || {};
  // 检查 1：所有 blanks 都填了
  const allFilled = idiom.selectedBlanks.every((slotIdx) => filled[slotIdx]);
  if (!allFilled) return;
  // 检查 2：填的字都等于成语对应位置的字（保险：理论上 handleIdiomCandidateClick 已校验）
  const allCorrect = idiom.selectedBlanks.every((slotIdx) => filled[slotIdx] === idiom.value[slotIdx]);
  if (!allCorrect) return;

  state.idiomCompleted[idiomId] = true;
  state.idiomTotalCompleted = Object.keys(state.idiomCompleted).length;

  // 更新 HUD 进度
  const progressEl = document.querySelector("#progress");
  if (progressEl) progressEl.textContent = `${state.idiomTotalCompleted} / ${state.idioms.length}`;

  // row 完成高亮 + mascot happy + 大彩屑
  const rowEl = idiomTrack.querySelector(`.idiom-row[data-idiom-id="${idiomId}"]`);
  if (rowEl) rowEl.classList.add("is-complete");
  setMascotState("happy");
  const rect = rowEl ? rowEl.getBoundingClientRect() : null;
  if (rect) spawnMiniConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 174, 12);

  // TTS 读整个成语（延迟让填字音先播完）
  setTimeout(() => {
    playIdiomVoice(idiom);
  }, 500);

  // 自动推进滚筒（延迟让 TTS 播完，主人 7-04 要求：完成自动 advanceToNextIdiom）
  setTimeout(() => {
    advanceToNextIdiom();
  }, 2200);
}

// TTS 读整个成语（AUDIO_MAP 无成语音频 → 浏览器 SpeechSynthesis 兜底）
function playIdiomVoice(idiom) {
  if (typeof speechSynthesis !== "undefined") {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(idiom.value);
    u.lang = "zh-CN";
    u.rate = 0.82;
    u.pitch = 1.08;
    speechSynthesis.speak(u);
  }
}

// 找下一个未完成成语并切换滚筒（找不到则从头找，全完成则结束）
function advanceToNextIdiom() {
  const currentIdx = state.idiomCurrentIdx;
  for (let i = currentIdx + 1; i < state.idioms.length; i++) {
    if (!state.idiomCompleted[state.idioms[i].id]) {
      focusIdiomAndMaybeSelect(i);
      return;
    }
  }
  for (let i = 0; i < currentIdx; i++) {
    if (!state.idiomCompleted[state.idioms[i].id]) {
      focusIdiomAndMaybeSelect(i);
      return;
    }
  }
  completeIdiomFillGame();
}

// 全部成语完成 → 完成面板（沿用 Phase 4B 奖杯 + 星星 + best record）
function completeIdiomFillGame() {
  stopTimer();
  const total = state.idioms.length;
  const completed = state.idiomTotalCompleted;
  renderTrophiesAndStars(completed, total);
  const elapsed = getElapsedTime();
  if (completeTime) {
    completeTime.textContent = `用时 ${formatTime(elapsed)}\n成功率 ${completed} / ${total}（${Math.round((completed / total) * 100)}%）`;
  }
  saveBestRecord(state.size, elapsed);
  completePanel.hidden = false;
  bestRecord.hidden = true;
  setMascotState("celebrate");
  spawnConfetti(24);
  renderCompletePanel(state.game, state.idiomTotalCompleted, state.idioms.length);
  window.bgmController?.stop();
}

// 棋盘点击：仅 cursor 格接受点击 → 高亮 cursor（视觉反馈）
function handleStroopCellClick(idx) {
  if (state.stroopLocked) return;
  if (idx !== state.stroopCursor) return; // 顺序保护
  // 点击棋盘格本身不填色，只是提示玩家“该填这格了”。
  // 填色动作在玩家点颜色条后才发生。
  // 点 cursor 格不需额外状态切换，但可以闪一下反馈。
}

// Phase stroop-sliding: 颜色条点击 → 找 hit zone 内的 active note → selectColor
function applyStroopColor(idx, colorName) {
  if (state.stroopLocked) return;

  // 找 active note (在 hit zone [0.3, 0.7] 之间)
  const activeNote = state.stroopNoteInstances && state.stroopNoteInstances.find(
    (n) => n.state === "active"
  );

  if (activeNote) {
    activeNote.selectColor(colorName);
  }

  // TTS 反馈
  if (activeNote) {
    playStroopFeedback(
      colorName === activeNote.question.colorName,
      colorName,
      activeNote.question
    );
  } else {
    // 没 active note (点早了或晚了) — 仅读出色名
    speak(colorName);
  }

  state.stroopLocked = true;
  setTimeout(() => {
    state.stroopLocked = false;
  }, 100);
  return;  // 跳过旧的 cursor-based 逻辑

  // === 旧的 cursor-based 逻辑 (保留向后兼容, 实际不会执行) ===
  if (false && idx !== state.stroopCursor) return;
  if (false && idx >= state.stroopQuestions.length) return;

  const question = state.stroopQuestions[idx];
  const isCorrect = colorName === question.colorName;
  state.stroopFilledColors[idx] = colorName;

  // 在待选格填色 + 标对错 (统一状态类 .is-correct / .is-wrong)
  const selectCell = stroopSelect.querySelector(`[data-idx="${idx}"]`);
  if (selectCell) {
    const colorMeta = STROOP_COLORS.find((c) => c.name === colorName);
    if (colorMeta) selectCell.style.setProperty("--cell-color", colorMeta.css);
    selectCell.textContent = colorName;
    selectCell.classList.remove("is-active");
    selectCell.classList.add(isCorrect ? "is-correct" : "is-wrong");

    // 多邻国式反馈: 视觉 + mascot + 音效
    if (isCorrect) {
      setMascotState("happy");
      playVoice("sfx.correct-ding", "", { replayable: false });
      // Phase 5C.2：stroop 填对 — 从 selectCell 位置 burst 8 片红色小彩屑
      // stroop 主题色 hue=0（红）
      const stroopRect = selectCell.getBoundingClientRect();
      spawnMiniConfetti(
        stroopRect.left + stroopRect.width / 2,
        stroopRect.top + stroopRect.height / 2,
        0,  // stroop 主题色 hue
        8
      );
    } else {
      setMascotState("sad");
      playVoice("sfx.wrong-buzz", "", { replayable: false });
      // Phase 5C.2：stroop 填错 — 屏幕边缘红光闪
      flashError();
    }
  }

  // Phase stroop-marquee: 答对停 engine 锁文字, 答错暂停 800ms 提示正确答案
  const boardCell = stroopBoard.querySelector(`[data-idx="${idx}"]`);
  if (boardCell && boardCell._marqueeEngine) {
    const boardWordEl = boardCell.querySelector(".stroop-cell-word");
    if (isCorrect) {
      boardCell._marqueeEngine.stop();
      if (boardWordEl) boardWordEl.textContent = question.colorName;
    } else {
      boardCell._marqueeEngine.pause();
      if (boardWordEl) boardWordEl.textContent = question.colorName;
      window.setTimeout(() => {
        if (boardCell._marqueeEngine) boardCell._marqueeEngine.resume();
      }, 800);
    }
  }

  if (isCorrect) {
    state.stroopCorrectCount += 1;
    state.matchedCount += 1;
  }

  // 读音反馈 (颜色名 TTS, 双语强化)
  playStroopFeedback(isCorrect, colorName, question);

  // 短期锁定避免双击
  state.stroopLocked = true;
  window.setTimeout(() => {
    state.stroopLocked = false;
    state.stroopCursor += 1;
    if (state.stroopCursor >= state.stroopQuestions.length) {
      updateProgress();
      checkComplete();
      return;
    }
    // setStroopActive removed (Phase stroop-sliding 不用 cursor)
  }, 320);
}

// 读音反馈：正确 → 中文颜色名；错误 → 仅错误提示
function playStroopFeedback(isCorrect, colorName, question) {
  if (isCorrect) {
    // 中文颜色名（确认答对了 → "蓝色"），强化“颜色”不是“字”
    speak(colorName);
  } else {
    setHint(`是${question.colorName}，不是${colorName}`);
    playVoiceVariant("prompt.tryAgain", { replayable: false });  // 多邻国式随机鼓励
  }
}

function getCurrentGame() {
  return GAMES[state.game] || GAMES.match;
}

function isCurrentQuizGame() {
  return state.game === GAMES.pinyinFriend.id || state.game === GAMES.listenCard.id;
}

function playReplayVoice() {
  const key = state.replayVoiceKey || state.lastVoiceKey;
  const text = state.replayText || state.lastSpoken;
  playVoice(key, text, { replayable: false });
}

function playVoice(key, fallbackText, options = {}) {
  state.lastVoiceKey = key || null;
  state.lastSpoken = fallbackText;
  if (options.replayable !== false) {
    state.replayVoiceKey = key || null;
    state.replayText = fallbackText;
  }

  // Phase 7B: TTS 触发前 duck BGM（让字音不与 BGM 互挤）
  window.bgmController?.duck();

  const src = key ? AUDIO_MAP[key] : null;
  if (!src) {
    speak(fallbackText);
    return;
  }

  stopCurrentAudio();
  window.speechSynthesis?.cancel();

  currentAudio = new Audio(src);
  currentAudio.play().catch(() => {
    speak(fallbackText);
  });
  // TTS 结束时 restore BGM（audio ended + speechSynthesis onend + bgmController 兑底 timer 三路兑底）
  currentAudio.addEventListener("ended", () => window.bgmController?.restore(), { once: true });
}

function stopCurrentAudio() {
  if (!currentAudio) return;
  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

function getWordVoiceKey(word) {
  const codePoints = Array.from(word)
    .map((char) => `u${char.codePointAt(0).toString(16)}`)
    .join("-");
  return `word.${codePoints}`;
}

// === Voice picker：跨平台优先列表 + localStorage 记忆 ===
// 优先级：localStorage 用户选定的 → 跨平台童声/年轻女声 → 任何 zh
const VOICE_PREFER = [
  /Tingting/i,            // macOS 婷婷 (童声友好女声)
  /Yaoyao/i,              // Win Microsoft 瑶瑶 (年轻女声)
  /Microsoft Huihui/i,    // Win Microsoft 慧慧 (成熟女声)
  /Mei-Jia/i,             // macOS 美佳 (台湾普通话)
  /Microsoft HanHan/i,    // Win Microsoft 涵涵 (台湾)
  /Microsoft Kangkang/i,  // Win Microsoft 康康 (男声)
];
const STORAGE_VOICE_KEY = "beta_words_voice_pref";
const VOICE_SAMPLE = "准备好啦，太棒了！";

// 仅过滤中文普通话 zh-CN (不含 zh-TW/zh-HK 等台湾粤语)
function listChineseVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => {
      const lang = (v.lang || "").toLowerCase();
      return lang === "zh-cn" || lang.startsWith("zh-cn-");
    });
}

// 推断 voice 平台 / 类型 / 语言区 / 品质。返回 { kind, subtitle }
// subtitle 拼接: "平台 · 语言区[ · 品质]"  例: "macOS 内置 · 大陆普通话 · 自然音"
function detectQuality(name) {
  if (/\bNatural\b/i.test(name)) return "自然音";
  if (/\bNeural\b/i.test(name)) return "Neural";
  if (/\bEnhanced\b/i.test(name)) return "增强";
  if (/\bPremium\b/i.test(name)) return "高级";
  if (/\bStandard\b/i.test(name)) return "标准";
  return "";
}

function detectRegion(lang) {
  const l = (lang || "").toLowerCase();
  if (l === "zh-cn" || l.startsWith("zh-cn-")) return "大陆普通话";
  if (l.startsWith("zh-tw")) return "台湾国语";
  if (l.startsWith("zh-hk")) return "粤语";
  return "普通话";
}

function describeVoice(v) {
  let platform;
  if (!v.localService) platform = "在线服务";
  else if (/Microsoft/i.test(v.name)) platform = "Windows 系统";
  else platform = "macOS 内置";
  const region = detectRegion(v.lang);
  const quality = detectQuality(v.name);
  let subtitle = `${platform} · ${region}`;
  if (quality) subtitle += ` · ${quality}`;
  return { kind: !v.localService ? "online" : "local", subtitle };
}

// 精简 voice.name 方便显示（去 Microsoft 前缀、China 后缀）
function cleanVoiceName(name) {
  const m = name.match(/^Microsoft\s+(.+?)\s*-\s*Chinese/);
  if (m) return m[1];
  return name;
}

function pickBestVoice() {
  const voices = listChineseVoices();
  if (!voices.length) return null;
  // 1. localStorage 选定的
  try {
    const saved = localStorage.getItem(STORAGE_VOICE_KEY);
    if (saved) {
      const v = voices.find((x) => x.name === saved);
      if (v) return v;
    }
  } catch (_) {}
  // 2. 偏好列表第一个匹配的
  for (const re of VOICE_PREFER) {
    const v = voices.find((x) => re.test(x.name));
    if (v) return v;
  }
  // 3. 第一个中文
  return voices[0];
}

function buildVoiceRow(voice, savedName) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "voice-option";
  row.setAttribute("role", "listitem");
  if (savedName === voice.name) row.classList.add("is-selected");

  const title = document.createElement("span");
  title.className = "voice-name";
  title.textContent = cleanVoiceName(voice.name);

  const sub = document.createElement("span");
  sub.className = "voice-sub";
  sub.textContent = describeVoice(voice).subtitle;

  row.append(title, sub);
  row.addEventListener("click", () => previewAndSelectVoice(voice, row));
  return row;
}

function buildVoiceSection(label, voices, savedName) {
  const section = document.createElement("div");
  section.className = "voice-section";
  const h = document.createElement("h3");
  h.className = "voice-section-title";
  h.textContent = label;
  section.appendChild(h);
  voices.forEach((v) => section.appendChild(buildVoiceRow(v, savedName)));
  return section;
}

function openVoicePicker() {
  const modal = document.getElementById("voice-picker");
  if (!modal) return;
  const list = document.getElementById("voice-list");
  list.innerHTML = "";
  const voices = listChineseVoices();
  if (!voices.length) {
    const empty = document.createElement("p");
    empty.className = "voice-modal-hint";
    empty.textContent = "浏览器里没有找到普通话声音，请检查系统设置。";
    list.appendChild(empty);
  } else {
    const saved = (() => { try { return localStorage.getItem(STORAGE_VOICE_KEY); } catch (_) { return null; } })();
    const local = voices.filter((v) => v.localService);
    const online = voices.filter((v) => !v.localService);
    if (local.length) list.appendChild(buildVoiceSection("本地", local, saved));
    if (online.length) list.appendChild(buildVoiceSection("在线", online, saved));
  }
  modal.hidden = false;
}

function previewAndSelectVoice(voice, row) {
  try { localStorage.setItem(STORAGE_VOICE_KEY, voice.name); } catch (_) {}
  document.querySelectorAll(".voice-option.is-selected").forEach((el) => el.classList.remove("is-selected"));
  row.classList.add("is-selected");
  // 试听示例句
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(VOICE_SAMPLE);
  u.lang = voice.lang || "zh-CN";
  u.voice = voice;
  u.rate = 0.95;
  u.pitch = 1.1;
  window.speechSynthesis.speak(u);
}

function closeVoicePicker() {
  const modal = document.getElementById("voice-picker");
  if (modal) modal.hidden = true;
  window.speechSynthesis.cancel();
}

// 确保 voices 列表加载完（chromium 异步）
function waitForVoices(timeoutMs = 1500) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve([]);
    if (window.speechSynthesis.getVoices().length) return resolve(window.speechSynthesis.getVoices());
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.speechSynthesis.removeEventListener?.("voiceschanged", finish);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", finish);
    setTimeout(finish, timeoutMs);
  });
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  stopCurrentAudio();
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.95;
  utterance.pitch = 1.12;
  const picked = pickBestVoice();
  if (picked) utterance.voice = picked;
  // Phase 7B: TTS 结束 restore BGM（与 bgmController 兑底 timer 一起组成三路兑底）
  utterance.onend = () => window.bgmController?.restore();
  utterance.onerror = () => window.bgmController?.restore();
  window.speechSynthesis.speak(utterance);
}

function nextSize(current) {
  const sizes = [3, 4, 5, 6, 7];
  const idx = sizes.indexOf(current);
  return idx >= 0 && idx < sizes.length - 1 ? sizes[idx + 1] : null;
}

function shuffle(items) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[randomIndex]] = [result[randomIndex], result[index]];
  }
  return result;
}

// =====================================================
// Phase 7B: BGM Controller — 6 首 BGM 生命周期管理
// =====================================================
// 设计要点：
// - 进 play 自动播放对应游戏 BGM（默认音量 30%）
// - 离 play fadeOut 300ms 后 pause + currentTime=0
// - TTS 触发时 duck 到 10%（250ms ramp），结束恢复 30%（500ms ramp）
// - 首次用户 click 解锁 autoplay
// - Voice picker 加 toggle，记住 localStorage.beta_words_bgm_pref
// - audio 元素加载/播放失败静默不影响游戏
(function initBgmController() {
  const audios = {
    lobby: document.getElementById("bgm-lobby"),
    match: document.getElementById("bgm-match"),
    memory: document.getElementById("bgm-memory"),
    pinyinFriend: document.getElementById("bgm-pinyinFriend"),
    listenCard: document.getElementById("bgm-listenCard"),
    stroopTrain: document.getElementById("bgm-stroopTrain"),
  };
  // 读用户偏好（默认开）
  const pref = (() => {
    try { return localStorage.getItem("beta_words_bgm_pref"); } catch { return null; }
  })();
  let enabled = pref === null ? true : pref === "on";
  let audioUnlocked = false;
  let currentGameId = null;
  let volume = 0.3;
  let ducked = false;
  let duckTimer = null;
  let fadeTimer = null;

  function ramp(toVolume, ms, onDone) {
    if (fadeTimer) { clearInterval(fadeTimer); fadeTimer = null; }
    const from = volume;
    if (!currentGameId || !audios[currentGameId]) { volume = toVolume; onDone && onDone(); return; }
    const start = performance.now();
    fadeTimer = setInterval(() => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / ms);
      const v = from + (toVolume - from) * t;
      if (currentGameId && audios[currentGameId]) audios[currentGameId].volume = Math.max(0, Math.min(1, v));
      if (t >= 1) {
        clearInterval(fadeTimer); fadeTimer = null;
        volume = toVolume;
        onDone && onDone();
      }
    }, 16);
  }

  function clearDuckTimer() {
    if (duckTimer) { clearTimeout(duckTimer); duckTimer = null; }
  }

  function syncToggleUI() {
    const btn = document.getElementById("bgm-toggle");
    if (!btn) return;
    btn.setAttribute("aria-checked", enabled ? "true" : "false");
  }

  const api = {
    unlock() {
      if (audioUnlocked) return;
      audioUnlocked = true;
      // 预热：尝试 play+pause 让浏览器标记为"用户已交互"，后续 audio.play() 不会再被拒
      Object.values(audios).forEach((a) => {
        if (!a) return;
        try { a.play().then(() => a.pause()).catch(() => {}); } catch {}
      });
    },

    playForGame(gameId) {
      if (!enabled) return;
      const a = audios[gameId];
      if (!a) return;
      if (currentGameId === gameId) return; // 已播同一首
      // 停旧
      if (currentGameId && audios[currentGameId] && currentGameId !== gameId) {
        const oldA = audios[currentGameId];
        const oldFrom = oldA.volume;
        const start = performance.now();
        const fadeOld = setInterval(() => {
          const t = Math.min(1, (performance.now() - start) / 200);
          oldA.volume = oldFrom * (1 - t);
          if (t >= 1) {
            clearInterval(fadeOld);
            oldA.pause();
            oldA.currentTime = 0;
          }
        }, 16);
      }
      currentGameId = gameId;
      a.volume = 0;
      a.play().catch(() => { /* autoplay 拒绝或音频加载失败，静默 */ });
      if (audioUnlocked) {
        ramp(0.3, 300);
      } else {
        // 未解锁：设个低音量等下次 unlock 后再 ramp 上去
        volume = 0.15;
        a.volume = 0.15;
      }
    },

    stop() {
      clearDuckTimer();
      ducked = false;
      if (currentGameId && audios[currentGameId]) {
        const id = currentGameId;
        ramp(0, 300, () => {
          // 只停自己（避免 race：ramp 期间被 startForGame 切走时不要 pause 新的）
          if (currentGameId === id && audios[id]) {
            audios[id].pause();
            audios[id].currentTime = 0;
          }
        });
      }
      currentGameId = null;
    },

    duck() {
      if (!currentGameId || !audios[currentGameId] || ducked) return;
      ducked = true;
      ramp(0.1, 250);
      clearDuckTimer();
      // 兜底：8s 后强制 restore（防 speechSynthesis onend / audio ended 不触发）
      duckTimer = setTimeout(() => api.restore(), 8000);
    },

    restore() {
      clearDuckTimer();
      if (!ducked) return;
      ducked = false;
      ramp(0.3, 500);
    },

    toggle(on) {
      enabled = !!on;
      try { localStorage.setItem("beta_words_bgm_pref", enabled ? "on" : "off"); } catch {}
      syncToggleUI();
      if (!enabled) api.stop();
    },

    isEnabled() { return enabled; },

    // 兜底：如果 TTS 触发了但 audio 元素不存在，至少要 restore
    safeRestore() { api.restore(); },
  };

  window.bgmController = api;

  // 全局 click 委托：首次任意 click 解锁 autoplay
  document.addEventListener("click", function unlockOnce() {
    api.unlock();
    document.removeEventListener("click", unlockOnce);
  }, { once: true });

  // voice picker 关闭后，BGM toggle 状态可能改过 — 不需要额外处理
  // 初始化 toggle UI（读偏好后立即同步）
  syncToggleUI();

  // 绑定 toggle 按钮 click
  const toggleBtn = document.getElementById("bgm-toggle");
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      api.toggle(!api.isEnabled());
    });
  }
})();
