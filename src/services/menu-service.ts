import { scrapeEdisonMenu } from '../scrapers/edison';
import { scrapeBricksMenu } from '../scrapers/bricks';
import { scrapeKantinMenu } from '../scrapers/kantin';
import { scrapeSmakapakina } from '../scrapers/smakapakina';
import { scrapeGrendenMenu } from '../scrapers/grenden';
import { scrapeEatery } from '../scrapers/eatery';
import { MenuItem } from '../types/menu';
import MemoryCache from '../utils/cache';

interface RestaurantMenus {
    edison: MenuItem[];
    bricks: MenuItem[];
    kantin: MenuItem[];
    smakapakina: MenuItem[];
    grenden: MenuItem[];
    eatery: MenuItem[];
}

class MenuService {
    private cache = new MemoryCache<RestaurantMenus>();
    private readonly CACHE_KEY = 'restaurant_menus';
    private readonly CACHE_TTL_MINUTES = 240; // 4 hours
    private refreshInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start background refresh on service initialization
        this.startBackgroundRefresh();
    }

    async getMenus(): Promise<RestaurantMenus> {
        // Try to get from cache first
        const cachedMenus = this.cache.get(this.CACHE_KEY);
        if (cachedMenus) {
            console.log('Serving menus from cache');
            return cachedMenus;
        }

        console.log('Cache miss - fetching fresh menus');
        return await this.fetchAndCacheMenus();
    }

    async refreshMenus(): Promise<RestaurantMenus> {
        console.log('Manually refreshing menus');
        return await this.fetchAndCacheMenus();
    }

    private async fetchAndCacheMenus(): Promise<RestaurantMenus> {
        try {
            console.log('Fetching menus from all restaurants...');

            const [edisonMenu, bricksMenu, kantinMenu, smakapakinaMenu, grendenMenu, eateryMenu] = await Promise.allSettled([
                scrapeEdisonMenu(),
                scrapeBricksMenu(),
                scrapeKantinMenu(),
                scrapeSmakapakina(),
                scrapeGrendenMenu(),
                scrapeEatery()
            ]);

            const result: RestaurantMenus = {
                edison: edisonMenu.status === 'fulfilled' ? edisonMenu.value : [],
                bricks: bricksMenu.status === 'fulfilled' ? bricksMenu.value : [],
                kantin: kantinMenu.status === 'fulfilled' ? kantinMenu.value : [],
                smakapakina: smakapakinaMenu.status === 'fulfilled' ? smakapakinaMenu.value : [],
                grenden: grendenMenu.status === 'fulfilled' ? grendenMenu.value : [],
                eatery: eateryMenu.status === 'fulfilled' ? eateryMenu.value : [],
            };

            // Log any errors
            this.logErrors([
                { name: 'Edison', result: edisonMenu },
                { name: 'Bricks', result: bricksMenu },
                { name: 'Kantin', result: kantinMenu },
                { name: 'Smakapakina', result: smakapakinaMenu },
                { name: 'Grenden', result: grendenMenu },
                { name: 'Eatery', result: eateryMenu }
            ]);

            // Cache the result
            this.cache.set(this.CACHE_KEY, result, this.CACHE_TTL_MINUTES);
            console.log(`Cached menus for ${this.CACHE_TTL_MINUTES} minutes`);

            return result;
        } catch (error) {
            console.error('Error fetching menus:', error);
            // If we have old cached data, return it even if expired
            const staleData = this.cache.get(this.CACHE_KEY);
            if (staleData) {
                console.log('Returning stale cached data due to fetch error');
                return staleData;
            }
            throw error;
        }
    }

    private logErrors(results: Array<{ name: string; result: PromiseSettledResult<MenuItem[]> }>) {
        results.forEach(({ name, result }) => {
            if (result.status === 'rejected') {
                console.error(`${name} scraper failed:`, result.reason);
            }
        });
    }

    private startBackgroundRefresh(): void {
        // Refresh every 2 hours (cache expires after 4 hours)
        const refreshIntervalMs = 2 * 60 * 60 * 1000; // 2 hours

        this.refreshInterval = setInterval(async () => {
            try {
                console.log('Background refresh triggered');
                await this.fetchAndCacheMenus();
            } catch (error) {
                console.error('Background refresh failed:', error);
            }
        }, refreshIntervalMs);

        // Initial cache population
        setTimeout(() => {
            this.fetchAndCacheMenus().catch(error => {
                console.error('Initial cache population failed:', error);
            });
        }, 1000); // Delay to let server start
    }

    stopBackgroundRefresh(): void {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    getCacheStats(): { hasData: boolean; size: number } {
        return {
            hasData: this.cache.has(this.CACHE_KEY),
            size: this.cache.size()
        };
    }
}

// Export singleton instance
export const menuService = new MenuService();
export default MenuService;
