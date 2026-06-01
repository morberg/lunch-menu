import { parseKantinMenuFromHtml } from '../../src/scrapers/kantin';

describe('Kantin parser robustness', () => {
    test('parses lowercase weekday labels and normalizes to canonical day names', () => {
        const html = `
            <html>
                <body>
                    <h1>Meny</h1>
                    <div>
                        <p><strong>Veckans vegetariska</strong> - Halloumi med tillbehor</p>
                        <p><strong>måndag</strong> - Kyckling med ris</p>
                        <p><strong>tisdag</strong> - Fisk med potatis</p>
                        <p><strong>onsdag</strong> - Pasta med tomatsas</p>
                        <p><strong>torsdag</strong> - Tacos med salsa</p>
                        <p><strong>fredag</strong> - Burgare med pommes</p>
                    </div>
                </body>
            </html>
        `;

        const result = parseKantinMenuFromHtml(html);

        expect(result).toContainEqual({
            name: 'Veckans vegetariska: Halloumi med tillbehor',
            day: 'Hela veckan',
            price: 145
        });

        expect(result).toContainEqual({
            name: 'Kyckling med ris',
            day: 'Måndag',
            price: 145
        });

        expect(result).toContainEqual({
            name: 'Fisk med potatis',
            day: 'Tisdag',
            price: 145
        });

        expect(result).toContainEqual({
            name: 'Pasta med tomatsas',
            day: 'Onsdag',
            price: 145
        });

        expect(result).toContainEqual({
            name: 'Tacos med salsa',
            day: 'Torsdag',
            price: 145
        });

        expect(result).toContainEqual({
            name: 'Burgare med pommes',
            day: 'Fredag',
            price: 145
        });

        expect(result).toHaveLength(6);
    });
});
