import { parseCastitMenu } from '../../src/utils/castit';
import { SWEDISH_DAYS } from '../../src/utils/days';

describe('Castit menu parser', () => {
    test('uses extracted daily and weekly prices from the active week panel', () => {
        const html = `
            <span class="castit-lunch-meta__item">Veckans lunch 130 kr</span>
            <span class="castit-lunch-meta__item">Dagens lunch 110 kr</span>
            <div class="castit-weekpanel is-active">
                <section class="castit-day castit-day--week">
                    <div class="castit-dish">
                        <div class="castit-dish__title"><span class="castit-i18n" data-sv="Veckans pasta">Pasta</span></div>
                    </div>
                </section>
                <section class="castit-day">
                    <h3 class="castit-day__title"><span class="castit-i18n" data-sv="Måndag">Monday</span></h3>
                    <div class="castit-dish">
                        <div class="castit-dish__title"><span class="castit-i18n" data-sv="Kyckling">Chicken</span></div>
                        <div class="castit-dish__desc"><span class="castit-i18n" data-sv="med ris">with rice</span></div>
                    </div>
                </section>
            </div>
        `;

        const result = parseCastitMenu(html);

        expect(result).toEqual([
            ...SWEDISH_DAYS.map((day) => ({ name: 'Veckans pasta', price: 130, day })),
            { name: 'Kyckling, med ris', price: 110, day: 'Måndag' }
        ]);
    });

    test('skips day-note dishes', () => {
        const html = `
            <section class="castit-day">
                <h3 class="castit-day__title"><span class="castit-i18n" data-sv="Fredag">Friday</span></h3>
                <div class="castit-dish castit-dish--day-note">
                    <div class="castit-dish__title"><span class="castit-i18n" data-sv="Closed">Closed</span></div>
                </div>
            </section>
        `;

        expect(parseCastitMenu(html)).toEqual([]);
    });
});