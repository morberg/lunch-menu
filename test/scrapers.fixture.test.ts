import * as fs from 'fs';
import * as path from 'path';
import { scrapeBricksMenu } from '../src/scrapers/bricks';
import { scrapeEatery } from '../src/scrapers/eatery';
import { scrapeEdisonMenu } from '../src/scrapers/edison';
import { scrapeFoodHallMenu } from '../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../src/scrapers/grenden';
import { scrapeKantinMenu } from '../src/scrapers/kantin';
import { scrapeLinneaBasilikaMenu } from '../src/scrapers/linneabasilika';
import { scrapeSmakapakina } from '../src/scrapers/smakapakina';
import { scrapeTroppoMenu } from '../src/scrapers/troppo';
import { MenuItem } from '../src/types/menu';
import { SWEDISH_DAYS } from '../src/utils/days';

const fixturesDir = path.join(__dirname, 'fixtures');
const expectedDir = path.join(__dirname, 'expected');

type FixtureCase = readonly [string, string, string, (fixtureUrl?: string) => Promise<MenuItem[]>];

const fixtureCases: readonly FixtureCase[] = [
    ['Edison', 'edison.html', 'edison.json', scrapeEdisonMenu],
    ['Bricks', 'bricks.html', 'bricks.json', scrapeBricksMenu],
    ['Kantin', 'kantin.html', 'kantin.json', scrapeKantinMenu],
    ['Smaka på Kina', 'smakapakina.html', 'smakapakina.json', scrapeSmakapakina],
    ['Eatery', 'eatery-menu.pdf', 'eatery.json', scrapeEatery],
    ['Food Hall', 'foodhall.html', 'foodhall.json', scrapeFoodHallMenu],
    ['Grenden', 'grenden.html', 'grenden.json', scrapeGrendenMenu],
    ['Linnea & Basilika', 'linneabasilika.html', 'linneabasilika.json', scrapeLinneaBasilikaMenu],
    ['Troppo', 'troppo.html', 'troppo.json', scrapeTroppoMenu]
] as const;

describe('scraper fixture contracts', () => {
    test.each(fixtureCases)('%s matches its expected menu', async (_name, fixtureName, expectedName, scrape) => {
        const result = await scrape(`file://${path.join(fixturesDir, fixtureName)}`);
        const expected = JSON.parse(fs.readFileSync(path.join(expectedDir, expectedName), 'utf8'));

        validateMenuStructure(result);
        expect(result).toEqual(expected);
    });
});

function validateMenuStructure(items: MenuItem[]): void {
    for (const item of items) {
        expect(item.name).not.toHaveLength(0);
        expect(SWEDISH_DAYS).toContain(item.day);
        expect(typeof item.price === 'number' || item.price === null).toBe(true);
    }
}