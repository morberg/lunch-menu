interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache<T> {
    private cache = new Map<string, CacheEntry<T>>();

    set(key: string, data: T, ttlMs: number): void {
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(key, { data, expiresAt });
    }

    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() >= entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    delete(key: string): void {
        this.cache.delete(key);
    }
}

export default MemoryCache;
