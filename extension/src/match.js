// Matching logic. Pure functions so they can be unit tested in node.
const MIUSA_STOP = new Set(['the', 'and', 'for', 'with', 'inc', 'llc', 'co', 'company', 'brand', 'store', 'of', 'a']);

function miusaNorm(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w && !MIUSA_STOP.has(w)).join(' ');
}

// Build brand → items lookup once per index load.
function miusaBuildLookup(items) {
  const byBrand = new Map();
  for (const it of items) {
    const keys = new Set([...(it.match && it.match.brand || []), ...(it.aliases || [])].map(miusaNorm));
    if (!keys.size) keys.add(miusaNorm(it.name.split(/[\/(,-]/)[0]));
    for (const k of keys) { if (!k) continue; if (!byBrand.has(k)) byBrand.set(k, []); byBrand.get(k).push(it); }
  }
  return byBrand;
}

// Returns {item, how} or null. how = 'brand' | 'title'.
function miusaMatch(lookup, brand, title) {
  const nb = miusaNorm(brand), nt = ' ' + miusaNorm(title) + ' ';
  const candidates = [];
  if (nb && lookup.has(nb)) candidates.push(...lookup.get(nb).map(i => ({ item: i, how: 'brand' })));
  if (!candidates.length) {
    for (const [k, items] of lookup) if (k.length > 3 && nt.includes(' ' + k + ' ')) candidates.push(...items.map(i => ({ item: i, how: 'title' })));
  }
  if (!candidates.length) return null;
  // Apply include/exclude keywords against the title. First candidate that passes wins.
  const ORDER = { 'Made in USA': 0, 'Partly made in USA': 1, 'Not made in USA': 2, 'American business': 3, 'Made in Canada': 4 };
  candidates.sort((a, b) => (ORDER[a.item.origin] ?? 9) - (ORDER[b.item.origin] ?? 9));
  for (const c of candidates) {
    const m = c.item.match || {};
    const inc = (m.include || []).map(miusaNorm), exc = (m.exclude || []).map(miusaNorm);
    const excHit = exc.some(k => k && nt.includes(' ' + k + ' '));
    const incHit = inc.some(k => k && nt.includes(' ' + k + ' '));
    if (excHit) return { ...c, origin: 'Not made in USA', why: 'This line is imported.' };
    if (inc.length && !incHit) continue;
    if (incHit && c.item.origin === 'Partly made in USA') return { ...c, origin: 'Made in USA', why: 'This line is US-made.' };
    return { ...c, origin: c.item.origin };
  }
  return { ...candidates[0], origin: candidates[0].item.origin };
}

if (typeof module !== 'undefined') module.exports = { miusaNorm, miusaBuildLookup, miusaMatch };
