import { parseKantinMenuFromHtml } from '../../src/scrapers/kantin';
import { SWEDISH_DAYS } from '../../src/utils/days';

describe('Kantin parser robustness', () => {
    test.each([
        '<p><b><span>Måndag 28/9</span></b><span>Kyckling <strong>med ris</strong></span></p>',
        '<div><span>måndag 28/9</span><br />Kyckling<br /><span>med ris</span></div>',
        '<div><b>Måndag 28/9</b></div><p>Kyckling</p><div><span>med ris</span></div>'
    ])('preserves dish text across inline formatting and block variants: %s', (markup) => {
        expect(parseKantinMenuFromHtml(`<div><h1>Meny</h1>${markup}</div>`)).toEqual([
            { name: 'Kyckling med ris', day: 'Måndag', price: 145 }
        ]);
    });

    test('ignores empty labels and content outside the menu container', () => {
        const html = `
            <div><h1>Meny</h1><div><b>Måndag</b></div><div><b>Tisdag</b></div><div>Fisk</div><div>Onsdag</div></div>
            <div><p>Torsdag - Catering</p><p>Fredag - Kontakt</p></div>
        `;

        expect(parseKantinMenuFromHtml(html)).toEqual([
            { name: 'Fisk', day: 'Tisdag', price: 145 }
        ]);
    });

    test('parses pasted div markup with weekday labels separate from dishes', () => {
        const html = `
            <div>
                <h1>Meny 28/9 - 2/10</h1>
                <p><strong>Veckans vegetariska:<br /></strong>Quinoa</p>
                <p><strong>Månadens alternativ:<br /></strong>Sandwich</p>
                <div><b><span>Måndag</span><span><br /></span></b><span>Kyckling<br /><br /></span><b>Tisdag<br /></b></div>
                <div><span>Pulled pork<br /></span></div>
                <div>&nbsp;</div>
                <div><b><span>Onsdag</span></b><br /></div>
                <div>Ankbröst<br /></div>
                <div><b>Torsdag - Råbiffstorsdag</b></div>
                <div><b></b><span>Oxtartar<br /><br /></span><b>Fredag<br /></b></div>
                <div>Picanha</div>
            </div>
        `;

        const result = parseKantinMenuFromHtml(html);

        expect(result).toHaveLength(15);
        expect(result.filter((item) => !item.name.includes(':'))).toEqual([
            { name: 'Kyckling', day: 'Måndag', price: 145 },
            { name: 'Pulled pork', day: 'Tisdag', price: 145 },
            { name: 'Ankbröst', day: 'Onsdag', price: 145 },
            { name: 'Råbiffstorsdag Oxtartar', day: 'Torsdag', price: 145 },
            { name: 'Picanha', day: 'Fredag', price: 145 }
        ]);
    });

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

        for (const day of SWEDISH_DAYS) {
            expect(result).toContainEqual({
                name: 'Veckans vegetariska: Halloumi med tillbehor',
                day,
                price: 145
            });
        }

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

        expect(result).toHaveLength(10);
    });

    test('strips dates appended to weekday labels', () => {
        const html = `
            <html>
                <body>
                    <h1>Meny</h1>
                    <div>
                        <p><strong>måndag 11/8</strong> - Kyckling med ris</p>
                    </div>
                </body>
            </html>
        `;

        const result = parseKantinMenuFromHtml(html);

        expect(result).toEqual([
            {
                name: 'Kyckling med ris',
                day: 'Måndag',
                price: 145
            }
        ]);
    });

    test('strips dates glued to dish text', () => {
        const html = `
            <html>
                <body>
                    <h1>Meny</h1>
                    <div>
                        <p><strong>tisdag 18/8</strong>Ribbestek, red dragonsauce, strimald kål, japansk majjo, broccoli, ris</p>
                    </div>
                </body>
            </html>
        `;

        const result = parseKantinMenuFromHtml(html);

        expect(result).toEqual([
            {
                name: 'Ribbestek, red dragonsauce, strimald kål, japansk majjo, broccoli, ris',
                day: 'Tisdag',
                price: 145
            }
        ]);
    });

    test('parses weekday labels glued directly to dish names', () => {
        const html = `
            <html>
                <body>
                    <h1>Meny</h1>
                    <div>
                        <p><strong>Måndag</strong>Spidersteak - sås romesco</p>
                    </div>
                </body>
            </html>
        `;

        const result = parseKantinMenuFromHtml(html);

        expect(result).toEqual([
            {
                name: 'Spidersteak - sås romesco',
                day: 'Måndag',
                price: 145
            }
        ]);
    });
});
