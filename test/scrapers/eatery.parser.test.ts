import * as fs from 'fs';
import * as path from 'path';
import {
    findEateryOrdinaryPrice,
    parseEateryMenuFromHtml
} from '../../src/scrapers/eatery';

describe('Eatery menu parser', () => {
    test('parses the weekly HTML menu and uses the ordinary lunch price', () => {
        const html = `
            <main class="menu-public menu-public--weekly">
                <section class="day">
                    <h2 class="day__title">Monday</h2>
                    <div class="day__items">
                        <div class="item">
                            <p class="item__name">Sticky koreansk kyckling</p>
                            <p class="item__description">med gochujang och soja</p>
                        </div>
                    </div>
                </section>
                <section class="day">
                    <h2 class="day__title">Tisdag</h2>
                    <div class="day__items">
                        <div class="item">
                            <p class="item__name">Dan dan nudlar</p>
                        </div>
                    </div>
                </section>
            </main>
        `;

        expect(parseEateryMenuFromHtml(html)).toEqual([
            {
                name: 'Sticky koreansk kyckling med gochujang och soja',
                day: 'Måndag',
                price: 139
            },
            {
                name: 'Dan dan nudlar',
                day: 'Tisdag',
                price: 139
            }
        ]);
    });

    test('extracts the ordinary price instead of the early-bird price', () => {
        const fixturePath = path.join(__dirname, '..', 'fixtures', 'eatery-main.html');
        const html = fs.readFileSync(fixturePath, 'utf8');

        expect(findEateryOrdinaryPrice(html)).toBe(139);
    });
});