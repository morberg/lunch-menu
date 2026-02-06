import { scrapeGrendenMenu } from '../src/scrapers/grenden';

console.log('Testing Grenden scraper...');
scrapeGrendenMenu()
    .then((menu) => {
        console.log('Grenden Menu:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} items`);

        const weeklyItems = menu.filter((item) => item.day === 'Hela veckan');
        console.log(`\nWeekly items: ${weeklyItems.length}`);
        weeklyItems.forEach((item) => {
            console.log(`  ${item.name} - ${item.price} kr (should be 125 kr)`);
        });

        const specialPriceItems = menu.filter((item) => item.price === 125);
        console.log(`\nItems with 125 kr price: ${specialPriceItems.length}`);
    })
    .catch((error) => {
        console.error('Error:', error);
    });