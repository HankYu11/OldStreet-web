"""Parse zh.wikipedia 臺灣老街列表 wikitext into a base JSON list.

Usage: python3 scripts/parse_wiki.py <list.txt> <out.json>
"""
import json, re, sys

src, out = sys.argv[1], sys.argv[2]
text = open(src, encoding="utf-8").read()

REGION_MAP = {"北部": "north", "中部": "central", "南部": "south", "東部": "east", "離島": "islands"}

def strip_markup(s):
    s = re.sub(r"<ref[^>]*?/>", "", s)
    s = re.sub(r"<ref.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    s = re.sub(r"\[\[File:[^\]]*\]\]", "", s)
    s = re.sub(r"\[\[(?:[^|\]]*\|)?([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[http\S+\s*\]", "", s)
    s = s.replace("-{庄}-", "庄")
    return re.sub(r"\s+", " ", s).strip()

def wiki_title(s):
    m = re.search(r"\[\[([^|\]]+)", s)
    if not m or m.group(1).startswith("File:"):
        return None
    return m.group(1).rstrip(")") if m.group(1).count(")") > m.group(1).count("(") else m.group(1)

def image(s):
    m = re.search(r"\[\[File:([^|\]]+)", s)
    return m.group(1).strip() if m else None

rows, region, county = [], None, None
for block in re.split(r"\n(?===)", text):
    h = re.match(r"(=+)\s*(.*?)\s*=+", block)
    if not h:
        continue
    level, title = len(h.group(1)), h.group(2)
    if level == 2:
        region = REGION_MAP.get(title)
        continue
    county = title.replace("台", "臺") if title.startswith(("台", "臺")) else title
    if not region:
        continue
    table = block.split("{|", 1)[-1]
    for raw in table.split("\n|-")[1:]:
        raw = raw.strip()
        if raw.startswith("!") or not raw.startswith("|"):
            continue
        # Cells are separated by newline-pipe or inline "||".
        flat = []
        for c in ("\n" + raw).split("\n|")[1:]:
            flat.extend(x for x in c.split("||"))
        flat = [c.strip() for c in flat]
        if flat and flat[-1].endswith("}"):
            flat[-1] = flat[-1].rstrip("|}").strip()
        while len(flat) < 6:
            flat.append("")
        # The 安平 row has its alias on a continuation line inside the name cell.
        name_cell = flat[0]
        name = strip_markup(name_cell.split("\n")[0])
        alias_m = re.findall(r"[（(]([^）)]*)[）)]", strip_markup(name_cell))
        name_clean = re.sub(r"[（(].*?[）)]", "", name).strip()
        rows.append({
            "name_zh": name_clean,
            "aliases": [a.strip() for a in "、".join(alias_m).split("、") if a.strip()],
            "wiki_title": wiki_title(name_cell),
            "region": region,
            "county": county,
            "location_wiki": strip_markup(flat[2]),
            "type_wiki": strip_markup(flat[3]),
            "features_wiki": strip_markup(flat[4]),
            "notes_wiki": strip_markup(flat[5]),
            "wiki_image": image(flat[1]),
        })

# Known glitches in the source table.
for r in rows:
    if r["name_zh"] == "美崙老街頭崙老街":
        r["name_zh"] = "美崙老街"
    if r["notes_wiki"].startswith("{{fact"):
        r["notes_wiki"] = ""

json.dump(rows, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(rows), "rows")
