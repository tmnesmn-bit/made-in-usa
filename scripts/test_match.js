// node scripts/test_match.js
const { miusaBuildLookup, miusaMatch, miusaOriginLines } = require('../extension/src/match.js');
const { items } = require('../data/index.json');
const L = miusaBuildLookup(items);
const cases = [
  ['Channellock', 'CHANNELLOCK 430 10-Inch Tongue and Groove Pliers', 'Made in USA'],
  ['Milwaukee', 'Milwaukee M18 FUEL Hammer Drill', 'Not made in USA'],
  ['', 'Red Wing Heritage Iron Ranger Boot', null],
  ['Klein Tools', 'Klein Tools D213-9NE Lineman Pliers', null],
];
let fail = 0;
for (const [b, t, want] of cases) {
  const r = miusaMatch(L, b, t);
  const got = r ? r.origin : null;
  const ok = want === null ? !!r : got === want;
  if (!ok) fail++;
  console.log(ok ? 'ok  ' : 'FAIL', b || '(no brand)', '|', t, '->', r ? r.item.name + ' [' + got + ']' : 'no match');
}
// origin lines: Channellock should have a plant, and materials text should degrade honestly
const ch = items.find(i => i.name === 'Channellock');
const ol = miusaOriginLines(ch);
const plantOk = ol.plants.some(p => p.includes('Meadville, Pennsylvania'));
if (!plantOk) fail++;
console.log(plantOk ? 'ok  ' : 'FAIL', 'origin lines |', 'Channellock ->', JSON.stringify(ol.plants));
const ml = miusaOriginLines({ made: { materials: [{ material: 'steel', origin: 'US mills', status: 'reported' }] } }).materials[0];
const matOk = ml === 'steel: US mills (reported, not confirmed yet)';
if (!matOk) fail++;
console.log(matOk ? 'ok  ' : 'FAIL', 'material line ->', ml);
process.exit(fail ? 1 : 0);
