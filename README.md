# Lunch Menu Scraper

Scrapes lunch menus for restaurants in Lund and serves them through a small Vercel-hosted web app. Supported restaurants are defined in [src/restaurants.ts](src/restaurants.ts).

## Runtime

- [src/web/app.ts](src/web/app.ts) fetches menus and embeds them in the rendered home page.
- [src/web/server.ts](src/web/server.ts) starts the local development process.
- Vercel caches the rendered home page until the next 10:00 refresh in `Europe/Stockholm`. The next page request after expiry fetches fresh menus.

## Development

```sh
npm install
make dev             # development server with reload
make start           # production-style local server
make check           # type-check, test, and build
make debug-<key>     # run one scraper against its live source
```

## Scraper Fixtures

Captured source responses are in [test/fixtures](test/fixtures), with their expected parsed menus in [test/expected](test/expected).