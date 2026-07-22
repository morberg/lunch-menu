import * as fs from 'fs';
import * as path from 'path';
import { scrapeBricksMenu } from '../src/scrapers/bricks';
import { scrapeEdisonMenu } from '../src/scrapers/edison';
import { scrapeKantinMenu } from '../src/scrapers/kantin';
import { scrapeSmakapakina } from '../src/scrapers/smakapakina';
import { scrapeEatery } from '../src/scrapers/eatery';
import { scrapeFoodHallMenu } from '../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../src/scrapers/grenden';
import { scrapeLinneaBasilikaMenu } from '../src/scrapers/linneabasilika';
import { scrapeTroppoMenu } from '../src/scrapers/troppo';
import { MenuItem } from '../src/types/menu';
import { ALL_WEEK, SWEDISH_DAYS } from '../src/utils/days';

const snapshotsDir = path.join(__dirname, 'fixtures');
const expectedDir = path.join(__dirname, 'expected');

const snapshotFileUrl = (filename: string) => `file://${path.join(snapshotsDir, filename)}`;

const loadExpected = (filename: string): MenuItem[] => {
    const expectedPath = path.join(expectedDir, filename);
    const content = fs.readFileSync(expectedPath, 'utf8');
    return JSON.parse(content);
};

const validateMenuStructure = (items: MenuItem[]) => {
    const allowedDays = [...SWEDISH_DAYS, ALL_WEEK] as const;

    expect(Array.isArray(items)).toBe(true);
    items.forEach((item) => {
        expect(item).toHaveProperty('name');
        expect(item).toHaveProperty('day');
        expect(item).toHaveProperty('price');
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
        expect(typeof item.day).toBe('string');
        expect(allowedDays.includes(item.day)).toBe(true);
        expect(typeof item.price === 'number' || item.price === null).toBe(true);
    });
};

describe('Scraper snapshot tests (latest HTML only)', () => {
    test('Edison snapshot matches expected', async () => {
        const result = await scrapeEdisonMenu(snapshotFileUrl('edison.html'));
        const expected = loadExpected('edison.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Bricks snapshot matches expected', async () => {
        const result = await scrapeBricksMenu(snapshotFileUrl('bricks.html'));
        const expected = loadExpected('bricks.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Kantin snapshot matches expected', async () => {
        const result = await scrapeKantinMenu(snapshotFileUrl('kantin.html'));
        const expected = loadExpected('kantin.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Smakapakina snapshot matches expected', async () => {
        const result = await scrapeSmakapakina(snapshotFileUrl('smakapakina.html'));
        const expected = loadExpected('smakapakina.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Eatery snapshot matches expected', async () => {
        const result = await scrapeEatery(snapshotFileUrl('eatery-menu.pdf'));
        const expected = loadExpected('eatery.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Food Hall snapshot matches expected', async () => {
        const result = await scrapeFoodHallMenu(snapshotFileUrl('foodhall.html'));
        const expected = loadExpected('foodhall.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Grenden snapshot matches expected', async () => {
        const result = await scrapeGrendenMenu(snapshotFileUrl('grenden.html'));
        const expected = loadExpected('grenden.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Linnea & Basilika snapshot matches expected', async () => {
        const result = await scrapeLinneaBasilikaMenu(snapshotFileUrl('linneabasilika.html'));
        const expected = loadExpected('linneabasilika.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });

    test('Troppo snapshot matches expected', async () => {
        const result = await scrapeTroppoMenu(snapshotFileUrl('troppo.html'));
        const expected = loadExpected('troppo.json');
        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });
});
