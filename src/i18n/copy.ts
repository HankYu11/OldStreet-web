export type Lang = "zh" | "en";

export const base = (lang: Lang) => (lang === "zh" ? "/" : "/en/");
export const streetPath = (lang: Lang, id: string) => `${base(lang)}streets/${id}/`;

const labels = {
  region: {
    north: ["北部", "North"],
    central: ["中部", "Central"],
    south: ["南部", "South"],
    east: ["東部", "East"],
    islands: ["離島", "Islands"],
  },
  status: {
    thriving: ["熱門觀光", "Thriving"],
    active: ["值得一逛", "Lively"],
    quiet: ["靜謐生活", "Quiet"],
    faded: ["僅存記憶", "Faded"],
  },
  statusHint: {
    thriving: ["店家林立、假日人潮滿滿", "Packed with shops and weekend crowds"],
    active: ["有不少店家，比熱門老街悠閒", "A good number of shops, calmer than the big names"],
    quiet: ["以在地生活為主，順路值得走走", "Mostly local life — worth a stroll if you're nearby"],
    faded: ["道路拓寬或改建，老味道已不多", "Widened or rebuilt — mostly history now"],
  },
  score: {
    food: ["美食", "Food"],
    history: ["故事", "Story"],
    architecture: ["老建築", "Buildings"],
    shopping: ["店家攤販", "Vendors"],
    crowd: ["人潮", "Crowds"],
  },
  scoreShort: {
    food: ["食", "Food"],
    history: ["史", "Story"],
    architecture: ["建", "Bldg"],
    shopping: ["逛", "Shops"],
    crowd: ["人", "Crowd"],
  },
  arch: {
    "baroque-facade": ["巴洛克立面", "Baroque facades"],
    minnan: ["閩南紅磚", "Minnan red brick"],
    "japanese-era": ["日式／和洋", "Japanese-era"],
    hakka: ["客家夥房", "Hakka"],
    arcade: ["亭仔腳騎樓", "Arcades"],
    "stone-house": ["石頭屋", "Stone houses"],
    "wooden-house": ["木造屋", "Timber houses"],
    "fujian-granite": ["閩式花崗岩", "Fujian granite"],
    modernist: ["戰後現代", "Post-war modern"],
  },
  theme: {
    "qing-era": ["清代", "Qing era"],
    "japanese-era": ["日治", "Japanese era"],
    "port-trade": ["港口貿易", "Port trade"],
    "river-port": ["河港", "River port"],
    mining: ["礦業", "Mining"],
    railway: ["鐵道", "Railway"],
    temple: ["廟宇", "Temples"],
    hakka: ["客家", "Hakka"],
    indigenous: ["原住民", "Indigenous"],
    "hot-spring": ["溫泉", "Hot springs"],
    tea: ["茶", "Tea"],
    ceramics: ["陶瓷", "Ceramics"],
    crafts: ["工藝", "Crafts"],
    military: ["軍事", "Military"],
    "art-murals": ["彩繪", "Murals"],
    "night-market": ["夜市", "Night market"],
    fishing: ["漁港", "Fishing"],
    agriculture: ["農業", "Farming"],
    "herbal-medicine": ["中藥", "Herbal medicine"],
    "film-location": ["電影場景", "Film location"],
    cats: ["貓", "Cats"],
    "sky-lanterns": ["天燈", "Sky lanterns"],
    nature: ["自然", "Nature"],
    "dried-goods": ["南北貨", "Dried goods"],
  },
  bestFor: {
    foodie: ["吃貨", "Foodies"],
    "history-buff": ["歷史迷", "History buffs"],
    architecture: ["建築控", "Architecture fans"],
    photography: ["攝影", "Photographers"],
    shopping: ["購物", "Shoppers"],
    family: ["親子", "Families"],
    "slow-travel": ["慢旅行", "Slow travel"],
    "day-trip-from-taipei": ["台北出發一日遊", "Day trip from Taipei"],
    nightlife: ["夜生活", "Nightlife"],
  },
  duration: {
    "<1h": ["1 小時內", "Under 1 hour"],
    "1-2h": ["1–2 小時", "1–2 hours"],
    "half-day": ["半天", "Half a day"],
    "full-day": ["一整天", "A full day"],
  },
  confidence: {
    high: ["資料充足", "Well documented"],
    medium: ["資料尚可", "Fairly documented"],
    low: ["資料有限，出發前請再確認", "Little info found — double-check before going"],
  },
} as const;

