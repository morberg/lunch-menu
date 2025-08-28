import { parsePrice, formatPrice } from '../../src/utils/price';
import { priceTestCases } from '../helpers/test-data';

describe('Price Utils', () => {
    describe('parsePrice', () => {
        it.each(priceTestCases.filter(tc => tc.expected !== null))(
            'should parse valid price format "$input" to $expected',
            ({ input, expected }) => {
                expect(parsePrice(input)).toBe(expected);
            }
        );

        it.each(priceTestCases.filter(tc => tc.expected === null))(
            'should return null for invalid price format "$input"',
            ({ input }) => {
                expect(parsePrice(input)).toBeNull();
            }
        );

        it('should handle edge cases', () => {
            expect(parsePrice('0 kr')).toBe(0);
            expect(parsePrice('999999 kr')).toBe(999999);
            expect(parsePrice('   89 kr   ')).toBe(89); // whitespace
            expect(parsePrice('89KR')).toBe(89); // case insensitive
        });

        it('should handle Swedish decimal formats', () => {
            expect(parsePrice('89,50 kr')).toBe(89.5);
            expect(parsePrice('89.50 kr')).toBe(89.5);
            expect(parsePrice('89,00 kr')).toBe(89);
        });
    });

    describe('formatPrice', () => {
        it('should format whole number prices', () => {
            expect(formatPrice(89)).toBe('89 kr');
            expect(formatPrice(120)).toBe('120 kr');
            expect(formatPrice(0)).toBe('0 kr');
        });

        it('should format decimal prices with correct precision', () => {
            expect(formatPrice(99.5)).toBe('99.50 kr');
            expect(formatPrice(49.25)).toBe('49.25 kr');
            expect(formatPrice(89.0)).toBe('89 kr'); // Should not show .00
        });

        it('should format null prices as dash', () => {
            expect(formatPrice(null)).toBe('-');
        });

        it('should handle edge cases', () => {
            expect(formatPrice(0)).toBe('0 kr');
            expect(formatPrice(999999)).toBe('999999 kr');
            expect(formatPrice(0.01)).toBe('0.01 kr');
        });
    });
});
