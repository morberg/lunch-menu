import { scrapeEatery } from '../src/scrapers/eatery';

async function debugEatery() {
    console.log('Running Eatery scraper to see current output...');
    const result = await scrapeEatery();
    console.log(`Found ${result.length} items:`);
    result.forEach((item, index) => {
        console.log(`${index + 1}. [${item.day}] ${item.name} - ${item.price}`);
    });
}

debugEatery().catch((error) => {
    console.error('Error:', error);
});