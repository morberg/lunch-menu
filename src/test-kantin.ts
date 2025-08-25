import { scrapeKantinMenu } from './scrapers/kantin';

async function testKantinScraper() {
    console.log('Testing Kantin scraper...');
    try {
        const menu = await scrapeKantinMenu();
        console.log('Kantin menu:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} menu items`);
    } catch (error) {
        console.error('Error testing Kantin scraper:', error);
    }
}

testKantinScraper();
