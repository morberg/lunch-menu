# Lunch Menu Scraper

Scrapes lunch menus for selected restaurants in Lund and serves them through a small Vercel-hosted web app.

Restaurants:
- Edison
- Bricks Eatery
- Kantin
- Smaka på Kina
- Eatery
- Food Hall
- Grenden
- Linnea & Basilika
- Troppo

## Runtime

- [src/web/app.ts](src/web/app.ts) fetches menus and embeds them in the rendered home page for Vercel and route tests.
- [src/web/server.ts](src/web/server.ts) starts the local development process.
- Vercel caches the rendered home page until the next 10:00 refresh in `Europe/Stockholm`. Cron requests warm it across daylight-saving changes.

## Development

- First time setup: `make setup` (installs deps + git hooks)
- Development server with reload: `make dev`
- Production-style local server: `make start`
- Full verification: `make check`

## Scraper Fixtures

Test fixtures (HTML snapshots) are in [test/fixtures](test/fixtures) and expected outputs in [test/expected](test/expected).

When a scraper breaks, capture the raw source response, update the matching fixture and expected JSON, add a narrow parser regression test for the markup change, and run `make check`. The expected JSON must describe the fixture, not a live response that may have changed meanwhile.

## Debug a scraper live
```
make debug-<scraper>   # e.g. make debug-grenden
```