"""Merge research batches into data/old_streets.json and validate them.

Usage: python3 scripts/merge.py <geocoded.json> <research_dir> <out.json>

- Adds `region` and Wikipedia metadata (article title, image) from the base list.
- Cross-checks researched coordinates against Nominatim/Wikipedia geocodes and
  reports large disagreements.
- Validates controlled vocabularies from data/SCHEMA.md.
"""
import glob, json, math, os, re, sys

geocoded_path, research_dir, out_path = sys.argv[1:4]
base = json.load(open(geocoded_path, encoding="utf-8"))

COUNTY_REGION = {r["county"]: r["region"] for r in base}
STATUS = {"thriving", "active", "quiet", "faded"}
ARCH = {"baroque-facade", "minnan", "japanese-era", "hakka", "arcade", "stone-house",
        "wooden-house", "fujian-granite", "modernist"}
THEMES = {"qing-era", "japanese-era", "port-trade", "river-port", "mining", "railway", "temple",
          "hakka", "indigenous", "hot-spring", "tea", "ceramics", "crafts", "military",
          "art-murals", "night-market", "fishing", "agriculture", "herbal-medicine",
          "film-location", "cats", "sky-lanterns", "nature", "dried-goods"}
BEST_FOR = {"foodie", "history-buff", "architecture", "photography", "shopping", "family",
            "slow-travel", "day-trip-from-taipei", "nightlife"}
DURATION = {"<1h", "1-2h", "half-day", "full-day"}
CONFIDENCE = {"high", "medium", "low"}
SCORE_KEYS = ("food", "history", "architecture", "shopping", "crowd")
FIELD_ORDER = ["id", "name_zh", "name_en", "aliases", "region", "county", "district", "address_hint",
               "lat", "lng", "status", "scores", "architecture_styles", "themes", "best_for",
               "signature_foods", "specialties", "landmarks", "tagline_zh", "tagline_en",
               "story_zh", "story_en", "getting_there", "visit_duration", "best_time",
               "confidence", "wikipedia", "image", "sources", "source_list"]

def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 6371 * 2 * math.asin(math.sqrt(h))

def norm(s):
    return s.replace("台", "臺")

base_by_key = {(norm(r["county"]), r["name_zh"]): r for r in base}
problems, streets, seen_ids = [], [], set()

for path in sorted(glob.glob(os.path.join(research_dir, "*.json"))):
    batch = json.load(open(path, encoding="utf-8"))
    for kind in ("streets", "additions"):
        for s in batch.get(kind, []):
            s = dict(s)
            s["county"] = norm(s["county"])
            b = base_by_key.get((s["county"], s["name_zh"]))
            if b is None:
                b = next((x for x in base if norm(x["county"]) == s["county"]
                          and (x["name_zh"] in s.get("aliases", []) or s["name_zh"] in x["aliases"])), None)
            s["region"] = COUNTY_REGION.get(s["county"]) or s.get("region")
            s["source_list"] = "wikipedia" if b and kind == "streets" else "addition"
            if b:
                w = b.get("wiki", {})
                s["wikipedia"] = (f"https://zh.wikipedia.org/wiki/{w['resolved_title']}"
                                  if w.get("exists") else None)
                s["image"] = ({"commons_file": b["wiki_image"]} if b.get("wiki_image") else None)
                g = b.get("geo")
                if g and s.get("lat") and g["source"] != "nominatim:district":
                    d = km((s["lat"], s["lng"]), (g["lat"], g["lng"]))
                    if d > 3:
                        problems.append(f"coords: {s['name_zh']} research vs {g['source']} differ by {d:.1f} km")
                if not s.get("lat") and g:
                    s["lat"], s["lng"] = g["lat"], g["lng"]
            else:
                s.setdefault("wikipedia", None)
                s.setdefault("image", None)

            name = s["name_zh"]
            if s.get("id") in seen_ids or not re.fullmatch(r"[a-z0-9-]+", s.get("id") or ""):
                s["id"] = f"{s.get('id') or 'street'}-{len(streets)}"
                problems.append(f"id: {name} reassigned to {s['id']}")
            seen_ids.add(s["id"])
            if s.get("status") not in STATUS:
                problems.append(f"status: {name} {s.get('status')}")
            if s.get("visit_duration") not in DURATION:
                problems.append(f"duration: {name} {s.get('visit_duration')}")
            if s.get("confidence") not in CONFIDENCE:
                problems.append(f"confidence: {name} {s.get('confidence')}")
            for key, vocab in (("architecture_styles", ARCH), ("themes", THEMES), ("best_for", BEST_FOR)):
                bad = [v for v in s.get(key, []) if v not in vocab]
                if bad:
                    problems.append(f"{key}: {name} {bad} (dropped)")
                    s[key] = [v for v in s[key] if v in vocab]
            sc = s.get("scores", {})
            for k in SCORE_KEYS:
                if not isinstance(sc.get(k), int) or not 0 <= sc[k] <= 3:
                    problems.append(f"score: {name} {k}={sc.get(k)}")
            if not (21.8 < (s.get("lat") or 0) < 26.5 and 118 < (s.get("lng") or 0) < 122.1):
                problems.append(f"coords: {name} out of Taiwan bounds {s.get('lat')},{s.get('lng')}")
            streets.append({k: s.get(k) for k in FIELD_ORDER if k in s or k in ("wikipedia", "image")}
                           | {k: v for k, v in s.items() if k not in FIELD_ORDER})

missing = [f"{r['county']} {r['name_zh']}" for r in base
           if not any(s["name_zh"] == r["name_zh"] and s["county"] == norm(r["county"]) for s in streets)]
for m in missing:
    problems.append(f"missing from research: {m}")

region_order = ["north", "central", "south", "east", "islands"]
streets.sort(key=lambda s: region_order.index(s["region"]) if s["region"] in region_order else 9)
json.dump(streets, open(out_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print(f"{len(streets)} streets written to {out_path}")
print("\n".join(problems) or "no problems")
