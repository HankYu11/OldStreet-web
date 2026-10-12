# 老街地圖 OldStreet

A guide to help people find the Taiwanese old street (老街) they actually want to visit —
whether they're going for the food, the history, the buildings, or a quiet stroll.

- **Plan:** [PLAN.md](PLAN.md)
- **Data:** [`data/old_streets.json`](data/old_streets.json) — schema in [data/SCHEMA.md](data/SCHEMA.md)

## Rebuilding the data

```sh
W=/tmp/oldstreet && mkdir -p $W
# 1. Wikipedia list → base rows
curl -sSL "https://zh.wikipedia.org/w/index.php?title=臺灣老街列表&action=raw" -o $W/list.txt
python3 scripts/parse_wiki.py $W/list.txt $W/base.json
# 2. Per-street Wikipedia intro + coordinates
python3 scripts/fetch_wiki_details.py $W/base.json $W/detailed.json
# 3. Geocode the rest with OpenStreetMap Nominatim (~1 req/s, takes a few minutes)
python3 scripts/geocode.py $W/detailed.json $W/geocoded.json
# 4. Merge researched enrichment (data/research/*.json) and validate
python3 scripts/merge.py $W/geocoded.json data/research data/old_streets.json
```

`data/research/*.json` holds the per-region enrichment (scores, foods, stories, sources),
researched from tourism bureau sites, Wikipedia and travel writing. Entries marked
`"confidence": "low"` had little information available and should be verified.

Base list: [zh.wikipedia 臺灣老街列表](https://zh.wikipedia.org/wiki/臺灣老街列表) (CC BY-SA 4.0).
Geocoding: © OpenStreetMap contributors (ODbL).
