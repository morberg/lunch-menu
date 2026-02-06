import { scrapeKantinMenu } from '../src/scrapers/kantin';

async function debugKantinLive() {
    console.log('=== DEBUGGING KANTIN SCRAPER (Live Website) ===\n');

    try {
        const menuItems = await scrapeKantinMenu();

        console.log(`Found ${menuItems.length} items from live website`);

        if (menuItems.length > 0) {
            console.log('\n✅ Menu items found:');
            menuItems.forEach((item, i) => {
                const priceStr = item.price ? `${item.price} SEK` : 'no price';
                console.log(`${i + 1}. ${item.day}: ${item.name} - ${priceStr}`);
            });
        } else {
            console.log('❌ No menu items found from live website');
            console.log('This could indicate:');
            console.log('- Website structure has changed');
            console.log('- Website is temporarily unavailable');
            console.log('- Scraper logic needs updating');
        }
    } catch (error) {
        const err = error as Error;
        console.error('❌ Error scraping live Kantin website:', err.message);
        console.error('Stack trace:', err.stack);
    }
}

debugKantinLive().catch((error) => {
    console.error(error);
});