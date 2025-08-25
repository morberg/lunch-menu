import { scrapeBricksMenu } from './scrapers/bricks';

async function testBricksScraper() {
    console.log('Testing Bricks scraper...');
    try {
        const menu = await scrapeBricksMenu();
        console.log('Bricks menu:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} menu items`);
    } catch (error) {
        console.error('Error testing Bricks scraper:', error);
    }
}

testBricksScraper();
