import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { scrapeEatery } from '../../src/scrapers/eatery';

const liveDescribe = process.env.LIVE === '1' ? describe : describe.skip;

liveDescribe('Live menu pull checks (set LIVE=1)', () => {
    beforeAll(() => {
        jest.setTimeout(60_000);
    });

    test('Bricks live pull returns items', async () => {
        const items = await scrapeBricksMenu();
        expect(items.length).toBeGreaterThan(0);
    });

    test('Eatery live pull returns items', async () => {
        const items = await scrapeEatery();
        expect(items.length).toBeGreaterThan(0);
    });
});
