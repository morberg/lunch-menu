import { parsePrice } from '../../src/utils/price';

describe('parsePrice', () => {
    test.each([
        ['155 kr', 155],
        ['110:-', 110],
        ['99,50 SEK', 99.5],
        ['Lunch: 129', 129],
        ['Pris saknas', null]
    ])('parses %s', (value, expected) => {
        expect(parsePrice(value)).toBe(expected);
    });
});