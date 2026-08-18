# Project Guidelines

## Architecture

- `src/restaurants.ts` is the canonical restaurant registry. The menu service, rendered page, frontend, and debug runner derive runtime behavior from it.
- `getMenus` is the failure boundary for restaurant scrapers. Scrapers should reject on source failures; aggregation logs the error and returns an empty menu for that restaurant.
- `src/web/app.ts` exports the Vercel/test handler. `src/web/server.ts` is the local listener only; do not add listener side effects to the app module.
- Vercel caches the rendered home page until the next Stockholm 10:00 refresh. Do not add a public JSON API without an identified consumer.

## Build and Test

- Use Makefile targets for documented workflows: `make dev`, `make start`, `make debug-<key>`, and `make check`.
- `make check` is required after code changes; it type-checks source, tests, and debug tooling, runs Jest, and builds the deployable output.
- Use `tsx` through the provided targets for TypeScript tooling. Do not run source `.ts` files with `node`.
- Do not deploy or create a commit unless the user explicitly requests it.

## Scraper Changes

- Keep parsing separate from network and file I/O. Capture the raw runtime response as a fixture and add a focused parser regression test for markup drift.
- Reuse `src/utils/scraper.ts` for HTML requests so the shared timeout, headers, and response validation apply.
- Add each restaurant only to `RESTAURANTS` and the fixture-contract case table.
- Use `as const` for literal constant arrays. Define named source-specific constants when a restaurant has a stable published price or label.

## Documentation

- Update [README.md](../README.md) and relevant skills only when their workflows change.
- Search for stale commands, endpoints, and renamed concepts after removing or renaming them.