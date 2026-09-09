# Made in USA Index

A public index of products made in the United States, with union shops marked, plus a Chrome extension that shows that information on retail product pages.

Owner: Trav (union trades, Minnesota). Audience: union members and anyone who wants to buy American and needs to know what is actually made here versus what just has a flag on the box.

## Layout

- `data/index.json` — the index. Single source of truth. Schema in `docs/PHASE2-SPEC.md`.
- `site/` — the public page. `template.html` + data → `index.html` via `scripts/build_site.py`.
- `extension/` — Chrome extension (Manifest V3, plain JS, no build step).
- `scripts/` — build and data maintenance.
- `docs/` — spec, loop description.

## Conventions

- Plain English everywhere the user can read it. No em dashes, no semicolons, no caps for emphasis, no jargon like "verified/flagged/documented".
- Do not add an item to the index without a source URL. Union claims need a union or company source to be "confirmed".
- Keep the extension dependency-free. No bundler, no framework. It must load unpacked from `extension/` as-is.
- `data/index.json` is edited by scripts and the daily research task, not by hand, except for `match` and `alternatives` fields.
- Run `python3 scripts/build_site.py` after any data change and commit the rebuilt `site/index.html`.

## Testing the extension

1. chrome://extensions → Developer mode → Load unpacked → pick `extension/`.
2. Open an Amazon or Home Depot product page for Channellock pliers. Expect a green badge near the price.
3. Open a Milwaukee tool page. Expect a red badge with an alternative.
4. Console filter `[MIUSA]` for logs.

## Related

Live page (artifact): https://claude.ai/code/artifact/9e1c337c-c16f-46d5-8057-364f16981f2b
Daily research task runs in Claude (Cowork) at 6 AM Central. See `docs/LOOP.md`.
