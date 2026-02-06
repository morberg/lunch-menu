# Debug Scripts

This directory contains debugging scripts for testing individual restaurant scrapers.

## Files

- `debug-bricks.ts` - Test Brick's scraper
- `debug-detailed.ts` - Detailed parsing debug for Eatery with step-by-step output
- `debug-eatery.ts` - Test the Eatery PDF scraper
- `debug-foodhall.ts` - Test the Food Hall scraper
- `debug-grenden.ts` - Test Grenden scraper
- `debug-kantin.ts` - Test Kantin live scraper
- `debug-smakapakina.ts` - Test Smaka på Kina scraper

## Usage

Run from the project root directory:

```bash
make debug-bricks
make debug-detailed
make debug-eatery
make debug-foodhall
make debug-grenden
make debug-kantin
make debug-smakapakina
```

These scripts help debug individual scrapers without running the full test suite.