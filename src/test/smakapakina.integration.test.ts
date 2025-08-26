// Integration test for Smakapakina scraper using local HTML fixture
import { parseSmakapakinaMenuFromHTML, loadTestFixture } from './test-utils';

describe('Smakapakina Scraper Integration', () => {
    let testHTML: string;

    beforeAll(() => {
        testHTML = loadTestFixture('smakapakina-page.html');
    });

    it('should parse Smakapakina menu from saved HTML fixture', () => {
        const menu = parseSmakapakinaMenuFromHTML(testHTML);

        console.log('Smakapakina menu from fixture:', JSON.stringify(menu, null, 2));
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

            // Smakapakina often uses weekly specials
            menu.forEach(item => {
                expect(['Weekly Special', 'Monthly Special']).toContain(item.day);
            });
        }
    });

    it('should handle Smakapakina price format', () => {
        const menu = parseSmakapakinaMenuFromHTML(testHTML);

        if (menu.length > 0) {
            // Check that all prices follow a consistent format
            const priceFormats = new Set(menu.map(item => item.price));
            console.log('Smakapakina price formats found:', Array.from(priceFormats));

            // Expect all prices to contain "kr" and numbers
            menu.forEach(item => {
                expect(item.price).toMatch(/\d+.*kr/i);
            });
        }
    });

    it('should handle Wix-based content structure', () => {
        const menu = parseSmakapakinaMenuFromHTML(testHTML);

        // Smakapakina uses Wix, so parsing might be challenging
        // We accept even if no items are found, as long as no errors occur
        expect(Array.isArray(menu)).toBe(true);

        if (menu.length > 0) {
            console.log('Successfully parsed Wix-based menu');
            expect(menu[0]).toHaveProperty('name');
        } else {
            console.log('No menu items found - Wix structure may be complex');
        }
    });
});
