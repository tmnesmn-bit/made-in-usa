#!/usr/bin/env python3
"""Seed aliases / match.brand / alternatives on every item in data/index.json.
Safe to re-run: never overwrites fields that already have values."""
import json, re, pathlib, sys
P = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'index.json'
d = json.loads(P.read_text())
items = d['items']

def brand_of(name):
    # "Channellock" | "Red Wing Shoes (Red Wing, MN plant only)" | "Goodyear tires - Topeka plant" -> first chunk
    b = re.split(r'\s[-/(:,]\s|\s\(|/', name)[0]
    b = re.sub(r'\b(tires?|boots?|shoes?|beer|plant|brand|tools?|co\.?|inc\.?)\b', '', b, flags=re.I)
    return b.strip(' -').strip()

for it in items:
    b = brand_of(it['name'])
    it.setdefault('aliases', [])
    m = it.setdefault('match', {'brand': [], 'include': [], 'exclude': []})
    if (not m.get('brand') or '--regen' in sys.argv) and b: m['brand'] = [b.lower()]
    it.setdefault('alternatives', [])

# alternatives: for each "Not made in USA" / non-union item, suggest up to 2 Made in USA items in the same subcategory (union first)
by_sub = {}
for it in items:
    if it['origin'] == 'Made in USA': by_sub.setdefault((it['category'], (it.get('subcategory') or '').lower()), []).append(it)
for it in items:
    if it['alternatives']: continue
    if it['origin'] in ('Not made in USA', 'Partly made in USA') or it['union_status'] == 'non-union':
        pool = [x for x in by_sub.get((it['category'], (it.get('subcategory') or '').lower()), []) if x['id'] != it['id']]
        pool.sort(key=lambda x: 0 if x['union_status'] == 'union' else 1)
        it['alternatives'] = [x['id'] for x in pool[:2]]

P.write_text(json.dumps(d, indent=1, ensure_ascii=False))
print(len(items), 'items;', sum(1 for i in items if i['alternatives']), 'with alternatives')
