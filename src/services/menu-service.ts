import { RESTAURANTS, RestaurantMenu } from '../restaurants';
import { MenuItem } from '../types/menu';

class MenuService {
    async getMenus(): Promise<RestaurantMenu[]> {
        console.log('Fetching menus from all restaurants...');

        return Promise.all(
            RESTAURANTS.map(async ({ key, name, url, scrape }): Promise<RestaurantMenu> => {
                try {
                    return { key, name, url, menu: await scrape() };
                } catch (error) {
                    console.error(`${key} scraper failed:`, error);
                    const emptyMenu: MenuItem[] = [];
                    return { key, name, url, menu: emptyMenu };
                }
            })
        );
    }
}

// Export singleton instance
export const menuService = new MenuService();
export default MenuService;
