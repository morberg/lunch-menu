import { scrapeEdisonMenu } from './scrapers/edison';

async function testEdisonScraper() {
    console.log('Testing Edison scraper...');
    try {
        const menu = await scrapeEdisonMenu();
        console.log('Edison menu:', JSON.stringify(menu, null, 2));
    } catch (error) {
        console.error('Error testing Edison scraper:', error);
    }
}

testEdisonScraper();
