import { parseDay } from '../../src/utils/swedish-days';

describe('Swedish day utilities', () => {
    test('parseDay handles Swedish and English day names and headers', () => {
        expect(parseDay('Måndag')).toBe('Måndag');
        expect(parseDay('Monday')).toBe('Måndag');
        expect(parseDay('Onsdag 22 Jul')).toBe('Onsdag');
        expect(parseDay('Onsdag, 22 Jul')).toBe('Onsdag');
        expect(parseDay('Wednesday 22 Jul')).toBe('Onsdag');
        expect(parseDay('Tisdag, 21 Jul')).toBe('Tisdag');
        expect(parseDay('')).toBeNull();
    });
});
