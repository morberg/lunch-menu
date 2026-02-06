import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import { scrapeBricksMenu } from '../src/scrapers/bricks';
import { scrapeEdisonMenu } from '../src/scrapers/edison';
import { parseKantinMenuFromHtml } from '../src/scrapers/kantin';
import { scrapeSmakapakina } from '../src/scrapers/smakapakina';
import { parsePdfMenu } from '../src/scrapers/eatery';
import { scrapeFoodHallMenu } from '../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../src/scrapers/grenden';
import { MenuItem } from '../src/types/menu';

const snapshotsDir = path.join(__dirname, 'fixtures');
const expectedDir = path.join(__dirname, 'expected');

const snapshotPath = (filename: string) => path.join(snapshotsDir, filename);
const snapshotFileUrl = (filename: string) => `file://${snapshotPath(filename)}`;

const loadExpected = (filename: string): MenuItem[] => {
    const expectedPath = path.join(expectedDir, filename);
    const content = fs.readFileSync(expectedPath, 'utf8');
    return JSON.parse(content);
};

const validateMenuStructure = (items: MenuItem[]) => {
    const allowedDays = [
        'Måndag',
        'Tisdag',
        'Onsdag',
        'Torsdag',
        'Fredag',
        'Hela veckan',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday'
    ];

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

    test('Kantin snapshot matches expected', () => {
        const html = fs.readFileSync(snapshotPath('kantin.html'), 'utf8');
        const result = parseKantinMenuFromHtml(html);
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
        const pdfBuffer = fs.readFileSync(snapshotPath('eatery-menu.pdf'));
        const pdfData = await pdfParse(pdfBuffer);
        const result = parsePdfMenu(pdfData.text);
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
});
