# Debug Scripts

## Usage

Run a scraper against the live website from the project root:

```bash
make debug-bricks
make debug-eatery
make debug-edison
make debug-foodhall
make debug-grenden
make debug-kantin
make debug-smakapakina
```

## Files

- `debug.ts` - Unified debug runner (accepts scraper name as argument)
- `profile-scrapers.ts` - Benchmarks parse time for each scraper using fixture files
