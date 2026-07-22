import {
    ENGLISH_DAYS,
    SWEDISH_DAYS,
    compareDays,
    extractLeadingDay,
    findDay,
    forEachDay,
    parseDay,
    translateEnglishDay
} from '../../src/utils/days';
import type { SwedishDay } from '../../src/utils/days';

describe('day utilities', () => {
    test.each([
        ['Måndag', 'Måndag'],
        ['måndag', 'Måndag'],
        ['Monday', 'Måndag'],
        ['Onsdag 22 Jul', 'Onsdag'],
        ['Onsdag, 22 Jul', 'Onsdag'],
        ['Wednesday 22 Jul', 'Onsdag'],
        ['Tisdag, 21 Jul', 'Tisdag']
    ])('parseDay normalizes %s', (value, expected) => {
        expect(parseDay(value)).toBe(expected);
    });

    test.each(['', 'Lördag', 'Lunchmeny'])('parseDay rejects %s', (value) => {
        expect(parseDay(value)).toBeNull();
    });

    test('findDay recognizes standalone weekdays anywhere in text', () => {
        expect(findDay('Lunchmeny för ONSDAG den 22 juli')).toBe('Onsdag');
        expect(findDay('Menu available on Friday 24 July')).toBe('Fredag');
    });

    test.each([
        'Sweet Tuesday: Vi bjuder på något sött',
        'Det här är en måndagsmeny',
        ''
    ])('findDay does not treat %s as a day header', (value) => {
        expect(findDay(value)).toBeNull();
    });

    test.each([
        ['måndag - Kyckling med ris', { day: 'Måndag', text: 'Kyckling med ris' }],
        ['Tuesday: Fisk med potatis', { day: 'Tisdag', text: 'Fisk med potatis' }],
        ['ONSDAG — Pasta', { day: 'Onsdag', text: 'Pasta' }],
        ['Torsdag', { day: 'Torsdag', text: '' }]
    ])('extractLeadingDay parses %s', (value, expected) => {
        expect(extractLeadingDay(value)).toEqual(expected);
    });

    test('extractLeadingDay rejects text without a leading weekday', () => {
        expect(extractLeadingDay('Veckans vegetariska')).toBeNull();
    });

    test('translates English labels and orders canonical weekdays', () => {
        const unorderedDays: SwedishDay[] = ['Fredag', 'Måndag'];

        expect(ENGLISH_DAYS.map(translateEnglishDay)).toEqual(SWEDISH_DAYS);
        expect(unorderedDays.sort(compareDays)).toEqual(['Måndag', 'Fredag']);
    });

    test('expands a value to every weekday', () => {
        expect(forEachDay({ name: 'Weekly dish' })).toEqual(
            SWEDISH_DAYS.map((day) => ({ name: 'Weekly dish', day }))
        );
    });
});