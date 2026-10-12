# Old street data schema

`data/old_streets.json` is an array of street records. Base list comes from
zh.wikipedia [臺灣老街列表](https://zh.wikipedia.org/wiki/臺灣老街列表); each record is
then enriched with research so visitors can filter by what they care about
(food, stories, buildings, shopping…).

## Record

| field | type | meaning |
|---|---|---|
| `id` | string | URL slug, lowercase pinyin/romanised, e.g. `daxi-old-street` |
| `name_zh` / `name_en` | string | Display names. `name_en` uses the common official romanisation (e.g. "Daxi Old Street") |
| `aliases` | string[] | Other names (historic names, 日治 town names…) |
| `region` | enum | `north` `central` `south` `east` `islands` |
| `county` / `district` | string | e.g. `桃園市` / `大溪區` |
| `address_hint` | string | Main road(s) of the street, zh |
| `lat` / `lng` | number | Centre of the street (≈ ±150 m is fine) |
| `status` | enum | How alive it is **as a visitor destination** (see below) |
| `scores` | object | 0–3 ratings, see below |
| `architecture_styles` | enum[] | see vocabulary |
| `themes` | enum[] | see vocabulary |
| `best_for` | enum[] | see vocabulary |
| `signature_foods` | string[] | zh names of foods worth trying *on/near this street* |
| `specialties` | string[] | non-food goods/crafts (陶瓷, 藍染, 木雕…) |
| `landmarks` | string[] | zh names of must-see buildings / temples on or right next to the street |
| `tagline_zh` / `tagline_en` | string | One-line hook (≤ 30 字 / ≤ 90 chars) |
| `story_zh` / `story_en` | string | 2–4 sentences: why the street exists, its rise/fall, a memorable anecdote |
| `getting_there` | string | zh, nearest rail/MRT station + bus/walk, or "建議開車" |
| `visit_duration` | enum | `<1h` `1-2h` `half-day` `full-day` |
| `best_time` | string | zh, optional tip (weekday mornings, festival dates, night market nights…) |
| `confidence` | enum | `high` (well documented) `medium` `low` (little info found — treat cautiously) |
| `sources` | string[] | URLs used |

### `status`
- `thriving` – a major tourist street: dense shops/stalls, busy on weekends (九份, 大溪, 鹿港)
- `active` – a real visitor street with a good number of shops/eateries, but smaller or calmer
- `quiet` – mostly residential/local life; a few old buildings and shops, worth a stroll if nearby
- `faded` – road widened / buildings mostly rebuilt; little left to see beyond history

### `scores` (0–3 each)
| key | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| `food` | nothing notable | a few eateries | good local eats, worth a detour | food destination in itself |
| `history` (story depth) | little known | some local history | notable story / era | nationally significant history |
| `architecture` (preserved old buildings) | basically none left | a few scattered | a good stretch of old facades | outstanding, largely intact |
| `shopping` (vendors, stalls, crafts) | none | a few shops | many shops / stalls | a shopping street in itself |
| `crowd` | — | quiet | moderate | very crowded on weekends |

## Controlled vocabularies

`architecture_styles`: `baroque-facade` (巴洛克/牌樓立面), `minnan` (閩南式紅磚), `japanese-era` (日式/和洋), `hakka` (客家伙房/夥房), `arcade` (亭仔腳/騎樓步廊), `stone-house` (石頭屋/咾咕石), `wooden-house` (木造), `fujian-granite` (閩東/金門花崗岩), `modernist` (戰後/現代主義)

`themes`: `qing-era`, `japanese-era`, `port-trade`, `river-port`, `mining`, `railway`, `temple`, `hakka`, `indigenous`, `hot-spring`, `tea`, `ceramics`, `crafts`, `military`, `art-murals`, `night-market`, `fishing`, `agriculture`, `herbal-medicine`, `film-location`, `cats`, `sky-lanterns`, `nature`, `dried-goods`

`best_for`: `foodie`, `history-buff`, `architecture`, `photography`, `shopping`, `family`, `slow-travel`, `day-trip-from-taipei`, `nightlife`

## Derived filters (computed by the site)
- **Has vendors** ⇔ `scores.shopping >= 2` or `scores.food >= 2`
- **Has historical buildings** ⇔ `scores.architecture >= 2`
- **Food trip** ⇔ `scores.food >= 2`; **Story trip** ⇔ `scores.history >= 2`
