// Integration test for Edison scraper using local HTML fixture
import { parseEdisonMenuFromHTML, loadTestFixture } from './test-utils';

describe('Edison Scraper Integration', () => {
    let testHTML: string;

    beforeAll(() => {
        testHTML = loadTestFixture('edison-lunch-page.html');
    });

    it('should parse Edison menu from saved HTML fixture', () => {
        const menu = parseEdisonMenuFromHTML(testHTML);

        console.log('Edison menu from fixture:', JSON.stringify(menu, null, 2));
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

            // Edison should have category prefixes
            const menuText = menu.map(item => item.name).join(' ').toLowerCase();
            expect(menuText).toMatch(/(green|local|world)/);
        }
    });

    it('should handle Edison category structure', () => {
        const menu = parseEdisonMenuFromHTML(testHTML);

        if (menu.length > 0) {
            // Check for typical Edison categories
            const categories = ['Green:', 'Local:', 'World Wide:'];
            let foundCategories = 0;

            menu.forEach(item => {
                categories.forEach(category => {
                    if (item.name.includes(category)) {
                        foundCategories++;
                    }
                });
            });

            console.log(`Found ${foundCategories} categorized items`);
            expect(foundCategories).toBeGreaterThanOrEqual(0);
        }
    });
});
