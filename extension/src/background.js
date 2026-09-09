// Service worker: holds the index, refreshes it daily, forwards reports.
const REMOTE_INDEX = 'https://tmnesmn-bit.github.io/made-in-usa/index.json';
const REPORT_URL = ''; // set to a Google Form / Worker endpoint when ready

async function loadBundled() {
  const r = await fetch(chrome.runtime.getURL('data/index.json'));
  return r.json();
}

async function getIndex() {
  const { index } = await chrome.storage.local.get('index');
  if (index && index.items) return index;
  const bundled = await loadBundled();
  await chrome.storage.local.set({ index: bundled });
  return bundled;
}

async function refresh() {
  if (!/^https:\/\/[^\/]+\.[a-z]+\//.test(REMOTE_INDEX) || REMOTE_INDEX.includes('YOURDOMAIN')) return;
  try {
    const r = await fetch(REMOTE_INDEX, { cache: 'no-store' });
    if (!r.ok) return;
    const data = await r.json();
    const cur = await getIndex();
    if (data.items && (data.version || 0) > (cur.version || 0)) await chrome.storage.local.set({ index: data });
  } catch (e) { console.warn('[MIUSA] refresh failed', e); }
}

chrome.runtime.onInstalled.addListener(() => { chrome.alarms.create('refresh', { periodInMinutes: 60 * 24 }); refresh(); });
chrome.alarms.onAlarm.addListener(a => { if (a.name === 'refresh') refresh(); });

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === 'getIndex') { getIndex().then(respond); return true; }
  if (msg.type === 'report') {
    chrome.storage.local.get('reports').then(({ reports = [] }) => chrome.storage.local.set({ reports: [...reports, msg.payload].slice(-200) }));
    if (REPORT_URL) fetch(REPORT_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(msg.payload) }).catch(() => {});
    respond({ ok: true });
  }
});
