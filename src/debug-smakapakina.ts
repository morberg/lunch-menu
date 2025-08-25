import { scrapeSmakapakina } from './scrapers/smakapakina';
import { MenuItem } from './types/menu';

async function debugSmakapakina() {
    try {
        console.log('=== DEBUGGING SMAKAPAKINA SCRAPER ===');
        console.log('Starting scrape...');

        const menuItems = await scrapeSmakapakina();

        console.log(`\n=== RESULTS ===`);
        console.log(`Found ${menuItems.length} menu items`);

        if (menuItems.length > 0) {
            console.log('\n=== MENU ITEMS ===');
            menuItems.forEach((item: MenuItem, index: number) => {
                console.log(`${index + 1}. ${item.day}: ${item.name} - ${item.price}`);
            });

            // Group by day
            const byDay = menuItems.reduce((acc: Record<string, MenuItem[]>, item: MenuItem) => {
                if (!acc[item.day]) acc[item.day] = [];
                acc[item.day].push(item);
                return acc;
            }, {} as Record<string, MenuItem[]>);

            console.log('\n=== GROUPED BY DAY ===');
            Object.entries(byDay).forEach(([day, items]) => {
                console.log(`\n${day}:`);
                items.forEach((item: MenuItem) => {
                    console.log(`  - ${item.name} (${item.price})`);
                });
            });
        } else {
            console.log('No menu items found - parser may have issues');
        }

    } catch (error) {
        console.error('Error in debug:', error);
    }
}

debugSmakapakina();
