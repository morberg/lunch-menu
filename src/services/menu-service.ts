import { RESTAURANTS, RestaurantMenu } from '../restaurants';
import { MenuItem } from '../types/menu';
import MemoryCache from '../utils/cache';

/** Hour of day (local time) at which menus are automatically refreshed. */
const DAILY_REFRESH_HOUR = 10;

/** Returns milliseconds until the next occurrence of DAILY_REFRESH_HOUR. */
function millisecondsUntilNextRefresh(): number {
    const now = new Date();
    const next = new Date(now);
    next.setHours(DAILY_REFRESH_HOUR, 0, 0, 0);
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }
    return next.getTime() - now.getTime();
}

class MenuService {
    private cache = new MemoryCache<RestaurantMenu[]>();
    private readonly CACHE_KEY = 'restaurant_menus';
    private refreshTimeout: NodeJS.Timeout | null = null;
    private warmupTimeout: NodeJS.Timeout | null = null;
    private inFlightFetch: Promise<RestaurantMenu[]> | null = null;

    constructor(startBackgroundRefresh: boolean = true) {
        if (startBackgroundRefresh) {
            this.startBackgroundRefresh();
        }
    }

    async getMenus(): Promise<RestaurantMenu[]> {
        // Try to get from cache first
        const cachedMenus = this.cache.get(this.CACHE_KEY);
        if (cachedMenus) {
            console.log('Serving menus from cache');
            return cachedMenus;
        }

        console.log('Cache miss - fetching fresh menus');
        return this.runSingleFlightFetch();
    }

    private runSingleFlightFetch(): Promise<RestaurantMenu[]> {
        if (!this.inFlightFetch) {
            this.inFlightFetch = this.fetchAndCacheMenus()
                .finally(() => {
                    this.inFlightFetch = null;
                });
        }

        return this.inFlightFetch;
    }

    private async fetchAndCacheMenus(): Promise<RestaurantMenu[]> {
        console.log('Fetching menus from all restaurants...');

        const result = await Promise.all(
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

        const ttlMs = millisecondsUntilNextRefresh();
        this.cache.set(this.CACHE_KEY, result, ttlMs);
        console.log('Cached menus until next 10:00 refresh');

        return result;
    }

    /**
     * Invalidates the cache and immediately fetches fresh menus.
     * Can be called from the /api/menus/refresh endpoint.
     */
    async invalidateCache(): Promise<RestaurantMenu[]> {
        console.log('Cache invalidated by request');
        this.cache.delete(this.CACHE_KEY);
        return this.runSingleFlightFetch();
    }

    private scheduleNextRefresh(): void {
        const msUntilNext = millisecondsUntilNextRefresh();
        const nextTime = new Date(Date.now() + msUntilNext);
        console.log(`Next menu refresh scheduled for ${nextTime.toLocaleTimeString()} (in ${Math.round(msUntilNext / 60_000)} min)`);

        this.refreshTimeout = setTimeout(async () => {
            try {
                console.log('Daily 10:00 refresh triggered');
                await this.runSingleFlightFetch();
            } catch (error) {
                console.error('Daily refresh failed:', error);
            } finally {
                this.scheduleNextRefresh();
            }
        }, msUntilNext);
    }

    private startBackgroundRefresh(): void {
        // Warm up cache shortly after server start
        this.warmupTimeout = setTimeout(() => {
            this.runSingleFlightFetch().catch(error => {
                console.error('Initial cache population failed:', error);
            });
        }, 1000);

        this.scheduleNextRefresh();
    }

    stopBackgroundRefresh(): void {
        if (this.warmupTimeout) {
            clearTimeout(this.warmupTimeout);
            this.warmupTimeout = null;
        }

        if (this.refreshTimeout) {
            clearTimeout(this.refreshTimeout);
            this.refreshTimeout = null;
        }
    }
}

// Export singleton instance
export const menuService = new MenuService(process.env.NODE_ENV !== 'test');
export default MenuService;
