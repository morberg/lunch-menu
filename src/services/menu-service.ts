import { RestaurantDefinition, RestaurantMenu } from '../restaurants';

export async function getMenus<Key extends string>(
    restaurants: readonly RestaurantDefinition<Key>[]
): Promise<RestaurantMenu<Key>[]> {
    return Promise.all(
        restaurants.map(async ({ key, name, url, scrape }): Promise<RestaurantMenu<Key>> => {
            try {
                return { key, name, url, menu: await scrape() };
            } catch (error) {
                console.error(`${key} scraper failed:`, error);
                return { key, name, url, menu: [] };
            }
        })
    );
}
