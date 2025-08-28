import { scrapeEatery } from '../scrapers/eatery';

describe('Eatery Integration Tests', () => {
    test('should extract menu items from live Eatery website', async () => {
        // Set a longer timeout for PDF processing
        jest.setTimeout(15000);

        const menuItems = await scrapeEatery();
        console.log(`Eatery menu from live site:`, JSON.stringify(menuItems, null, 2));
        console.log(`Found ${menuItems.length} menu items`);

        // Basic validation
        expect(Array.isArray(menuItems)).toBe(true);

        if (menuItems.length > 0) {
            // Validate structure of menu items
            menuItems.forEach(item => {
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('day');
                expect(item).toHaveProperty('price');
                expect(typeof item.name).toBe('string');
                expect(typeof item.day).toBe('string');
                expect(typeof item.price).toBe('number');
            });

            // Check for reasonable day names
            const validDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
            menuItems.forEach(item => {
                expect(validDays).toContain(item.day);
            });

            // Check that menu items have reasonable content
            menuItems.forEach(item => {
                expect(item.name.length).toBeGreaterThan(10);
                expect(item.price).toBe(135); // Fixed price for Eatery
            });

            // Collect price information
            const priceFormats = [...new Set(menuItems.map(item => item.price))];
            console.log('Eatery price formats found:', priceFormats);

            // Should have uniform pricing
            expect(priceFormats.length).toBe(1);
            expect(priceFormats[0]).toBe(135);

            console.log('Successfully parsed PDF-based menu');
        } else {
            console.log('No menu items found - this might be expected if PDF is not available');
        }
    }, 15000);
});
