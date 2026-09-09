(async () => {
  const idx = await chrome.runtime.sendMessage({ type: 'getIndex' });
  const items = idx.items || [];
  document.getElementById('meta').textContent = items.length + ' listings, version ' + idx.version + ', updated ' + idx.updated;
  const q = document.getElementById('q'), list = document.getElementById('list');
  const cls = { 'Made in USA': 'usa', 'Partly made in USA': 'part', 'Not made in USA': 'no' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function render() {
    const t = q.value.toLowerCase().trim();
    const rows = t ? items.filter(i => (i.name + ' ' + i.what + ' ' + i.union + ' ' + i.category).toLowerCase().includes(t)).slice(0, 30) : [];
    list.innerHTML = rows.map(i => `<li><b>${esc(i.name)}</b><span class="tag ${cls[i.origin] || ''}">${esc(i.origin)}</span>${i.union_status === 'union' ? '<span class="tag u">Union</span>' : ''}<small>${esc(i.what.slice(0, 140))}</small></li>`).join('') || (t ? '<li><small>Nothing found.</small></li>' : '');
  }
  q.addEventListener('input', render);
})();
