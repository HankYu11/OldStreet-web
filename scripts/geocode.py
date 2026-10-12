"""Geocode streets via OSM Nominatim (1 req/s). Rows that already have
Wikipedia coordinates keep them.

Usage: python3 scripts/geocode.py <detailed.json> <out.json>
"""
import json, re, subprocess, sys, time, urllib.parse

rows = json.load(open(sys.argv[1], encoding="utf-8"))

def search(q):
    url = "https://nominatim.openstreetmap.org/search?" + urllib.parse.urlencode(
        {"q": q, "countrycodes": "tw", "format": "json", "limit": 1})
    out = subprocess.run(["curl", "-sS", "-A", "OldStreetWeb/0.1 (github.com/HankYu11/OldStreet-web)", url],
                         capture_output=True, text=True).stdout
    time.sleep(1.1)
    try:
        hits = json.loads(out)
    except json.JSONDecodeError:
        return None
    return hits[0] if hits else None

for r in rows:
    if r["wiki"].get("lat") is not None:
        r["geo"] = {"lat": r["wiki"]["lat"], "lng": r["wiki"]["lng"], "source": "wikipedia", "query": None}
        continue
    loc = r["location_wiki"]
    district = re.match(r"^(.+?[區鄉鎮市])", loc).group(1) if re.match(r"^(.+?[區鄉鎮市])", loc) else ""
    street = loc[len(district):] if district else ""
    queries = [f"{r['name_zh']} {r['county']}", r["name_zh"]]
    queries += [f"{n} {r['county']}" for n in r["aliases"]]
    if street:
        queries.append(f"{r['county']}{district}{re.split('[、一帶]', street)[0]}")
    if district:
        queries.append(f"{r['county']}{district}")
    r["geo"] = None
    for q in queries:
        hit = search(q)
        if hit and r["county"][:2].replace("臺", "台") in hit["display_name"].replace("臺", "台"):
            precision = "district" if q == f"{r['county']}{district}" else "named"
            r["geo"] = {"lat": float(hit["lat"]), "lng": float(hit["lon"]), "source": f"nominatim:{precision}",
                        "query": q, "display": hit["display_name"]}
            break
    print(r["name_zh"], (r["geo"] or {}).get("source"), flush=True)

json.dump(rows, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
