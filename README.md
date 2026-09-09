# Made in USA Index

What is still made in the United States, who makes it, and whether the shop is union. A public page plus a Chrome extension that shows the answer on the product page.

- `site/index.html` — the public page (built from `site/template.html` + `data/index.json`)
- `extension/` — Chrome extension, load unpacked, no build step
- `data/index.json` — the index, 368 listings and growing daily
- `docs/PHASE2-SPEC.md` — extension spec and milestones
- `docs/LOOP.md` — how the daily research task works and how to wire it to this repo

## Quick start

    python3 scripts/build_site.py      # rebuild site/index.html from data
    node scripts/test_match.js         # matching tests
    # chrome://extensions -> Load unpacked -> extension/

Read `CLAUDE.md` first if you are Claude Code.
