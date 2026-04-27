import { parseGrendenMenuFromHtml } from '../../src/scrapers/grenden';

describe('Grenden parser', () => {
    test('extracts weekly specials and daily dishes from castit structure', () => {
        const html = `
            <html>
                <body>
                    <span class="castit-lunch-meta__item">
                        <strong class="castit-i18n" data-sv="Weekly dish">Weekly dish</strong>:
                        125 SEK
                    </span>
                    <span class="castit-lunch-meta__item">
                        <strong class="castit-i18n" data-sv="Todays lunch">Todays lunch</strong>:
                        105 SEK
                    </span>

                    <div class="castit-weekpanel is-active">
                        <section class="castit-day castit-day--week castit-week-specials-column">
                            <div class="castit-day__list">
                                <div class="castit-dish">
                                    <div class="castit-dish__left">
                                        <div class="castit-dish__title">
                                            <span class="castit-i18n" data-sv="Korean chicken">Korean chicken</span>
                                        </div>
                                        <div class="castit-dish__desc">
                                            <span class="castit-i18n" data-sv="rice, pickles">rice, pickles</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="castit-day current">
                            <h3 class="castit-day__title">
                                <span class="castit-i18n" data-sv="Måndag">Måndag</span>
                            </h3>
                            <div class="castit-day__list">
                                <div class="castit-dish">
                                    <div class="castit-dish__left">
                                        <div class="castit-dish__title">
                                            <span class="castit-i18n" data-sv="Pasta pesto">Pasta pesto</span>
                                        </div>
                                        <div class="castit-dish__desc">
                                            <span class="castit-i18n" data-sv="with parmesan">with parmesan</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section class="castit-day">
                            <h3 class="castit-day__title">
                                <span class="castit-i18n" data-sv="Tisdag">Tisdag</span>
                            </h3>
                            <div class="castit-day__list">
                                <div class="castit-dish">
                                    <div class="castit-dish__left">
                                        <div class="castit-dish__title">
                                            <span class="castit-i18n" data-sv="Fish stew">Fish stew</span>
                                        </div>
                                        <div class="castit-dish__desc">
                                            <span class="castit-i18n" data-sv="with rice">with rice</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </body>
            </html>
        `;

        const result = parseGrendenMenuFromHtml(html);

        expect(result).toContainEqual({
            name: 'Korean chicken, rice, pickles',
            price: 125,
            day: 'Hela veckan'
        });

        expect(result).toContainEqual({
            name: 'Pasta pesto, with parmesan',
            price: 105,
            day: 'Måndag'
        });

        expect(result).toContainEqual({
            name: 'Fish stew, with rice',
            price: 105,
            day: 'Tisdag'
        });

        expect(result).toHaveLength(3);
    });

    test('skips day-note dishes like Closed', () => {
        const html = `
            <html>
                <body>
                    <div class="castit-weekpanel is-active">
                        <section class="castit-day">
                            <h3 class="castit-day__title">
                                <span class="castit-i18n" data-sv="Fredag">Fredag</span>
                            </h3>
                            <div class="castit-day__list">
                                <div class="castit-dish castit-dish--day-note">
                                    <div class="castit-dish__left">
                                        <div class="castit-dish__title">
                                            <span class="castit-i18n" data-sv="Closed">Closed</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </body>
            </html>
        `;

        const result = parseGrendenMenuFromHtml(html);
        expect(result).toHaveLength(0);
    });
});
