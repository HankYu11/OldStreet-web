# 老街地圖 OldStreet — Website plan

Goal: help people find **the Taiwanese old street (老街) that matches what they want** —
a foodie looking for the best snacks, a history lover looking for the story and
the buildings, a family looking for an easy day trip — instead of yet another
"top 10 老街" listicle.

## 1. Who it's for & what they ask

| Persona | Question they bring | What the site must answer |
|---|---|---|
| 吃貨 Foodie | 「哪條老街最好吃？台北出發一日可以到的？」 | Food score, signature dishes, near/far, crowds |
| 故事迷 Story lover | 「哪條老街背後有故事？建築保存得好嗎？」 | History & architecture scores, story text, landmarks, era/themes |
| 拍照 / 文青 | 「哪裡人少、有老房子好拍？」 | Architecture high + crowd low, `quiet` status |
| 親子 / 一日遊 | 「交通方便、逛半天剛好的？」 | Getting there by rail, visit duration, shopping |

The key insight from the Wikipedia list (201 entries): **"老街" covers very different things** —
from thriving tourist strips (九份, 大溪) to a single row of residential shophouses,
to streets where the road was widened and nothing old remains. The site must make
that difference obvious so nobody drives two hours to a faded street expecting 鹿港.

## 2. Data (done in this first step)

- `data/old_streets.json` — every street on zh.wikipedia 臺灣老街列表 plus a few
  well-known additions, enriched by research: coordinates, status, 0–3 scores for
  **food / history / architecture / shopping / crowd**, architecture styles, themes,
  signature foods, landmarks, bilingual tagline + story, transit, visit length, sources.
- `data/SCHEMA.md` — field definitions and controlled vocabularies.
- `scripts/` — reproducible pipeline: parse Wikipedia → fetch article intros/coords →
  geocode → merge research → validate.

Categorisation is **multi-dimensional, not one bucket**: the user's two original
questions map directly to derived filters:
- *Has local vendors?* ⇔ `shopping ≥ 2 || food ≥ 2`
- *Has historical buildings?* ⇔ `architecture ≥ 2`

## 3. Core features (MVP)

1. **"What are you looking for?" entry** — big mood buttons on the homepage:
   🍜 吃美食 · 📜 聽故事 · 🏛️ 看老建築 · 🛍️ 逛市集 · 📷 人少好拍 · 👨‍👩‍👧 親子一日遊.
   Each sets a sensible filter + sort (e.g. 吃美食 → food ≥ 2, sort by food then status).
2. **Explore view = map + list side by side** (stacked on mobile)
   - Leaflet map with clustered markers, coloured by status (thriving → faded).
   - Filter bar: region/county, status, score sliders, themes (礦業, 客家, 鐵道, 港口…),
     architecture style, "reachable by train", visit duration.
   - Cards show tagline, 4 mini score bars (食 / 史 / 建 / 逛), top 3 foods, crowd level.
3. **Street detail page** (`/streets/daxi-old-street`)
   - Hero photo (Wikimedia Commons), tagline, scores as a radar/bar chart.
   - 「必吃」food list, 「故事」story section, landmarks, getting there, best time.
   - Mini map + "nearby old streets" (within ~30 km) to chain a day trip.
   - Honest badge for `faded` / `low confidence` entries.
4. **Compare** up to 3 streets side by side.
5. **Bilingual** zh-TW (default) / English toggle.

### Later
- Curated **routes** ("平溪線老街一日遊", "客家老街巡禮", "台南府城古街散步").
- User tips / photos, "I've been here" checklist (local storage → accounts later).
- Festival calendar (平溪天燈、鹿港端午、大甲媽祖遶境…).
- Food deep-dive: per-street dish pages with photos.

## 4. Look & feel

"Fancy but friendly": warm, nostalgic palette inspired by 紅磚 (brick red),
洗石子 (terrazzo grey), 檜木 (cypress wood) and 老招牌 teal; a serif CJK display
font (e.g. Noto Serif TC) for headings, clean sans for UI; subtle paper texture;
illustrated facade icons per architecture style. Mobile-first — most people will
check this on their phone on the way.

## 5. Tech stack (proposed)

| Concern | Choice | Why |
|---|---|---|
| Framework | **Astro** (static) + **React** islands for the explorer | One static page per street → great SEO & fast; interactive only where needed |
| Styling | Tailwind CSS | Fast iteration, consistent design tokens |
| Map | Leaflet + OpenStreetMap tiles (or MapLibre) + marker clustering | Free, no API key |
| Search | Fuse.js client-side fuzzy search (zh + en + aliases) | ~200 items, no backend needed |
| Data | `data/old_streets.json` validated in CI with a JSON schema | Single source of truth, easy to edit via PR |
| Images | Wikimedia Commons (with attribution) | Free licences |
| Hosting | GitHub Pages or Vercel | Free, auto-deploy from `main` |
| i18n | Astro i18n routing (`/` zh-TW, `/en/`) | |

No backend for the MVP; everything is static.

## 6. Milestones

1. ✅ **Data gathering** — list, enrichment, schema (this PR/commit).
2. **Data review** — spot-check scores/coords for the top ~40 streets; fix low-confidence entries; pick hero images.
3. **Scaffold** — Astro + Tailwind + data loading + street detail pages.
4. **Explorer** — map, filters, mood buttons, search.
5. **Polish** — design pass, bilingual copy, accessibility, Lighthouse ≥ 90, deploy.
6. **Routes & extras**.

## 7. Open questions

- Domain / brand name? (working title: 老街地圖 OldStreet)
- Should "老街" include closely related places that aren't strictly streets
  (二崁聚落, 剝皮寮, 勝興車站) — currently yes if Wikipedia lists them.
- How much to curate vs. list everything? Proposal: list all, but default sort
  pushes `thriving`/`active` and high-confidence entries to the top.
