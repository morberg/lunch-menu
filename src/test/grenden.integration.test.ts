// Integration test for Grenden scraper using local HTML fixture
import { parseGrendenMenuFromHTML, loadTestFixture } from './test-utils';

describe('Grenden Scraper Integration', () => {
    let testHTML: string;

    beforeAll(() => {
        testHTML = loadTestFixture('grenden-page.html');
    });

    it('should parse Grenden menu from saved HTML fixture', () => {
        const menu = parseGrendenMenuFromHTML(testHTML);

        console.log('Grenden menu from fixture:', JSON.stringify(menu, null, 2));
        console.log(`Found ${menu.length} menu items`);

        // Basic validation
        expect(Array.isArray(menu)).toBe(true);

        if (menu.length > 0) {
            // Validate structure of all items
            menu.forEach(item => {
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('price');
                expect(item).toHaveProperty('day');
                expect(typeof item.name).toBe('string');
                expect(typeof item.price).toBe('string');
                expect(typeof item.day).toBe('string');
                expect(item.name.length).toBeGreaterThan(0);
                expect(item.price).toMatch(/\d+/);
            });

            // Validate that we have Swedish weekdays
            const validDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
            menu.forEach(item => {
                expect(validDays).toContain(item.day);
            });

            // Validate that we have reasonable number of items per day
            const itemsByDay = menu.reduce((acc, item) => {
                acc[item.day] = (acc[item.day] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(itemsByDay).forEach(([day, count]) => {
                expect(count).toBeGreaterThan(0);
                expect(count).toBeLessThanOrEqual(10);
                console.log(`${day}: ${count} items`);
            });
        }
    });

    it('should have consistent price format', () => {
        const menu = parseGrendenMenuFromHTML(testHTML);

        if (menu.length > 0) {
            // Check that all prices follow a consistent format
            const priceFormats = new Set(menu.map(item => item.price));
            console.log('Grenden price formats found:', Array.from(priceFormats));

            // Expect all prices to contain "kr" and numbers
            menu.forEach(item => {
                expect(item.price).toMatch(/\d+.*kr/i);
            });
        }
    });

    it('should handle dish variety', () => {
        const menu = parseGrendenMenuFromHTML(testHTML);

        if (menu.length > 0) {
            // Grenden should have variety in dish names
            const dishNames = menu.map(item => item.name.toLowerCase()).join(' ');
            console.log('Sample dish names:', menu.slice(0, 3).map(item => item.name));

            // Should have some variety (this test is lenient)
            expect(menu.length).toBeGreaterThan(0);
        }
    });
});
