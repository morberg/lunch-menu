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
- Run app: `make start`
- Tests: `make test`

## Fixture testing
Test fixtures (HTML snapshots) are in [test/fixtures](test/fixtures) and expected outputs in [test/expected](test/expected).

When a scraper breaks: fetch the new HTML with `curl`, update the fixture and expected output manually, then run `make test`.

## Debug a scraper live
```
make debug-<scraper>   # e.g. make debug-grenden
```