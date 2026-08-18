import { RestaurantDefinition } from '../../src/restaurants';
import { getMenus } from '../../src/services/menu-service';

const mondayMenu = [{ name: 'Lunch', day: 'Måndag' as const, price: 100 }];

describe('getMenus', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    afterAll(() => {
        errorSpy.mockRestore();
    });

    test('preserves restaurant order and menu metadata', async () => {
        const restaurants = [
            restaurant('first', jest.fn().mockResolvedValue(mondayMenu)),
            restaurant('second', jest.fn().mockResolvedValue([]))
        ] as const;

        await expect(getMenus(restaurants)).resolves.toEqual([
            { key: 'first', name: 'First', url: 'https://example.com/first', menu: mondayMenu },
            { key: 'second', name: 'Second', url: 'https://example.com/second', menu: [] }
        ]);
    });

    test('isolates a rejected scraper without suppressing successful menus', async () => {
        const restaurants = [
            restaurant('working', jest.fn().mockResolvedValue(mondayMenu)),
            restaurant('failing', jest.fn().mockRejectedValue(new Error('unavailable')))
        ] as const;

        const result = await getMenus(restaurants);

        expect(result.map(({ key, menu }) => ({ key, menu }))).toEqual([
            { key: 'working', menu: mondayMenu },
            { key: 'failing', menu: [] }
        ]);
        expect(errorSpy).toHaveBeenCalledWith('failing scraper failed:', expect.any(Error));
    });
});

function restaurant<Key extends string>(
    key: Key,
    scrape: RestaurantDefinition<Key>['scrape']
): RestaurantDefinition<Key> {
    return {
        key,
        name: key[0].toUpperCase() + key.slice(1),
        url: `https://example.com/${key}`,
        scrape
    };
}
