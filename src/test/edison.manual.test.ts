// Standalone test runner for Edison scraper
import { scrapeEdisonMenu } from '../scrapers/edison';

async function testEdisonScraper() {
    console.log('Testing Edison scraper...');
    try {
        const menu = await scrapeEdisonMenu();
        console.log('Edison menu:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} menu items`);

        // Basic validation
        if (menu.length > 0) {
            console.log('✓ Menu items found');

            const validItems = menu.filter(item =>
                item.name && item.price && item.day &&
                typeof item.name === 'string' &&
                typeof item.price === 'string' &&
                typeof item.day === 'string' &&
                item.name.length > 0 &&
                /\d+/.test(item.price)
            );

            console.log(`✓ ${validItems.length}/${menu.length} items have valid structure`);

            if (validItems.length === menu.length) {
                console.log('✓ All items passed validation');
            } else {
                console.log('⚠ Some items failed validation');
            }
        } else {
            console.log('⚠ No menu items found');
        }

        return menu;
    } catch (error) {
        console.error('✗ Error testing Edison scraper:', error);
        throw error;
    }
}

if (require.main === module) {
    testEdisonScraper()
        .then(() => {
            console.log('✓ Test completed successfully');
            process.exit(0);
        })
        .catch(() => {
            console.log('✗ Test failed');
            process.exit(1);
        });
}
