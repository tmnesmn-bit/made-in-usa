# The daily research loop

A scheduled Claude task runs every day at 6:00 AM Central. It:

1. Reads the live artifact page, extracts the JSON.
2. Picks a focus. Even days: the thinnest product category. Odd days: the three states with the fewest entries. Every 8th run: re-verify the 20 riskiest entries and check the last 30 days of news.
3. Runs 3 research agents plus a red-team agent that checks every new claim against a second source.
4. Merges, dedupes, bumps the version, republishes the page.

## Keeping this repo in the loop

The scheduled task currently only republishes the artifact. To make it also update this repo:

- Give the task a GitHub token (repo scope) as an environment variable, or run the task from a Claude Code session on a machine that has `gh` authenticated.
- After step 4 it should also: write `data/index.json`, run `python3 scripts/build_site.py`, commit `data/index.json site/index.html`, push to `main`.
- A GitHub Action on push to `main` deploys `site/` to the domain (GitHub Pages or Cloudflare Pages both work with zero config).
- The extension fetches `https://YOURDOMAIN/index.json` daily, so it picks up the change without a store update.

## Reports from the extension

If reports land in `data/reports.jsonl` (one JSON object per line: `{ts, brand, title, url, note}`), the task should read that file first each run and research those brands before its normal focus. Clear handled lines.

## Rules the loop follows

- "Made in USA" is decided per plant and per product line, never per logo.
- Union status counts only when a union or the company says so. Aggregator lists alone = "reported", not "confirmed".
- Plain English in every entry. No em dashes, no semicolons, no caps for emphasis.
- Never pad. If it can't be sourced, it doesn't go in.

## Plants and materials

Every entry has a `made` block (schema in `docs/PHASE2-SPEC.md`). Each run, after the normal focus, the loop also:

- Picks 10 entries whose `made.plants` still say `"derived": true` and finds a direct source for each plant (company page, union page, or press). Attach the source and remove `derived`. If no source can be found, leave it derived.
- Picks 5 entries with an empty `made.materials` list and researches what the product is made from and where those materials come from. Steel, leather, rubber, fabric, electronics. Each material gets a `status`: `confirmed` only when the maker or a union says so with a source, `reported` for aggregator or press mentions, `unknown` otherwise. Empty stays empty rather than guessed.
- Never writes a material origin without a source URL on the entry.
