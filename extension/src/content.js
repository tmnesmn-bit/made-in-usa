(async function () {
  const site = MIUSA_SITES[location.hostname];
  if (!site || !site.isProduct()) return;
  const log = (...a) => console.log('[MIUSA]', ...a);

  const { items } = await chrome.runtime.sendMessage({ type: 'getIndex' });
  if (!items) return log('no index');
  const lookup = miusaBuildLookup(items);

  let tries = 0;
  const timer = setInterval(() => {
    const anchor = site.anchor();
    const title = site.title();
    if ((!anchor || !title) && tries++ < 20) return;
    clearInterval(timer);
    if (!anchor) return log('no anchor');
    const brand = site.brand(), origin = site.origin();
    const res = miusaMatch(lookup, brand, title);
    log({ brand, title, origin, match: res && res.item.name });
    render(anchor, res, { brand, title, origin });
  }, 500);

  function render(anchor, res, ctx) {
    const box = document.createElement('div');
    box.className = 'miusa-badge';
    if (res) {
      const it = res.item;
      const origin = res.origin || it.origin;
      const cls = { 'Made in USA': 'usa', 'Partly made in USA': 'part', 'Not made in USA': 'no', 'American business': 'biz', 'Made in Canada': 'can' }[origin] || 'biz';
      box.classList.add('miusa-' + cls);
      const unionBit = it.union_status === 'union' ? ' · ' + it.union : (it.union_status === 'non-union' ? ' · non-union' : '');
      const alt = origin === 'Not made in USA' && it.alternatives && it.alternatives.length
        ? ' Try ' + it.alternatives.map(id => (items.find(x => x.id === id) || {}).name).filter(Boolean).slice(0, 2).join(' or ') + '.' : '';
      box.innerHTML = `<span class="miusa-bug">${cls === 'usa' && it.union_status === 'union' ? 'UNION' : 'USA'}</span>` +
        `<span class="miusa-text"><b>${esc(origin)}</b>${res.why ? ' ' + esc(res.why) : ''}${esc(unionBit)}${esc(alt)}</span><span class="miusa-more">details</span>`;
      box.querySelector('.miusa-more').onclick = () => card(box, it, ctx);
      hoverCard(box, it, ctx);
    } else if (/\b(usa|united states|u\.s\.a)\b/i.test(ctx.origin)) {
      box.classList.add('miusa-grey');
      box.innerHTML = `<span class="miusa-bug">?</span><span class="miusa-text">Site lists USA origin. Not in our index yet.</span><span class="miusa-more">report</span>`;
      box.querySelector('.miusa-more').onclick = () => report(ctx);
    } else return;
    anchor.insertAdjacentElement('afterend', box);
  }

  function card(box, it, ctx) {
    let c = box.nextElementSibling;
    if (c && c.classList.contains('miusa-card')) return c.remove();
    openCard(box, it, ctx);
  }

  function openCard(box, it, ctx) {
    let c = box.nextElementSibling;
    if (c && c.classList.contains('miusa-card')) return c;
    c = document.createElement('div');
    c.className = 'miusa-card';
    const src = (it.sources || []).map(s => `<a href="${esc(s)}" target="_blank" rel="noopener">${esc(s.replace(/^https?:\/\/(www\.)?/, '').slice(0, 50))}</a>`).join('');
    const ol = miusaOriginLines(it);
    c.innerHTML = `<h4>${esc(it.name)}</h4><p>${esc(it.what)}</p>` +
      (ol.plants.length ? `<p><b>Made in:</b> ${ol.plants.map(esc).join(' and ')}</p>` : '') +
      `<p><b>Materials:</b> ${ol.materials.length ? ol.materials.map(esc).join('. ') : 'where the materials come from is not researched yet'}</p>` +
      `<p><b>Union:</b> ${it.union_status === 'union' ? esc(it.union) + ' (' + esc(it.evidence) + ')' : it.union_status}</p>` +
      (it.caveats ? `<p><b>Fine print:</b> ${esc(it.caveats)}</p>` : '') +
      (src ? `<p class="miusa-src">${src}</p>` : '') +
      `<p><a href="#" class="miusa-report">Wrong? Tell us.</a></p>`;
    c.querySelector('.miusa-report').onclick = e => { e.preventDefault(); report({ ...ctx, item: it.id }); };
    box.insertAdjacentElement('afterend', c);
    return c;
  }

  // Hovering the badge opens the card. It stays while the mouse is on the
  // badge or the card and closes shortly after leaving both.
  function hoverCard(box, it, ctx) {
    let openTimer, closeTimer;
    const cancel = () => { clearTimeout(openTimer); clearTimeout(closeTimer); };
    const close = () => { closeTimer = setTimeout(() => { const c = box.nextElementSibling; if (c && c.classList.contains('miusa-card')) c.remove(); }, 350); };
    box.addEventListener('mouseenter', () => {
      cancel();
      openTimer = setTimeout(() => {
        const c = openCard(box, it, ctx);
        c.addEventListener('mouseenter', cancel);
        c.addEventListener('mouseleave', close);
      }, 200);
    });
    box.addEventListener('mouseleave', () => { clearTimeout(openTimer); close(); });
  }

  function report(ctx) {
    chrome.runtime.sendMessage({ type: 'report', payload: { ...ctx, url: location.href, ts: Date.now() } });
    alert('Thanks. Sent: ' + (ctx.brand || '') + ' / ' + ctx.title.slice(0, 60));
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
})();
