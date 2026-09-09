// Search result pages. Puts a small chip on each result tile we recognize.
// Hovering the chip opens a card that says whether the thing is made in the
// USA, where it is made, what the materials are and where they come from,
// and the union status. One shared card element follows the hovered chip.
(async function () {
  const site = MIUSA_RESULTS[location.hostname];
  if (!site || !site.isSearch()) return;
  const log = (...a) => console.log('[MIUSA results]', ...a);

  const { items } = await chrome.runtime.sendMessage({ type: 'getIndex' });
  if (!items) return log('no index');
  const lookup = miusaBuildLookup(items);

  const CHIP = {
    'Made in USA': ['usa', 'Made in USA'],
    'Partly made in USA': ['part', 'Partly made in USA'],
    'Not made in USA': ['no', 'Imported'],
    'American business': ['biz', 'American business'],
    'Made in Canada': ['can', 'Made in Canada']
  };

  let card, closeTimer;
  function showCard(chip, it, origin) {
    clearTimeout(closeTimer);
    if (!card) {
      card = document.createElement('div');
      card.className = 'miusa-card miusa-hovercard';
      card.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      card.addEventListener('mouseleave', hideCardSoon);
      document.body.appendChild(card);
    }
    const esc = miusaEsc;
    const ol = miusaOriginLines(it);
    const alt = origin === 'Not made in USA' && it.alternatives && it.alternatives.length
      ? 'Try ' + it.alternatives.map(id => (items.find(x => x.id === id) || {}).name).filter(Boolean).slice(0, 2).join(' or ') + '.' : '';
    card.innerHTML = `<h4>${esc(it.name)}</h4><p><b>${esc(origin)}</b>${alt ? ' ' + esc(alt) : ''}</p>` +
      (ol.plants.length ? `<p><b>Made in:</b> ${ol.plants.map(esc).join(' and ')}</p>` : '') +
      `<p><b>Materials:</b> ${ol.materials.length ? ol.materials.map(esc).join('. ') : 'where the materials come from is not researched yet'}</p>` +
      `<p><b>Union:</b> ${it.union_status === 'union' ? esc(it.union) + ' (' + esc(it.evidence) + ')' : esc(it.union_status)}</p>` +
      (it.caveats ? `<p><b>Fine print:</b> ${esc(it.caveats)}</p>` : '');
    const r = chip.getBoundingClientRect();
    card.style.left = Math.min(r.left, window.innerWidth - 380) + 'px';
    card.style.top = (r.bottom + 6) + 'px';
    card.style.display = 'block';
  }
  function hideCardSoon() { closeTimer = setTimeout(() => { if (card) card.style.display = 'none'; }, 350); }

  function process() {
    let n = 0;
    for (const tile of site.tiles()) {
      if (tile.dataset.miusa) continue;
      tile.dataset.miusa = '1';
      const title = site.title(tile);
      if (!title) continue;
      const res = miusaMatch(lookup, '', title);
      if (!res) continue;
      const [cls, label] = CHIP[res.origin] || ['biz', res.origin];
      const chip = document.createElement('span');
      chip.className = 'miusa-chip miusa-' + cls;
      chip.textContent = label + (res.item.union_status === 'union' && cls === 'usa' ? ' · union' : '');
      chip.addEventListener('mouseenter', () => showCard(chip, res.item, res.origin));
      chip.addEventListener('mouseleave', hideCardSoon);
      const a = site.anchor(tile);
      if (a) a.insertAdjacentElement('afterend', chip); else tile.appendChild(chip);
      n++;
    }
    if (n) log('badged', n, 'tiles');
  }

  process();
  let debounce;
  new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(process, 500); })
    .observe(document.body, { childList: true, subtree: true });
})();

function miusaEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
