import { parseTroppoHtml } from '../../src/scrapers/troppo';
import { SWEDISH_DAYS } from '../../src/utils/days';

describe('Troppo parser robustness', () => {
    test('parses weekly dishes from monday-friday section with highest price in a range', () => {
        const html = `
            <h2>Monday-Friday</h2>
            <div><div class="w-richtext">
                <p><strong>Five Spice Chicken</strong><strong>or</strong><strong>Shrimp Noodles</strong></p>
                <p>or <strong>Mock Duck</strong></p>
            </div></div>
            <p>Lunch 149-159kr</p>
        `;

        const result = parseTroppoHtml(html);

        expect(result).toEqual(
            ['Five Spice Chicken', 'Shrimp Noodles', 'Mock Duck'].flatMap((name) =>
                SWEDISH_DAYS.map((day) => ({ name, price: 159, day }))
            )
        );
    });

    test('handles lowercase heading and ignores duplicate dish labels', () => {
        const html = `
            <h2>monday-friday</h2>
            <div><div class="w-richtext">
                <p><strong>Mock Duck</strong><strong>or</strong><strong>Mock Duck</strong></p>
            </div></div>
            <p>Lunch 159 kr</p>
        `;

        const result = parseTroppoHtml(html);

        expect(result).toEqual(
            SWEDISH_DAYS.map((day) => ({ name: 'Mock Duck', price: 159, day }))
        );
    });
});
