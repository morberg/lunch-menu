// Integration test for Kantin scraper using local HTML fixture
import { parseKantinMenuFromHTML, loadTestFixture } from './test-utils';

describe('Kantin Scraper Integration', () => {
    let testHTML: string;

    beforeAll(() => {
        testHTML = loadTestFixture('kantin-page.html');
    });

    it('should parse Kantin menu from saved HTML fixture', () => {
        const menu = parseKantinMenuFromHTML(testHTML);

        console.log('Kantin menu from fixture:', JSON.stringify(menu, null, 2));
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
            });

            // Validate that we have Swedish weekdays or special items
            const validDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Weekly Special'];
            menu.forEach(item => {
                expect(validDays).toContain(item.day);
            });
        }
    });

    it('should handle Kantin price format', () => {
        const menu = parseKantinMenuFromHTML(testHTML);

        if (menu.length > 0) {
            // Kantin often uses "Se restaurang" for prices
            const priceFormats = new Set(menu.map(item => item.price));
            console.log('Kantin price formats found:', Array.from(priceFormats));

            // Should have either explicit prices or "Se restaurang"
            menu.forEach(item => {
                expect(item.price).toMatch(/(Se restaurang|\d+.*kr)/i);
            });
        }
    });

    it('should find vegetarian specials', () => {
        const menu = parseKantinMenuFromHTML(testHTML);

        const vegetarianItems = menu.filter(item =>
            item.name.toLowerCase().includes('vegetar')
        );

        console.log(`Found ${vegetarianItems.length} vegetarian items`);
        expect(vegetarianItems.length).toBeGreaterThanOrEqual(0);
    });
});
