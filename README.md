# Lunch Menu Scraper
<!-- See .github/copilot-instructions.md for development guidelines -->

Scrapes lunch menus for selected restaurants in Lund and serves them via a small web app.

Restaurants:
- Edison
- Brick's Eatery
- Kantin
- Smakapåkina
- Eatery
- Food Hall
- Grenden

## API Documentation

The lunch menus are available via a public API. See [API.md](API.md) for complete documentation, or visit `/api/docs` when running the application.

## Quick start
- Run app: make start
- Tests: make test
- Update snapshots: make snapshots

## Snapshot testing (latest HTML only)
Snapshots are kept in [test/fixtures](test/fixtures) and expected outputs in [test/expected](test/expected).

Workflow:
1) make snapshots
2) Update [test/expected](test/expected) as needed
3) make test

## Common Makefile targets
- make build
- make start
- make dev
- make test
- make snapshots

## Debug scripts
Run directly from repo root:
- make debug-eatery
- make debug-foodhall
- make debug-detailed
 