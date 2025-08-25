import { scrapeGrendenMenu } from './scrapers/grenden';

(async () => {
    try {
        console.log('Fetching Grenden menu...');
        const menuItems = await scrapeGrendenMenu();

        if (menuItems.length === 0) {
            console.log('No menu items found.');
            return;
        }

        console.log(`Found ${menuItems.length} menu items:`);
        console.log('=====================================\n');

        // Group by day
        const days = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

        for (const day of days) {
            const dayItems = menuItems.filter(item => item.day === day);
            if (dayItems.length > 0) {
                console.log(`${day}:`);
                for (const item of dayItems) {
                    console.log(`  - ${item.name} (${item.price})`);
                }
                console.log('');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
