import { parseCastitMenu } from '../../src/utils/castit';

describe('Root parser', () => {
    test('assigns the weekly and daily Root prices from their labels', () => {
        const html = `
            <div class="castit-lunch-meta">
                <span class="castit-lunch-meta__item"><strong>Dishes of the week</strong>: 125 SEK</span>
                <span class="castit-lunch-meta__item"><strong>Blue Zone</strong>: 90 SEK</span>
            </div>
            <div class="castit-weekpanel is-active">
                <section class="castit-day castit-day--week">
                    <div class="castit-dish">
                        <div class="castit-dish__title"><span class="castit-i18n">Weekly dish</span></div>
                    </div>
                </section>
                <section class="castit-day">
                    <h3 class="castit-day__title"><span class="castit-i18n">Måndag</span></h3>
                    <div class="castit-dish">
                        <div class="castit-dish__title"><span class="castit-i18n">Daily dish</span></div>
                    </div>
                </section>
            </div>
        `;

        const result = parseCastitMenu(html);

        expect(result.filter((item) => item.name === 'Weekly dish')).toEqual([
            { name: 'Weekly dish', price: 125, day: 'Måndag' },
            { name: 'Weekly dish', price: 125, day: 'Tisdag' },
            { name: 'Weekly dish', price: 125, day: 'Onsdag' },
            { name: 'Weekly dish', price: 125, day: 'Torsdag' },
            { name: 'Weekly dish', price: 125, day: 'Fredag' }
        ]);
        expect(result).toContainEqual({ name: 'Daily dish', price: 90, day: 'Måndag' });
    });
});