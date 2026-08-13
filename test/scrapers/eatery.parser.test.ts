import * as fs from 'fs';
import * as path from 'path';
import { findEateryLunchMenuPdfUrl } from '../../src/scrapers/eatery';

describe('Eatery source discovery', () => {
    test('finds the lunch PDF in the captured main page', () => {
        const fixturePath = path.join(__dirname, '..', 'fixtures', 'eatery-main.html');
        const html = fs.readFileSync(fixturePath, 'utf8');

        expect(findEateryLunchMenuPdfUrl(html)).toBe(
            'https://static.thatsup.website/462/77098/Lund_sv_V6.pdf?v=1769777752'
        );
    });

    test('resolves a relative lunch PDF link', () => {
        const html = '<a href="/menus/lunch.pdf">Lunchmeny</a>';

        expect(findEateryLunchMenuPdfUrl(html)).toBe('https://eatery.se/menus/lunch.pdf');
    });

    test('ignores lunch links that are not PDFs', () => {
        const html = '<a href="/menus/lunch">Lunchmeny</a>';

        expect(findEateryLunchMenuPdfUrl(html)).toBeNull();
    });
});