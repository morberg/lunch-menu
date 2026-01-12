// Throwaway inspection script: parses the local Bricks HTML fixture via the scraper.
// Usage:
//   make build
//   node debug-scripts/inspect-bricks-fixture.js

const path = require('path');
const { scrapeBricksMenu } = require('../dist/scrapers/bricks');

async function main() {
    const fixturePath = path.join(__dirname, '..', 'test', 'fixtures', 'bricks.html');
    const items = await scrapeBricksMenu(`file://${fixturePath}`);

    console.log(`Parsed ${items.length} items from fixture:`);
    for (const item of items) {
        console.log(`[${item.day}] ${item.name} - ${item.price}`);
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
