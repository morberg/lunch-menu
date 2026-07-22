import { RESTAURANTS } from '../src/restaurants';

const name = process.argv[2];
const restaurant = RESTAURANTS.find(({ key }) => key === name);

if (!restaurant) {
    console.error(`Usage: debug.ts <scraper>`);
    console.error(`Available scrapers: ${RESTAURANTS.map(({ key }) => key).join(', ')}`);
    process.exit(1);
}

restaurant.scrape()
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
