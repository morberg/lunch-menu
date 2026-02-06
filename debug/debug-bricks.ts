import { scrapeBricksMenu } from '../src/scrapers/bricks';

async function debugBricks() {
    console.log('Running Bricks scraper to see current output...');
    const result = await scrapeBricksMenu();
    console.log(`Found ${result.length} items:`);
    result.forEach((item, index) => {
        console.log(`${index + 1}. [${item.day}] ${item.name} - ${item.price}`);
    });
}

debugBricks().catch((error) => {
    console.error('Error:', error);
});