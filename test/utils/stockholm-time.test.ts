import {
    getNextStockholmRefresh,
    millisecondsUntilNextStockholmRefresh,
    secondsUntilNextStockholmRefresh
} from '../../src/utils/stockholm-time';

describe('Stockholm refresh time', () => {
    test('returns the same-day refresh before 10:00 during CET', () => {
        const now = new Date('2026-01-15T08:59:59.000Z');

        expect(getNextStockholmRefresh(now).toISOString()).toBe('2026-01-15T09:00:00.000Z');
        expect(millisecondsUntilNextStockholmRefresh(now)).toBe(1_000);
        expect(secondsUntilNextStockholmRefresh(now)).toBe(1);
    });

    test('returns the next day after the refresh time during CET', () => {
        const now = new Date('2026-01-15T09:00:00.000Z');

        expect(getNextStockholmRefresh(now).toISOString()).toBe('2026-01-16T09:00:00.000Z');
    });

    test('uses CEST for the next refresh after the spring daylight-saving change', () => {
        const now = new Date('2026-03-28T09:01:00.000Z');

        expect(getNextStockholmRefresh(now).toISOString()).toBe('2026-03-29T08:00:00.000Z');
    });

    test('returns the same-day refresh before 10:00 during CEST', () => {
        const now = new Date('2026-07-15T07:59:59.000Z');

        expect(getNextStockholmRefresh(now).toISOString()).toBe('2026-07-15T08:00:00.000Z');
    });
});