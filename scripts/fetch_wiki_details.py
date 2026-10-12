"""Fetch intro extract + coordinates for each street's own Wikipedia article.

Usage: python3 scripts/fetch_wiki_details.py <base.json> <out.json>
"""
import json, subprocess, sys, time, urllib.error, urllib.parse, urllib.request

API = "https://zh.wikipedia.org/w/api.php"
rows = json.load(open(sys.argv[1], encoding="utf-8"))

def call(params):
    q = urllib.parse.urlencode({**params, "format": "json", "formatversion": 2, "variant": "zh-tw"})
    # urllib gets rate-limited behind the proxy; curl does not.
    for attempt in range(6):
        out = subprocess.run(["curl", "-sS", "-A", "OldStreetWeb/0.1", f"{API}?{q}"],
                             capture_output=True, text=True).stdout
        try:
            return json.loads(out)
        except json.JSONDecodeError:
            time.sleep(5 * 2 ** attempt)
    raise RuntimeError(out[:300])

titles = sorted({r["wiki_title"].split("#")[0] for r in rows if r["wiki_title"]})
info = {}
for i in range(0, len(titles), 20):
    batch = titles[i:i + 20]
    d = call({"action": "query", "titles": "|".join(batch), "redirects": 1,
              "prop": "coordinates|extracts|pageimages|langlinks", "exintro": 1, "explaintext": 1,
              "exlimit": 20, "pithumbsize": 800, "lllang": "en", "lllimit": 50})
    q = d["query"]
    alias = {}
    for k in ("normalized", "redirects"):
        for m in q.get(k, []):
            alias[m["from"]] = m["to"]
    pages = {p["title"]: p for p in q["pages"]}
    for t in batch:
        tt = t
        while tt in alias:
            tt = alias[tt]
        p = pages.get(tt, {})
        c = (p.get("coordinates") or [{}])[0]
        info[t] = {
            "exists": "missing" not in p and bool(p),
            "resolved_title": tt,
            "extract": p.get("extract", ""),
            "lat": c.get("lat"), "lng": c.get("lon"),
            "thumbnail": (p.get("thumbnail") or {}).get("source"),
            "en_title": (p.get("langlinks") or [{}])[0].get("title"),
        }
    time.sleep(3)

for r in rows:
    r["wiki"] = info.get((r["wiki_title"] or "").split("#")[0], {"exists": False})
json.dump(rows, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
ok = sum(r["wiki"].get("exists") for r in rows)
geo = sum(r["wiki"].get("lat") is not None for r in rows)
print(f"{len(rows)} rows, {ok} with article, {geo} with coords")
