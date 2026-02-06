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
Build first, then run from repo root:
- make build
- node debug/debug-eatery.js
- node debug/debug-foodhall.js
- node debug/debug-pdf.js
- node debug/debug-detailed.js
 