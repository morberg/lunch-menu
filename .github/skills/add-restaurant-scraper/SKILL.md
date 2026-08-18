---
name: add-restaurant-scraper
description: 'Use when adding a restaurant, scraper, lunch-menu source, or supported lunch place. Covers source discovery, fixture capture, parser implementation, registry updates, fixture contracts, focused tests, and documentation. Do not use for a broken existing source; use maintain-scraper instead.'
---

# Add a Restaurant Scraper

A scraper fetches one restaurant's weekly lunch menu and returns `MenuItem[]`. A new source normally changes its module, the registry, one raw fixture, one expected output, the fixture-contract table, and focused parser tests.

## 1. Discover the source

Inspect the live page and identify the bytes the parser actually receives. The source may be static HTML, a REST response, a linked PDF, or Castit markup. Save that exact response as `test/fixtures/<name>.<ext>`; do not save cookies, credentials, or hand-converted content.

Useful existing paths:

- Static HTML: `bricks.ts`, `kantin.ts`
- PDF discovery and parsing: `eatery.ts`
- Castit: `foodhall.ts`, `grenden.ts`
- Large text-heavy HTML: `smakapakina.ts`

For JSON sources, make Axios return raw text so fixture and runtime parsing use the same input:

```typescript
requestConfig: { responseType: 'text', transformResponse: (r) => r }
```

## 2. Implement the scraper

Keep parsing free of network and file I/O. Use `scrapeHtmlMenu` for HTML sources and let source failures reject so `getMenus` can isolate them. Reuse existing utilities:

- `parsePrice`
- `parseDay`, `findDay`, `extractLeadingDay`, `forEachDay`
- `normalizeWhitespace`, `splitNormalizedLines`
- `htmlToText`, `bodyText`
- `parseCastitMenu`

Return canonical `MenuItem` values. Expand all-week dishes with `forEachDay`; do not invent a weekly day value. If week selection depends on the date, accept an injectable reference date and use a fixed value in tests.

## 3. Register and test

1. Add one entry to `RESTAURANTS`; no other runtime list should change.
2. Add the raw fixture and author `test/expected/<name>.json` from that fixture.
3. Add the source to `test/scrapers.fixture.test.ts`.
4. Add focused parser tests for behavior not obvious from the fixture, such as casing, dates, week selection, or malformed sections.
5. Add the restaurant to README only if README again contains a user-facing supported-source list.

Do not copy changing live output into expected JSON without comparing it to the captured source.

## 4. Verify

```sh
make debug-<name>
make check
```

The live debug command is a sanity check, not a deterministic oracle.
