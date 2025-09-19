import { scrapeEdisonMenu } from '../../src/scrapers/edison';
import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { scrapeKantinMenu } from '../../src/scrapers/kantin';
import { scrapeSmakapakina } from '../../src/scrapers/smakapakina';
import { scrapeEatery } from '../../src/scrapers/eatery';
import { MenuItem } from '../../src/types/menu';
import * as fs from 'fs';
import * as path from 'path';

// Helper function to load expected results
function loadExpected(filename: string): MenuItem[] {
    const expectedPath = path.join(__dirname, '..', 'fixtures', 'expected', filename);
    const content = fs.readFileSync(expectedPath, 'utf8');
    return JSON.parse(content);
}

// Helper function to validate menu structure
function validateMenuStructure(items: MenuItem[], restaurantName: string) {
    expect(Array.isArray(items)).toBe(true);

    items.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('day');
        expect(item).toHaveProperty('price');

        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);

        expect(typeof item.day).toBe('string');
        expect(['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Hela veckan'].includes(item.day)).toBe(true);

        expect(typeof item.price === 'number' || item.price === null).toBe(true);
        if (item.price !== null) {
            expect(item.price).toBeGreaterThan(0);
        }
    });
}

describe('Scraper Acceptance Tests', () => {
    // Increase timeout for these tests as they may take longer
    const originalTimeout = 30000;

    beforeEach(() => {
        jest.setTimeout(originalTimeout);
    });

    test('Edison scraper should return expected menu structure', async () => {
        const result = await scrapeEdisonMenu();

        // Validate basic structure
        validateMenuStructure(result, 'Edison');

        // Load expected results for detailed comparison
        const expected = loadExpected('edison.json');

        // Compare structure (we don't need exact text match, but structure should be same)
        expect(result.length).toBe(expected.length);

        // Verify we have items for each expected day
        const resultDays = new Set(result.map((item: MenuItem) => item.day));
        const expectedDays = new Set(expected.map((item: MenuItem) => item.day));
        expect(resultDays).toEqual(expectedDays);

        // Verify first few items match expected structure
        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('Bricks scraper should return expected menu structure', async () => {
        const result = await scrapeBricksMenu();
        validateMenuStructure(result, 'Bricks');

        const expected = loadExpected('bricks.json');
        expect(result.length).toBe(expected.length);

        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('Kantin scraper should return expected menu structure', async () => {
        const result = await scrapeKantinMenu();
        validateMenuStructure(result, 'Kantin');

        const expected = loadExpected('kantin.json');
        expect(result.length).toBe(expected.length);

        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('Smakapakina scraper should return expected menu structure', async () => {
        const result = await scrapeSmakapakina();
        validateMenuStructure(result, 'Smakapakina');

        const expected = loadExpected('smakapakina.json');
        expect(result.length).toBe(expected.length);

        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('Eatery scraper should return expected menu structure', async () => {
        const result = await scrapeEatery();
        validateMenuStructure(result, 'Eatery');

        const expected = loadExpected('eatery.json');
        expect(result.length).toBe(expected.length);

        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('All scrapers should return valid menu data', async () => {
        // This test runs all scrapers and ensures they all return valid data
        const scrapers = [
            { name: 'Edison', fn: scrapeEdisonMenu },
            { name: 'Bricks', fn: scrapeBricksMenu },
            { name: 'Kantin', fn: scrapeKantinMenu },
            { name: 'Smakapakina', fn: scrapeSmakapakina },
            { name: 'Eatery', fn: scrapeEatery },
        ];

        for (const scraper of scrapers) {
            try {
                const result = await scraper.fn();
                validateMenuStructure(result, scraper.name);
                console.log(`✓ ${scraper.name}: ${result.length} menu items`);
            } catch (error) {
                throw new Error(`${scraper.name} scraper failed: ${error}`);
            }
        }
    });
});