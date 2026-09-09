// node scripts/test_match.js
const { miusaBuildLookup, miusaMatch } = require('../extension/src/match.js');
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
process.exit(fail ? 1 : 0);
