---
name: maintain-scraper
description: 'Use when an existing restaurant scraper breaks, its markup drifts, a live lunch menu returns empty data, or a fixture needs replacement. Covers safe live diagnosis, raw fixture capture, focused parser regressions, expected-output updates, and verification. Do not use to add a new restaurant; use add-restaurant-scraper instead.'
---

# Maintain a Scraper

Use this workflow for an existing source only. Keep the repair narrowly scoped to the scraper, its fixtures, and its tests.

## Procedure

1. Run `make debug-<restaurant-key>` to establish the live failure or unexpected output. Do not treat live output as a deterministic test oracle.
2. Identify the actual source: page HTML, JSON/REST response, PDF, or a CMS endpoint. Capture the raw response used by the parser. Do not save cookies, authorization headers, account data, or other secrets in a fixture.
3. Replace the matching fixture with the captured raw source. Keep PDFs as PDFs and JSON as JSON; do not convert them into hand-edited HTML.
4. Repair the pure parser in `src/scrapers/<name>.ts`. Reuse `loadHtmlSource`, day utilities, price parsing, Castit helpers, and HTML text helpers instead of duplicating them.
5. Add or update `test/scrapers/<name>.parser.test.ts` with the smallest case that reproduces the markup change. Cover casing, date labels, week selection, or empty sections when relevant.
6. Update `test/expected/<name>.json` to match the parser output for the fixture, then run the existing snapshot test.
7. Run `make check`. Run `make debug-<restaurant-key>` again only as a live sanity check after the deterministic checks pass.

## Guardrails

- A scraper returns canonical `MenuItem` values: nonempty names, `number | null` prices, and `SWEDISH_DAYS` values only.
- Do not change the restaurant registry, page data, or frontend for a markup-only repair.
- Keep source-specific constants explicit and localized. Do not add broad parsing abstractions unless at least two existing scrapers need them.
- Update [debug documentation](../../../debug/README.md) only when the debug workflow itself changes.