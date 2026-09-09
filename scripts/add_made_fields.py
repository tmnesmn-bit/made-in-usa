#!/usr/bin/env python3
"""Seed the `made` block on every item in data/index.json.

made = {
  "plants":    [ {"place": "Meadville, Pennsylvania", "note": "", "source": null, "derived": true} ],
  "materials": [ {"material": "steel", "origin": "", "status": "unknown", "source": null} ]
}

Plants are pulled from the entry's own `what` text with a conservative
"City, State" pattern, so they are only as good as the sourced text they
came from. They get "derived": true so the daily research task knows to
verify them and attach a direct source. Materials start empty. The daily
task fills them, each with status confirmed / reported / unknown.

Safe to re-run: never overwrites plants or materials that already exist."""
import json, re, pathlib
P = pathlib.Path(__file__).resolve().parent.parent / 'data' / 'index.json'
d = json.loads(P.read_text(encoding='utf-8'))
items = d['items']

STATES = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming']
ABBR = {'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'}
STATE_RE = re.compile(r'\b([A-Z][a-zA-Z.\']+(?:\s[A-Z][a-zA-Z.\']+)?),\s*(' + '|'.join(STATES) + r'|' + '|'.join(ABBR) + r')\b')
NOT_CITIES = {'The','In','At','From','Its','Their','Local','USW','IAM','UAW','IBEW'}

def plants_from(text):
    out, seen = [], set()
    for m in STATE_RE.finditer(text or ''):
        city, state = m.group(1).strip(), m.group(2)
        state = ABBR.get(state, state)
        if city.split()[0] in NOT_CITIES: continue
        place = f'{city}, {state}'
        if place.lower() in seen: continue
        seen.add(place.lower())
        out.append({'place': place, 'note': '', 'source': None, 'derived': True})
    return out

seeded = 0
for it in items:
    made = it.setdefault('made', {})
    made.setdefault('materials', [])
    if not made.get('plants'):
        made['plants'] = plants_from(it.get('what', '')) or plants_from(it.get('caveats', ''))
        if made['plants']: seeded += 1

P.write_text(json.dumps(d, indent=1, ensure_ascii=False), encoding='utf-8')
have = sum(1 for i in items if i.get('made', {}).get('plants'))
mats = sum(1 for i in items if i.get('made', {}).get('materials'))
print(f'{len(items)} items; {have} with plants ({seeded} newly seeded); {mats} with materials')
