import { RESTAURANTS, RestaurantMenu } from '../restaurants';
import { MenuItem } from '../types/menu';
import MemoryCache from '../utils/cache';

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

        if (this.inFlightFetch) {
            console.log('Cache miss - awaiting in-flight menu fetch');
            return await this.inFlightFetch;
        }

        console.log('Cache miss - fetching fresh menus');
        this.inFlightFetch = this.fetchAndCacheMenus();
        try {
            return await this.inFlightFetch;
        } finally {
            this.inFlightFetch = null;
        }
    }

    private async fetchAndCacheMenus(): Promise<RestaurantMenu[]> {
        try {
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

    /**
     * Invalidates the cache and immediately fetches fresh menus.
     * Can be called from the /api/menus/refresh endpoint.
     */
    async invalidateCache(): Promise<RestaurantMenu[]> {
        console.log('Cache invalidated by request');
        this.cache.delete(this.CACHE_KEY);

        if (this.inFlightFetch) {
            console.log('Awaiting in-flight menu fetch after cache invalidation');
            return await this.inFlightFetch;
        }

        this.inFlightFetch = this.fetchAndCacheMenus();
        try {
            return await this.inFlightFetch;
        } finally {
            this.inFlightFetch = null;
        }
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
        this.warmupTimeout = setTimeout(() => {
            this.fetchAndCacheMenus().catch(error => {
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
