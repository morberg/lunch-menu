---
name: add-restaurant-scraper
description: 'Step-by-step workflow for adding a new restaurant lunch-menu scraper to this project. USE WHEN: the user asks to "add a restaurant", "add a scraper", "scrape <restaurant> lunch menu", "support a new lunch place", or wire a new menu source into the app. Covers source discovery (static HTML / WordPress REST / PDF / Castit CMS), creating and registering the scraper, and adding fixtures, snapshots, and tests. DO NOT USE FOR: fixing an existing scraper that broke due to markup drift (just edit the scraper + its parser test), or general TypeScript questions.'
---

# Add a Restaurant Scraper

A scraper fetches one restaurant's weekly lunch menu and returns `MenuItem[]`. All 9 existing
scrapers share one contract and a small set of utilities. Follow the steps in order — each new
scraper touches the same 6-8 files.

## Contract

Every scraper lives in `src/scrapers/<name>.ts` and exports **two** things:

```ts
// Pure parser — takes raw source, returns items. Unit-testable, no I/O.
export function parse<Name>Html(html: string): MenuItem[] { /* ... */ }

// Async wrapper — handles fetch/fixture + errors via scrapeHtmlMenu.
export const scrape<Name>Menu = async (fixtureUrl?: string): Promise<MenuItem[]> =>
    scrapeHtmlMenu({ scraperName: '<Name>', fixtureUrl, url: '<liveUrl>', parseHtml: parse<Name>Html });
```

`MenuItem` (`src/types/menu.ts`) is `{ name: string; price: number | null; day: SwedishDay }`.
`day` MUST be a value from `SWEDISH_DAYS` (`Måndag`…`Fredag`). Expand courses available all week
with `forEachDay({ name, price })`; do not introduce a separate weekly day label.

The `fixtureUrl` parameter is what makes scrapers testable: when it starts with `file://`,
`scrapeHtmlMenu` reads the local fixture instead of hitting the network.

## Step 0 — Discover the source (do this first, do not skip)

Fetch the live page and find where the menu data actually lives. Do not assume the visible page
HTML contains it. Common cases seen in this repo:

| Source type | How to detect | Parse approach | Reference scraper |
|-------------|---------------|----------------|-------------------|
| Static HTML | Menu text is in the page HTML | `cheerio.load(html)` + DOM selectors | `bricks.ts`, `kantin.ts` |
| Fast text scan | Large page, simple text | `htmlToText`/`bodyText` + regex | `smakapakina.ts` |
| WordPress REST | Page HTML only has a cookie banner; site is WP | Hit `…/wp-json/wp/v2/pages?slug=<slug>`, parse `[0].content.rendered` | — |
| PDF | Menu is a linked PDF | Discover PDF URL, `pdfParse` | `eatery.ts` |
| Castit CMS | `.castit-lunch-*` classes present | `parseCastitMenu(html)` | `foodhall.ts`, `grenden.ts` |

Save the exact raw response you parsed as the fixture (`test/fixtures/<name>.html`, or `.json`
for REST/JSON sources). The fixture must be the *same bytes* the parser will receive at runtime.

### JSON / REST endpoints

`loadHtmlSource` uses `axios.get`, which auto-parses JSON into an object. If your source is JSON,
force a raw string so the parser can `JSON.parse` it itself (and so the file fixture round-trips):

```ts
requestConfig: { responseType: 'text', transformResponse: (r) => r }
```

### Non-deterministic menus (multiple weeks / dated headings)

If the source contains several weeks or dated headings, add an injectable reference date so tests
are deterministic:

```ts
export function parse<Name>Html(raw: string, referenceDate: Date = new Date()): MenuItem[] { /* select current week */ }
```

The snapshot test then passes a fixed date. Do not rely on `new Date()` in a snapshot.

## Step 1 — Write the scraper

Create `src/scrapers/<name>.ts`. Reuse utilities in `src/utils/` — do not reimplement them:

- `parsePrice(text)` → `number | null` (handles `"155 kr"`, `"110:-"`, `"99,50"`). Parse prices
  from the page; never hardcode a price unless the site truly has no price anywhere.
- `parseDay(value)` — normalize a Swedish or English weekday at the start of a heading.
- `findDay(value)` — find a standalone weekday later in a line, as needed for PDF text.
- `extractLeadingDay(value)` — extract a leading weekday and the remaining dish text.
- `forEachDay({ name, price })` — expand a course available all week into Monday-Friday items.
- `SWEDISH_DAYS` / `translateEnglishDay(day)` — canonical weekdays and explicit translation.
  Note: there is **no** month-name helper; if you need Swedish months, add a small local lookup const.
- `normalizeWhitespace(text)`, `splitNormalizedLines(text)` — text cleanup.
- `htmlToText(html)`, `bodyText(html)` — fast tag-stripping without a full DOM.

Keep the pure parser free of network/file I/O so it can be unit-tested directly.

## Step 2 — Register the scraper

In `src/restaurants.ts`:
1. Import `scrape<Name>Menu` from `./scrapers/<name>`.
2. Add one `RESTAURANTS` entry with its canonical `key`, display `name`, menu `url`, and `scrape` function.

The menu service, API response, frontend order, and debug runner all derive from this registry. Do not
add separate restaurant entries to those files.

## Step 3 — Fixture + expected output

1. Save the Step 0 raw response to `test/fixtures/<name>.html` (or `.json`).
2. Generate expected output and save it to `test/expected/<name>.json`:
   ```sh
   make debug-<name>          # runs against the LIVE site; sanity-check the items
   ```
   Build the JSON to match the parser's output for the **fixture** (use a fixed reference date if
   the parser takes one), not whatever the live site shows today.

## Step 4 — Tests

In `test/scrapers.snapshot.test.ts`:
1. Import `scrape<Name>Menu`.
2. Add a snapshot test following the existing pattern — load the fixture via `snapshotFileUrl`,
   compare with `loadExpected`, and call `validateMenuStructure`.

Add `test/scrapers/<name>.parser.test.ts` for edge cases (week selection, price parsing,
lowercase day labels). Import the pure `parse<Name>Html` directly. Casing/markup-drift tests are
required for label-based parsers — snapshots alone miss live drift.

## Step 5 — Docs & frontend

- Add the restaurant to `README.md`.
- Add the restaurant to the supported-restaurants table and response example in `API.md`.
- Do not add it to `src/web/views/index.html`; the frontend consumes the canonical registry through the API.

## Step 6 — Verify

```sh
make debug-<name>   # live site returns sensible, priced, correctly-dayed items
make test           # snapshot + structure validation pass
```

## Conventions (from copilot-instructions.md)

- TypeScript only — build before running; use `make` targets, never `node` on `.ts` directly.
- Use `as const` for constant arrays (not `readonly T[]`).
- Warnings are errors; keep it simple; avoid hardcoding.
- Do not commit until `make test` passes.
