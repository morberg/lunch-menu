import { scrapeEdisonMenu } from '../scrapers/edison';
import { scrapeBricksMenu } from '../scrapers/bricks';
import { scrapeKantinMenu } from '../scrapers/kantin';
import { scrapeSmakapakina } from '../scrapers/smakapakina';
import { scrapeEatery } from '../scrapers/eatery';
import { scrapeFoodHallMenu } from '../scrapers/foodhall';
import { scrapeGrendenMenu } from '../scrapers/grenden';
import { MenuItem } from '../types/menu';
import MemoryCache from '../utils/cache';

interface RestaurantMenus {
    edison: MenuItem[];
    bricks: MenuItem[];
    kantin: MenuItem[];
    smakapakina: MenuItem[];
    eatery: MenuItem[];
    foodhall: MenuItem[];
    grenden: MenuItem[];
}

/** Hour of day (local time) at which menus are automatically refreshed. */
const DAILY_REFRESH_HOUR = 10;

/** Returns minutes until the next occurrence of DAILY_REFRESH_HOUR (at least 1 minute). */
function minutesUntilNextRefresh(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(DAILY_REFRESH_HOUR, 0, 0, 0);
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    return Math.max(1, Math.round((next.getTime() - now.getTime()) / 60_000));
}

class MenuService {
    private cache = new MemoryCache<RestaurantMenus>();
    private readonly CACHE_KEY = 'restaurant_menus';
    private refreshTimeout: NodeJS.Timeout | null = null;

    constructor() {
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

    private async fetchAndCacheMenus(): Promise<RestaurantMenus> {
        try {
            console.log('Fetching menus from all restaurants...');

            const [edisonMenu, bricksMenu, kantinMenu, smakapakinaMenu, eateryMenu, foodhallMenu, grendenMenu] = await Promise.allSettled([
                scrapeEdisonMenu(),
                scrapeBricksMenu(),
                scrapeKantinMenu(),
                scrapeSmakapakina(),
                scrapeEatery(),
                scrapeFoodHallMenu(),
                scrapeGrendenMenu()
            ]);

            const result: RestaurantMenus = {
                edison: edisonMenu.status === 'fulfilled' ? edisonMenu.value : [],
                bricks: bricksMenu.status === 'fulfilled' ? bricksMenu.value : [],
                kantin: kantinMenu.status === 'fulfilled' ? kantinMenu.value : [],
                smakapakina: smakapakinaMenu.status === 'fulfilled' ? smakapakinaMenu.value : [],
                eatery: eateryMenu.status === 'fulfilled' ? eateryMenu.value : [],
                foodhall: foodhallMenu.status === 'fulfilled' ? foodhallMenu.value : [],
                grenden: grendenMenu.status === 'fulfilled' ? grendenMenu.value : [],
            };

            // Log any errors
            this.logErrors([
                { name: 'Edison', result: edisonMenu },
                { name: 'Bricks', result: bricksMenu },
                { name: 'Kantin', result: kantinMenu },
                { name: 'Smakapakina', result: smakapakinaMenu },
                { name: 'Eatery', result: eateryMenu },
                { name: 'Food Hall', result: foodhallMenu },
                { name: 'Grenden', result: grendenMenu }
            ]);

            // Cache until next scheduled refresh
            const ttl = minutesUntilNextRefresh();
            this.cache.set(this.CACHE_KEY, result, ttl);
            console.log(`Cached menus for ${ttl} minutes (until next 10:00 refresh)`);

            return result;
        } catch (error) {
            console.error('Error fetching menus:', error);
            // If we have old cached data (even expired), return it
            const staleData = this.cache.getStale(this.CACHE_KEY);
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

    /**
     * Invalidates the cache and immediately fetches fresh menus.
     * Can be called from the /api/menus/refresh endpoint.
     */
    async invalidateCache(): Promise<RestaurantMenus> {
        console.log('Cache invalidated by request');
        this.cache.delete(this.CACHE_KEY);
        return this.fetchAndCacheMenus();
    }

    private scheduleNextRefresh(): void {
        const msUntilNext = minutesUntilNextRefresh() * 60_000;
        const nextTime = new Date(Date.now() + msUntilNext);
        console.log(`Next menu refresh scheduled for ${nextTime.toLocaleTimeString()} (in ${Math.round(msUntilNext / 60_000)} min)`);

        this.refreshTimeout = setTimeout(async () => {
            try {
                console.log('Daily 10:00 refresh triggered');
                await this.fetchAndCacheMenus();
            } catch (error) {
                console.error('Daily refresh failed:', error);
            } finally {
                this.scheduleNextRefresh();
            }
        }, msUntilNext);
    }

    private startBackgroundRefresh(): void {
        // Warm up cache shortly after server start
        setTimeout(() => {
            this.fetchAndCacheMenus().catch(error => {
                console.error('Initial cache population failed:', error);
            });
        }, 1000);

        this.scheduleNextRefresh();
    }

    stopBackgroundRefresh(): void {
        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }
}

// Export singleton instance
export const menuService = new MenuService();
export default MenuService;
