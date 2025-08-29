import { scrapeFoodHallMenu } from './src/scrapers/foodhall';

async function testFoodHallScraper() {
    console.log('Testing Food Hall scraper...');
    try {
        const menuItems = await scrapeFoodHallMenu();
        console.log('Food Hall menu items:', JSON.stringify(menuItems, null, 2));
        console.log(`Found ${menuItems.length} menu items`);

        // Check structure
        menuItems.forEach((item, index) => {
            console.log(`Item ${index + 1}:`);
            console.log(`  Name: ${item.name}`);
            console.log(`  Price: ${item.price}`);
            console.log(`  Day: ${item.day}`);
        });

    } catch (error) {
        console.error('Error testing Food Hall scraper:', error);
    }
}

testFoodHallScraper();
