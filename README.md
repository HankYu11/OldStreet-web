# 老街時光機 · Old Street Time Machine

Find the Taiwanese old street (老街) you actually want to visit — whether you're going for the
food, the history, the buildings, or a quiet stroll. Live at **https://oldstreet.handyla.co**.

- **Plan:** [PLAN.md](PLAN.md)
- **Data:** [`data/old_streets.json`](data/old_streets.json) (207 streets), schema in [data/SCHEMA.md](data/SCHEMA.md),
  English translations of practical fields in [`data/translations_en.json`](data/translations_en.json)

Static site built with [Astro](https://astro.build): vanilla TypeScript, no UI framework.

- `/` — Traditional Chinese (default) · `/en/` — English
- `/streets/<id>/` · `/en/streets/<id>/` — one page per street (414 total)

## Develop

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # builds the Taiwan map shape, then dist/
```

Canonical URLs, hreflang and `sitemap.xml` use `https://oldstreet.handyla.co` (set in `astro.config.mjs`).
Override with `SITE_URL=https://… npm run build` for a staging host.

## Where things live

- `src/components/Home.astro` — home page: `Hero` + `Explorer` with the sticky `TaiwanMap`, then `Method`.
- `src/components/StreetPage.astro` — street detail page (HUD gauges, story, foods, Leaflet mini-map, nearby streets).
- `src/scripts/state.ts` — shared filter state (mood, region, toggles, search, sort), mirrored to the URL.
  `explorer.ts` filters/sorts the server-rendered cards inside a View Transition; `map.ts` handles the map.
- `src/components/Effects.astro` — site-wide motion: reveals, text decode, count-ups, cursor light,
  spotlight, tilt, magnetic buttons. All of it is off under `prefers-reduced-motion`.
- `src/lib/project.mjs` — map projection (Kinmen and Matsu drawn as insets); `scripts/build-taiwan-shape.mjs`
  turns `taiwan-atlas` county boundaries into `src/data/taiwan.json`.
- `src/i18n/copy.ts` — all UI copy and labels for both languages.

Photos are hot-linked from Wikimedia Commons (credited and linked to their file pages); the street map uses
OpenStreetMap tiles.

## Deploy

Firebase Hosting site `oldstreet-web` in the `freshtogo-e52a1` project, served on `oldstreet.handyla.co`
(same setup as QiSi-web). `.github/workflows/deploy.yml` builds every PR to `main` and deploys when `main`
changes. One-time setup:

1. Add the repo secret `FIREBASE_SERVICE_ACCOUNT` (a service-account JSON key for `freshtogo-e52a1` with
   Firebase Hosting Admin; the one QiSi-web uses works). The first workflow run creates the `oldstreet-web`
   Hosting site if it doesn't exist yet.
2. Firebase console → Hosting → `oldstreet-web` → Add custom domain → `oldstreet.handyla.co`, then add the DNS
   record it shows at your domain registrar.

Manual deploy: `npm run build && firebase deploy --only hosting:prod`.

## Rebuilding the data

```sh
W=/tmp/oldstreet && mkdir -p $W
# 1. Wikipedia list → base rows
curl -sSL "https://zh.wikipedia.org/w/index.php?title=臺灣老街列表&action=raw" -o $W/list.txt
python3 scripts/parse_wiki.py $W/list.txt $W/base.json
# 2. Per-street Wikipedia intro + coordinates
python3 scripts/fetch_wiki_details.py $W/base.json $W/detailed.json
# 3. Geocode with OpenStreetMap Nominatim (~1 req/s, slow) — used only to cross-check coordinates
python3 scripts/geocode.py $W/detailed.json $W/geocoded.json
# 4. Merge researched enrichment (data/research/*.json) and validate
python3 scripts/merge.py $W/geocoded.json data/research data/old_streets.json
# 5. Check every street sits inside its stated township
node scripts/check-coords.mjs
```

`data/raw/wikipedia.json` is a committed snapshot of step 2; pass it to `merge.py` in place of
`geocoded.json` to rebuild without hitting Wikipedia/OSM.

`data/research/*.json` holds the per-region enrichment (scores, foods, stories, sources), researched from
tourism bureau sites, Wikipedia and travel writing. Entries marked `"confidence": "low"` had little
information available and should be verified.

Base list: [zh.wikipedia 臺灣老街列表](https://zh.wikipedia.org/wiki/臺灣老街列表) (CC BY-SA 4.0).
Map boundaries: [taiwan-atlas](https://github.com/dkaoster/taiwan-atlas) (government open data).
Geocoding and tiles: © OpenStreetMap contributors (ODbL).
