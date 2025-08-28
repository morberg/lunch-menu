import { scrapeEatery } from './scrapers/eatery';

const debugEatery = async () => {
    console.log('=== DEBUGGING EATERY PDF SCRAPING ===\n');

    try {
        const menuItems = await scrapeEatery();

        console.log('\n=== RESULTS ===');
        console.log(`Found ${menuItems.length} menu items:`);

        if (menuItems.length > 0) {
            console.log('\nMenu items by day:');
            const groupedByDay: { [key: string]: any[] } = {};

            menuItems.forEach(item => {
                if (!groupedByDay[item.day]) {
                    groupedByDay[item.day] = [];
                }
                groupedByDay[item.day].push(item);
            });

            Object.keys(groupedByDay).forEach(day => {
                console.log(`\n${day}:`);
                groupedByDay[day].forEach(item => {
                    console.log(`  - ${item.name}`);
                    console.log(`    Price: ${item.price ? item.price + ' kr' : 'No price'}`);
                });
            });
        } else {
            console.log('No menu items found');
        }

    } catch (error) {
        console.error('Error in debug script:', error);
    }
};

debugEatery();
