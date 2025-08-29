import { scrapeKantinMenu } from '../../src/scrapers/kantin';

describe('Kantin Integration Tests', () => {
    it('should correctly combine weekly specials', async () => {
        const menuItems = await scrapeKantinMenu();

        const weeklySpecials = menuItems.filter(item => item.day === 'Weekly Special');

        expect(weeklySpecials).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ name: expect.stringContaining('Veckans vegetariska') }),
                expect.objectContaining({ name: expect.stringContaining('Månadens alternativ') })
            ])
        );
    });
});
