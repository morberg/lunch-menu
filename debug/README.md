# Debug Scripts

This directory contains debugging scripts for testing individual restaurant scrapers.

## Files

- `debug-eatery.js` - Test the Eatery PDF scraper
- `debug-foodhall.js` - Test the Food Hall scraper
- `debug-pdf.js` - Examine raw PDF text from Eatery fixture
- `debug-detailed.js` - Detailed parsing debug for Eatery with step-by-step output

## Usage

Run from the project root directory:

```bash
# Build the project first
npm run build

# Then run any debug script
node debug/debug-eatery.js
node debug/debug-foodhall.js
node debug/debug-pdf.js
node debug/debug-detailed.js
```

These scripts help debug individual scrapers without running the full test suite.