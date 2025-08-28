import MemoryCache from '../../src/utils/cache';

describe('MemoryCache', () => {
    let cache: MemoryCache<string>;

    beforeEach(() => {
        cache = new MemoryCache<string>();
    });

    describe('basic operations', () => {
        it('should store and retrieve data', () => {
            cache.set('key1', 'value1', 60);
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return null for non-existent keys', () => {
            expect(cache.get('nonexistent')).toBeNull();
        });

        it('should check if key exists', () => {
            cache.set('key1', 'value1', 60);
            expect(cache.has('key1')).toBe(true);
            expect(cache.has('nonexistent')).toBe(false);
        });

        it('should delete keys', () => {
            cache.set('key1', 'value1', 60);
            cache.delete('key1');
            expect(cache.get('key1')).toBeNull();
        });

        it('should clear all data', () => {
            cache.set('key1', 'value1', 60);
            cache.set('key2', 'value2', 60);
            cache.clear();
            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
        });
    });

    describe('TTL (Time To Live)', () => {
        beforeEach(() => {
            jest.useFakeTimers();
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        it('should expire data after TTL', () => {
            cache.set('key1', 'value1', 1); // 1 minute TTL

            // Should be available immediately
            expect(cache.get('key1')).toBe('value1');

            // Fast forward time by 61 seconds (1 minute + 1 second)
            jest.advanceTimersByTime(61 * 1000);

            // Should be expired
            expect(cache.get('key1')).toBeNull();
        });

        it('should not expire data before TTL', () => {
            cache.set('key1', 'value1', 2); // 2 minutes TTL

            // Fast forward by 1 minute
            jest.advanceTimersByTime(60 * 1000);

            // Should still be available
            expect(cache.get('key1')).toBe('value1');
        });

        it('should return correct size after cleaning expired entries', () => {
            cache.set('key1', 'value1', 1);
            cache.set('key2', 'value2', 2);

            expect(cache.size()).toBe(2);

            // Expire key1
            jest.advanceTimersByTime(61 * 1000);

            // Size should reflect cleaned cache
            expect(cache.size()).toBe(1);
        });
    });

    describe('complex data types', () => {
        it('should handle objects', () => {
            const objectCache = new MemoryCache<{ name: string; value: number }>();
            const data = { name: 'test', value: 123 };
            objectCache.set('object', data, 60);
            expect(objectCache.get('object')).toEqual(data);
        });

        it('should handle arrays', () => {
            const arrayCache = new MemoryCache<(string | number)[]>();
            const data = [1, 2, 3, 'test'];
            arrayCache.set('array', data, 60);
            expect(arrayCache.get('array')).toEqual(data);
        });
    });
});