const COUNTY_EN: Record<string, string> = {
  基隆市: "Keelung", 臺北市: "Taipei", 新北市: "New Taipei", 桃園市: "Taoyuan", 新竹市: "Hsinchu City",
  新竹縣: "Hsinchu County", 苗栗縣: "Miaoli", 臺中市: "Taichung", 彰化縣: "Changhua", 南投縣: "Nantou",
  雲林縣: "Yunlin", 嘉義市: "Chiayi City", 嘉義縣: "Chiayi County", 臺南市: "Tainan", 高雄市: "Kaohsiung",
  屏東縣: "Pingtung", 宜蘭縣: "Yilan", 花蓮縣: "Hualien", 臺東縣: "Taitung", 澎湖縣: "Penghu",
  金門縣: "Kinmen", 連江縣: "Matsu (Lienchiang)",
};
export const countyName = (lang: Lang, county: string) => (lang === "zh" ? county : (COUNTY_EN[county] ?? county));

type Labels = typeof labels;
export function L<G extends keyof Labels>(lang: Lang, group: G, key: string): string {
  const entry = (labels[group] as Record<string, readonly [string, string]>)[key];
  return entry ? entry[lang === "zh" ? 0 : 1] : key;
}
export const labelKeys = <G extends keyof Labels>(group: G) => Object.keys(labels[group]);

export const moods = [
  { id: "all", icon: "✦", zh: "全部", en: "Everything" },
  { id: "food", icon: "🍜", zh: "吃美食", en: "Eat" },
  { id: "story", icon: "📜", zh: "聽故事", en: "Stories" },
  { id: "heritage", icon: "🏛", zh: "看老屋", en: "Old buildings" },
  { id: "market", icon: "🏮", zh: "逛市集", en: "Browse stalls" },
  { id: "quiet", icon: "🌙", zh: "人少好拍", en: "Quiet & photogenic" },
  { id: "family", icon: "🎈", zh: "親子同遊", en: "With kids" },
] as const;

