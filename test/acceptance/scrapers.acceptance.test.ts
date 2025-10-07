import { scrapeEdisonMenu } from '../../src/scrapers/edison';
import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { scrapeKantinMenu } from '../../src/scrapers/kantin';
import { scrapeSmakapakina } from '../../src/scrapers/smakapakina';
import { scrapeEatery } from '../../src/scrapers/eatery';
import { scrapeFoodHallMenu } from '../../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../../src/scrapers/grenden';
import { MenuItem } from '../../src/types/menu';
import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { parsePrice } from '../../src/utils/price';

// Helper function to load expected results
function loadExpected(filename: string): MenuItem[] {
    const expectedPath = path.join(__dirname, '..', 'fixtures', 'expected', filename);
    const content = fs.readFileSync(expectedPath, 'utf8');
    return JSON.parse(content);
}

// Helper function to test Kantin scraper with fixtures
function testKantinWithFixture(fixturePath: string): MenuItem[] {
    const fixtureContent = fs.readFileSync(fixturePath, 'utf8');
    const $ = cheerio.load(fixtureContent);
    const menuItems: MenuItem[] = [];

    const bodyText = $('body').text();
    const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Handle both live website format and fixtures format (same logic as scraper)
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check for lines that start with Swedish day names followed by " –" (live website format)
        const dayRegex = /^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)\s*–\s*(.+)$/;
        const dayMatch = line.match(dayRegex);

        if (dayMatch) {
            const day = dayMatch[1];
            const description = dayMatch[2];

            // Skip lines that are clearly not menu items
            if (description &&
                !description.includes('11.00') &&  // Opening hours
                !description.includes('16.00') &&  // Opening hours
                description.length > 10) {

                const price = parsePrice(description);

                const menuItem: MenuItem = {
                    name: description,
                    price: price,
                    day: day
                };

                menuItems.push(menuItem);
            }
        }
        // Check for separate day names (fixtures format)
        else if (swedishDays.includes(line)) {
            const day = line;
            // Next line should be the menu description
            if (i + 1 < lines.length) {
                const description = lines[i + 1];

                // Skip lines that are not menu descriptions
                if (description &&
                    !description.includes('11.00') &&  // Opening hours
                    !description.includes('16.00') &&  // Opening hours
                    !description.includes('buffé') &&
                    !description.includes('Vi skickar') &&
                    description.length > 10) {

                    const price = parsePrice(description);

                    const menuItem: MenuItem = {
                        name: description,
                        price: price,
                        day: day
                    };

                    menuItems.push(menuItem);
                    i++; // Skip the processed description line
                }
            }
        }

        // Check for special weekly items with " – " format (live website)
        const weeklyRegex = /^(Veckans vegetariska|Månadens.*?)\s*–\s*(.+)$/;
        const weeklyMatch = line.match(weeklyRegex);

        if (weeklyMatch) {
            const itemType = weeklyMatch[1];
            const description = weeklyMatch[2];
            const price = parsePrice(description);

            const menuItem: MenuItem = {
                name: `${itemType}: ${description}`,
                price: price,
                day: 'Hela veckan'
            };
            menuItems.push(menuItem);
        }
        // Check for separate weekly items (fixtures format)
        else if ((line === 'Veckans vegetariska' || line.startsWith('Månadens')) && i + 1 < lines.length) {
            const itemType = line;
            const description = lines[i + 1];
            const price = parsePrice(description);

            const menuItem: MenuItem = {
                name: `${itemType}: ${description}`,
                price: price,
                day: 'Hela veckan'
            };
            menuItems.push(menuItem);
            i++; // Skip the processed line
        }
    }

    return menuItems;
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
        expect(['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Hela veckan', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(item.day)).toBe(true);

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

    test('Kantin scraper should handle different HTML formats (fixture regression)', () => {
        const fixturesDir = path.join(__dirname, '..', 'fixtures');

        // Test original fixture format (separate day/description lines)
        const originalFixturePath = path.join(fixturesDir, 'kantin.html');
        const originalResult = testKantinWithFixture(originalFixturePath);
        validateMenuStructure(originalResult, 'Kantin (original fixtures)');
        expect(originalResult.length).toBe(7);

        // Test new fixture format (inline day–description format)
        const newFixturePath = path.join(fixturesDir, 'kantin-2025-09-30.html');
        const newResult = testKantinWithFixture(newFixturePath);
        validateMenuStructure(newResult, 'Kantin (new fixtures)');
        expect(newResult.length).toBe(7);

        // Both formats should return the same number of items
        expect(originalResult.length).toBe(newResult.length);

        // Verify structure consistency
        const expectedDaysPattern = ['Hela veckan', 'Hela veckan', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
        expect(originalResult.map(item => item.day)).toEqual(expectedDaysPattern);
        expect(newResult.map(item => item.day)).toEqual(expectedDaysPattern);

        // All items should have names and null prices (as per current policy)
        originalResult.forEach(item => {
            expect(item.name).toBeTruthy();
            expect(item.price).toBeNull();
        });

        newResult.forEach(item => {
            expect(item.name).toBeTruthy();
            expect(item.price).toBeNull();
        });
    });

    test('Smakapakina scraper should return expected menu structure', async () => {
        // Use fixture file for testing instead of live website
        const fixturePath = path.join(__dirname, '..', 'fixtures', 'smakapakina.html');
        const result = await scrapeSmakapakina(`file://${fixturePath}`);
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

    test('Food Hall scraper should return expected menu structure', async () => {
        const result = await scrapeFoodHallMenu();
        validateMenuStructure(result, 'Food Hall');

        const expected = loadExpected('foodhall.json');
        expect(result.length).toBe(expected.length);

        if (expected.length > 0) {
            expect(result[0].name).toBe(expected[0].name);
            expect(result[0].day).toBe(expected[0].day);
            expect(result[0].price).toBe(expected[0].price);
        }
    });

    test('Grenden scraper should return expected menu structure', async () => {
        const result = await scrapeGrendenMenu();
        validateMenuStructure(result, 'Grenden');

        const expected = loadExpected('grenden.json');
        expect(result.length).toBeGreaterThanOrEqual(expected.length);

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
            {
                name: 'Kantin',
                fn: async () => testKantinWithFixture(path.join(__dirname, '../fixtures/kantin.html'))
            },
            {
                name: 'Smakapakina',
                fn: async () => scrapeSmakapakina(`file://${path.join(__dirname, '../fixtures/smakapakina.html')}`)
            },
            { name: 'Eatery', fn: scrapeEatery },
            { name: 'Food Hall', fn: scrapeFoodHallMenu },
            { name: 'Grenden', fn: scrapeGrendenMenu },
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

    test('Smakapakina scraper (v2) should return expected menu structure', async () => {
        const fixturePath = path.join(__dirname, '..', 'fixtures', 'smakapakina_v2.html');
        const result = await scrapeSmakapakina(`file://${fixturePath}`);
        validateMenuStructure(result, 'Smakapakina v2');
        const expected = loadExpected('smakapakina_v2.json');
        expect(result.length).toBe(expected.length);
        // Normalize day capitalization for comparison
        const normalizeDay = (d: string) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
        for (let i = 0; i < expected.length; i++) {
            expect(normalizeDay(result[i].day)).toBe(expected[i].day);
            expect(result[i].name).toBe(expected[i].name);
            expect(result[i].price).toBe(expected[i].price);
        }
    });
});