# Phase 2: Made in USA Index browser extension

Owner: Trav. Status: spec approved, starter code in `extension/`.

## What it does

When you are looking at a product on a shopping site, the extension tells you, right next to the price, whether that thing is made in the United States, whether the shop is union, and what to buy instead if it is not. It uses the same index as the public page (`data/index.json`), which a daily research job keeps growing.

## Why an extension and not just the page

The page gets used once. The extension shows up at the moment someone is about to buy the wrong thing. That is where the value is for a union member trying to spend their money on American work.

## Target sites (v1)

amazon.com, homedepot.com, lowes.com, grainger.com, zoro.com, fastenal.com, walmart.com, menards.com, northerntool.com, acmetools.com, ebay.com (product pages only).

Search-result pages come later (v1.1). Product detail pages first.

As of v0.3 the extension runs on every http and https page with dumb generic selectors (h1 title, brand and country of origin spec rows). The named sites above keep their tuned selectors. On unknown sites the badge only appears when the index matches or the page itself names a country of origin, so ordinary pages stay untouched. Search result chips stay site-specific.

## How matching works

1. Content script reads the product title, brand field, and "country of origin" spec row if the site shows one. No screenshots. The text is already in the DOM.
2. Normalize: lowercase, strip punctuation, drop stopwords.
3. Match order:
   a. Exact brand match against `name` and `aliases` in the index.
   b. Brand plus product-line keywords (for brands with mixed origin, e.g. Red Wing: only the Red Wing, Minnesota plant styles are US-made). The `caveats` text is not used for matching; a new `match` block on each item is (see schema).
   c. If the site's own spec row says "Country of Origin: USA" but the brand is not in the index, show a grey "site says USA, not in our index yet" badge and offer the report button.
4. If nothing matches, show nothing except a small collapsed icon. Do not nag.

## Badge states

| State | Color | Text |
|---|---|---|
| Made in USA, union | green with union bug | "Made in USA. USW Local 1917, Meadville PA." |
| Made in USA, non-union | green | "Made in USA. Plant: Ashland City TN." |
| Partly made in USA | yellow | "Some of this line is US-made. Check the tag. Look for ..." |
| Not made in USA (known trap) | red | "Imported. Try Channellock instead." (alternative comes from `alternatives` in the index) |
| Not in index, site says USA | grey | "Site lists USA origin. Not in our index yet. Report it." |
| Unknown | none | collapsed icon only |

Hover or click opens a card with the full entry: what, union, evidence level, fine print, sources, and a "wrong? tell us" link.

## Data flow

- Extension ships with a bundled copy of `data/index.json` so it works day one.
- On startup and every 24 hours it fetches `https://YOURDOMAIN/index.json` (same file the site uses) and replaces the bundled copy in `chrome.storage.local`.
- The daily research job publishes the artifact page AND writes `data/index.json` to this repo. A GitHub Action (or the same job) copies it to the domain. See `docs/LOOP.md`.
- Reports from the "not in index" button go to a simple endpoint (Google Form, Airtable, or a Cloudflare Worker that appends to `data/reports.jsonl`). The daily job reads reports first and prioritizes them.

## Schema additions (index.json items)

Existing fields stay. Add:

```json
"aliases": ["channellock", "channel lock"],
"match": {
  "brand": ["channellock"],
  "include": ["pliers", "tongue and groove", "linesman", "cutter"],
  "exclude": ["screwdriver", "ratchet", "wrench set"]
},
"alternatives": ["<id of a Made in USA item in the same subcategory>"]
```

`include`/`exclude` are lowercase keywords tested against the product title. Empty `include` means the brand match is enough. This is how "Partly made in USA" brands give a correct answer per product.

The `scripts/add_match_fields.py` script seeds `aliases` and `match.brand` from `name` for all current items. `include`/`exclude` get filled by the daily job and by hand.

Each item also carries a `made` block that says where the thing is made and what it is made from:

```json
"made": {
  "plants": [
    { "place": "Meadville, Pennsylvania", "note": "forging and finishing", "source": "https://...", "derived": true }
  ],
  "materials": [
    { "material": "steel", "origin": "US mills", "status": "confirmed", "source": "https://..." }
  ]
}
```

Rules for `made`:

- `plants` with `"derived": true` were pulled out of the entry's own sourced text by `scripts/add_made_fields.py`. The daily job upgrades them by attaching a direct `source` and removing `derived`.
- Every `materials` entry has a `status`: `confirmed` (the maker or a union says so, with a source), `reported` (an aggregator or press mention), or `unknown`. Nothing gets shown as fact without a source.
- An empty `materials` list means not researched yet, and the extension says exactly that.

The hover card (product pages and search result tiles) shows: the verdict, the plants, the materials with their status, the union status, and the fine print.

## Privacy

No accounts. No browsing history leaves the machine. The only outbound calls are: fetching `index.json`, and the report button (user-initiated, sends brand + product title + URL). Say this plainly in the store listing.

## Chrome Web Store

- Manifest V3. Permissions: `storage`, `alarms`, host permissions for the target sites only. No `tabs`, no `<all_urls>`.
- Store listing needs: 5 screenshots, a 128px icon, a privacy policy URL (one paragraph on the site), and the same About text as the page.
- Review takes a few days. First submission usually gets a question about host permissions; the answer is "to read product titles on the listed retail sites."

## Milestones

1. **v0.1 (this repo):** loads, matches by brand, shows badge on Amazon and Home Depot product pages, popup with entry card.
2. **v0.2:** all 11 sites, `include`/`exclude` matching, alternatives, report button.
3. **v0.3:** remote index refresh, store submission, privacy page.
4. **v1.1:** search result pages (badge per result tile).
5. **Phase 3:** phone. Barcode scan and photo of a tag in the store. Separate project.

## Open decisions for Trav

- Domain name and product name (index page currently titled "Made in USA Index").
- Where reports go (Google Form is zero-code; a Worker is nicer).
- Whether the mascot goes on the badge in v0.1 or waits.
