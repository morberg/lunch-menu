import { scrapeBricksMenu } from '../src/scrapers/bricks';
import { scrapeEatery } from '../src/scrapers/eatery';
import { scrapeEdisonMenu } from '../src/scrapers/edison';
import { scrapeFoodHallMenu } from '../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../src/scrapers/grenden';
import { scrapeKantinMenu } from '../src/scrapers/kantin';
import { scrapeSmakapakina } from '../src/scrapers/smakapakina';
import { MenuItem } from '../src/types/menu';

const scrapers: Record<string, () => Promise<MenuItem[]>> = {
    bricks: scrapeBricksMenu,
    eatery: scrapeEatery,
    edison: scrapeEdisonMenu,
    foodhall: scrapeFoodHallMenu,
    grenden: scrapeGrendenMenu,
    kantin: scrapeKantinMenu,
    smakapakina: scrapeSmakapakina
};

const name = process.argv[2];

if (!name || !scrapers[name]) {
    console.error(`Usage: debug.ts <scraper>`);
    console.error(`Available scrapers: ${Object.keys(scrapers).join(', ')}`);
    process.exit(1);
}

scrapers[name]()
    .then((items) => {
        console.log(`${name}: ${items.length} items`);
        items.forEach((item) => {
            const price = item.price != null ? `${item.price} kr` : 'no price';
            console.log(`  [${item.day}] ${item.name} - ${price}`);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });
