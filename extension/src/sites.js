// Per-site selectors. Each returns {title, brand, origin, anchor}.
// anchor = element the badge gets inserted after. Keep these dumb and easy to fix when a site changes.
const MIUSA_SITES = {
  'www.amazon.com': {
    isProduct: () => /\/dp\/|\/gp\/product\//.test(location.pathname),
    title: () => text('#productTitle'),
    brand: () => text('#bylineInfo').replace(/^(Visit the|Brand:)\s*/i, '').replace(/\s*Store$/i, ''),
    origin: () => specRow(/country of origin/i),
    anchor: () => document.querySelector('#corePriceDisplay_desktop_feature_div, #apex_desktop, #price, #productTitle')
  },
  'www.homedepot.com': {
    isProduct: () => /\/p\//.test(location.pathname),
    title: () => text('h1'),
    brand: () => text('[data-testid="product-brand"], .product-details__brand, h2.product-details__brand--link'),
    origin: () => specRow(/country of origin|manufactured in/i),
    anchor: () => document.querySelector('[data-testid="price-format"], .price-format__main-price, h1')
  },
  'www.lowes.com': {
    isProduct: () => /\/pd\//.test(location.pathname),
    title: () => text('h1'),
    brand: () => text('[data-selector="splp-prd-brd-nm"], .brand-name, a[href*="/brand/"]'),
    origin: () => specRow(/country of origin/i),
    anchor: () => document.querySelector('[data-selector="splp-prd-prc"], .price, h1')
  },
  'www.grainger.com': {
    isProduct: () => /\/product\//.test(location.pathname),
    title: () => text('h1'),
    brand: () => text('a[href*="/brand/"], [class*="brand"]'),
    origin: () => specRow(/country of origin/i),
    anchor: () => document.querySelector('[class*="price"], h1')
  },
  'www.zoro.com': { isProduct: () => /\/i\//.test(location.pathname), title: () => text('h1'), brand: () => text('a[href*="/brand/"]'), origin: () => specRow(/country of origin/i), anchor: () => document.querySelector('[class*="price"], h1') },
  'www.fastenal.com': { isProduct: () => /\/product\//.test(location.pathname), title: () => text('h1'), brand: () => specRow(/brand|manufacturer/i), origin: () => specRow(/country of origin/i), anchor: () => document.querySelector('[class*="price"], h1') },
  'www.walmart.com': { isProduct: () => /\/ip\//.test(location.pathname), title: () => text('h1'), brand: () => text('a[link-identifier="brandName"], [data-testid="product-brand"]'), origin: () => specRow(/country of origin|assembled in/i), anchor: () => document.querySelector('[itemprop="price"], [data-testid="price-wrap"], h1') },
  'www.menards.com': { isProduct: () => /\/p-/.test(location.pathname), title: () => text('h1'), brand: () => text('[class*="brand"]'), origin: () => specRow(/country of origin/i), anchor: () => document.querySelector('[class*="price"], h1') },
  'www.northerntool.com': { isProduct: () => /\/shop\/tools\/product/.test(location.pathname), title: () => text('h1'), brand: () => text('[class*="brand"]'), origin: () => specRow(/country of origin|made in/i), anchor: () => document.querySelector('[class*="price"], h1') },
  'www.acmetools.com': { isProduct: () => /\/p\//.test(location.pathname) || /\.html$/.test(location.pathname), title: () => text('h1'), brand: () => text('[class*="brand"]'), origin: () => specRow(/country of origin/i), anchor: () => document.querySelector('[class*="price"], h1') },
  'www.ebay.com': { isProduct: () => /\/itm\//.test(location.pathname), title: () => text('h1'), brand: () => specRow(/^brand$/i), origin: () => specRow(/country\/region of manufacture/i), anchor: () => document.querySelector('.x-price-primary, h1') }
};

// Search result pages. Each entry: is this a search page, how to find the
// result tiles, and where the title lives inside a tile. Brand is usually not
// shown on tiles, so matching falls back to scanning the title.
const MIUSA_RESULTS = {
  'www.amazon.com': {
    isSearch: () => location.pathname === '/s' || location.pathname.startsWith('/s/'),
    tiles: () => document.querySelectorAll('div[data-component-type="s-search-result"]'),
    title: t => tileText(t, 'h2'),
    anchor: t => t.querySelector('h2')
  },
  'www.homedepot.com': {
    isSearch: () => /\/s\/|\/b\//.test(location.pathname),
    tiles: () => document.querySelectorAll('[data-testid="product-pod"], div[class*="product-pod"]'),
    title: t => tileText(t, '[data-testid="product-header"], .product-pod__title, header'),
    anchor: t => t.querySelector('[data-testid="product-header"], .product-pod__title, header')
  },
  'www.lowes.com': {
    isSearch: () => /\/search|\/pl\//.test(location.pathname),
    tiles: () => document.querySelectorAll('[data-selector="prd-card"], div[class*="tile"]'),
    title: t => tileText(t, '.description-spn, [class*="description"], h3, a[href*="/pd/"]'),
    anchor: t => t.querySelector('.description-spn, [class*="description"], h3, a[href*="/pd/"]')
  },
  'www.walmart.com': {
    isSearch: () => /^\/search|^\/browse/.test(location.pathname),
    tiles: () => document.querySelectorAll('div[data-item-id]'),
    title: t => tileText(t, '[data-automation-id="product-title"]'),
    anchor: t => t.querySelector('[data-automation-id="product-title"]')
  },
  'www.ebay.com': {
    isSearch: () => location.pathname.startsWith('/sch/'),
    tiles: () => document.querySelectorAll('li.s-item, li[class*="s-item"]'),
    title: t => tileText(t, '.s-item__title'),
    anchor: t => t.querySelector('.s-item__title')
  }
};

function text(sel) { const el = document.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
function tileText(tile, sel) { const el = tile.querySelector(sel); return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

// Finds a "label: value" spec row anywhere on the page. Works on most retail spec tables.
function specRow(labelRe) {
  const cells = document.querySelectorAll('th, td, dt, dd, span, div, li');
  for (const c of cells) {
    if (c.children.length > 2) continue;
    const t = c.textContent.trim();
    if (t.length > 60 || !labelRe.test(t)) continue;
    const next = c.nextElementSibling;
    if (next && next.textContent.trim().length < 60) return next.textContent.trim();
    const m = t.match(/:\s*(.+)$/); if (m) return m[1].trim();
  }
  return '';
}
