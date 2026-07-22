import MemoryCache from '../../src/utils/cache';

describe('MemoryCache', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-07-22T09:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('returns fresh data before expiration', () => {
        const cache = new MemoryCache<string>();
        cache.set('key', 'value', 1000);

        jest.advanceTimersByTime(999);

        expect(cache.get('key')).toBe('value');
    });

    test('expires data at the configured time', () => {
        const cache = new MemoryCache<string>();
        cache.set('key', 'value', 1000);

        jest.advanceTimersByTime(1000);

        expect(cache.get('key')).toBeNull();
    });

    test('deletes data explicitly', () => {
        const cache = new MemoryCache<string>();
        cache.set('key', 'value', 1000);

        cache.delete('key');

        expect(cache.get('key')).toBeNull();
    });
});