export const copy = {
  zh: {
    htmlLang: "zh-Hant-TW",
    title: "老街時光機 — 找到你想去的台灣老街",
    description:
      "收錄全台 207 條老街：美食、故事、老建築、攤販與人潮一次比較。吃貨、歷史迷、攝影愛好者都能找到最適合自己的老街。",
    nav: { explore: "探索", map: "地圖", method: "分類方式" },
    langSwitch: "EN",
    heroKicker: "TAIWAN OLD STREET ARCHIVE · 1700s → 2026",
    heroTitle: ["穿越時光的", "207 條老街"],
    heroLede: "從九份的礦業山城到鹿港的紅磚古巷。告訴我們你想要什麼，地圖會幫你點亮最適合的那幾條。",
    moodPrompt: "今天想要…",
    mapHint: "滑過光點看老街，點擊進入",
    statsLabel: ["條老街", "縣市", "美食老街", "保存完整老屋"],
    explore: {
      title: "找到你的老街",
      search: "搜尋老街、鄉鎮或小吃…",
      region: "地區",
      all: "全部",
      vendors: "有攤販店家",
      heritage: "有歷史建築",
      hideFaded: "隱藏已沒落",
      sort: "排序",
      sorts: { recommended: "推薦", food: "美食", history: "故事", architecture: "老建築", nearby: "離我最近" },
      results: (n: number) => `${n} 條老街`,
      empty: "沒有符合的老街，試試放寬條件。",
      more: "顯示更多",
      reset: "清除條件",
    },
    method: {
      title: "我們怎麼分類老街",
      lede: "「老街」可以是人擠人的觀光大街，也可能只剩一排安靜的老屋。每條老街都依五個面向評分（0–3），讓你出發前就知道會看到什麼。",
      statusTitle: "現況",
      sourceNote:
        "名單來自維基百科〈臺灣老街列表〉並補充知名老街，內容參考各縣市觀光網站、維基百科與旅遊文章整理。標示「資料有限」的老街請出發前再確認。",
    },
    street: {
      back: "← 所有老街",
      scores: "老街指數",
      story: "老街的故事",
      eat: "必吃",
      buy: "特產與工藝",
      see: "必看",
      visit: "怎麼去",
      duration: "建議停留",
      bestTime: "最佳時機",
      styles: "建築風格",
      themes: "主題",
      bestFor: "適合",
      nearby: "順遊附近老街",
      sources: "資料來源",
      photo: "照片",
      wiki: "維基百科",
      address: "位置",
      km: "公里",
      mapLabel: "地圖",
    },
    footer: {
      data: "資料：維基百科〈臺灣老街列表〉(CC BY-SA 4.0)、各地觀光資訊；地圖 © OpenStreetMap 貢獻者；照片來自 Wikimedia Commons，授權依各檔案頁面。",
      made: "老街時光機 · oldstreet.handyla.co",
    },
    notFound: { title: "這條巷子走不通", lede: "找不到這個頁面，回到地圖重新出發吧。", cta: "回首頁" },
  },
  en: {
    htmlLang: "en",
    title: "Old Street Time Machine — find the Taiwan old street for you",
    description:
      "207 old streets across Taiwan, compared by food, history, heritage buildings, vendors and crowds — so foodies, history lovers and photographers each find the right one.",
    nav: { explore: "Explore", map: "Map", method: "How we rate" },
    langSwitch: "中文",
    heroKicker: "TAIWAN OLD STREET ARCHIVE · 1700s → 2026",
    heroTitle: ["207 old streets,", "one time machine"],
    heroLede:
      "From Jiufen's gold-rush hillside to Lukang's red-brick lanes. Tell us what you're in the mood for and the map lights up the streets that fit.",
    moodPrompt: "I'm in the mood for…",
    mapHint: "Hover a light to preview, click to open",
    statsLabel: ["old streets", "counties & cities", "food streets", "well-preserved"],
    explore: {
      title: "Find your old street",
      search: "Search streets, towns or snacks…",
      region: "Region",
      all: "All",
      vendors: "Has vendors",
      heritage: "Historic buildings",
      hideFaded: "Hide faded",
      sort: "Sort",
      sorts: { recommended: "Recommended", food: "Food", history: "Story", architecture: "Buildings", nearby: "Nearest to me" },
      results: (n: number) => `${n} old streets`,
      empty: "No streets match — try loosening the filters.",
      more: "Show more",
      reset: "Clear filters",
    },
    method: {
      title: "How we rate old streets",
      lede: "An \"old street\" can be a heaving tourist strip or a single quiet row of shophouses. Every street gets five 0–3 ratings so you know what to expect before you go.",
      statusTitle: "Status",
      sourceNote:
        "The list comes from Chinese Wikipedia's List of Old Streets in Taiwan plus a few well-known additions, researched from county tourism sites, Wikipedia and travel writing. Check streets marked \"little info found\" before you set off.",
    },
    street: {
      back: "← All old streets",
      scores: "Street profile",
      story: "The story",
      eat: "Must eat",
      buy: "Local goods & crafts",
      see: "Must see",
      visit: "Getting there",
      duration: "Time needed",
      bestTime: "Best time",
      styles: "Architecture",
      themes: "Themes",
      bestFor: "Best for",
      nearby: "Nearby old streets",
      sources: "Sources",
      photo: "Photo",
      wiki: "Wikipedia",
      address: "Where",
      km: "km",
      mapLabel: "Map",
    },
    footer: {
      data: "Data: Chinese Wikipedia “臺灣老街列表” (CC BY-SA 4.0) and local tourism information. Map © OpenStreetMap contributors. Photos from Wikimedia Commons under the licence on each file page.",
      made: "Old Street Time Machine · oldstreet.handyla.co",
    },
    notFound: { title: "Dead-end alley", lede: "That page doesn't exist. Head back to the map.", cta: "Back home" },
  },
} as const;

export type Copy = (typeof copy)[Lang];
