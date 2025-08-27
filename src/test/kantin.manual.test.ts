// Standalone test runner for Kantin scraper
import { scrapeKantinMenu } from '../scrapers/kantin';

async function testKantinScraper() {
    console.log('Testing Kantin scraper...');
    try {
        const menu = await scrapeKantinMenu();
        console.log('Kantin menu:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} menu items`);

        // Basic validation
        if (menu.length > 0) {
            console.log('✓ Menu items found');

            const validItems = menu.filter(item =>
                item.name && item.day &&
                typeof item.name === 'string' &&
                (typeof item.price === 'number' || item.price === null) &&
                typeof item.day === 'string' &&
                item.name.length > 0
            ); console.log(`✓ ${validItems.length}/${menu.length} items have valid structure`);

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
        console.error('✗ Error testing Kantin scraper:', error);
        throw error;
    }
}

if (require.main === module) {
    testKantinScraper()
        .then(() => {
            console.log('✓ Test completed successfully');
            process.exit(0);
        })
        .catch(() => {
            console.log('✗ Test failed');
            process.exit(1);
        });
}
