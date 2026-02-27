import { parseGrendenMenuFromHtml } from '../../src/scrapers/grenden';

describe('Grenden parser branch behavior', () => {
    test('keeps repeated daily dishes across different days while collapsing weekly specials', () => {
        const html = `
            <html>
                <body>
                    <ul class="pris-list">
                        <li>Lunchpris: 105 kr</li>
                    </ul>
                    <div>grill & fusion special 125 SEK</div>

                    <div class="accordion-wrapper" style="display: block">
                        <div class="weekday-item">
                            <div class="accordion-header">Måndag</div>
                            <ul>
                                <li class="ratter">Weekly Dish | Shared special</li>
                                <li class="ratter">Repeat Dish | Appears on Monday and Tuesday</li>
                            </ul>
                        </div>
                        <div class="weekday-item">
                            <div class="accordion-header">Tisdag</div>
                            <ul>
                                <li class="ratter">Weekly Dish | Shared special</li>
                                <li class="ratter">Repeat Dish | Appears on Monday and Tuesday</li>
                            </ul>
                        </div>
                        <div class="weekday-item">
                            <div class="accordion-header">Onsdag</div>
                            <ul>
                                <li class="ratter">Weekly Dish | Shared special</li>
                            </ul>
                        </div>
                        <div class="weekday-item">
                            <div class="accordion-header">Torsdag</div>
                            <ul>
                                <li class="ratter">Weekly Dish | Shared special</li>
                            </ul>
                        </div>
                        <div class="weekday-item">
                            <div class="accordion-header">Fredag</div>
                            <ul>
                                <li class="ratter">Weekly Dish | Shared special</li>
                            </ul>
                        </div>
                    </div>
                </body>
            </html>
        `;

        const result = parseGrendenMenuFromHtml(html);

        expect(result).toContainEqual({
            name: 'Weekly Dish – Shared special',
            price: 125,
            day: 'Hela veckan'
        });

        expect(result).toContainEqual({
            name: 'Repeat Dish – Appears on Monday and Tuesday',
            price: 105,
            day: 'Måndag'
        });

        expect(result).toContainEqual({
            name: 'Repeat Dish – Appears on Monday and Tuesday',
            price: 105,
            day: 'Tisdag'
        });

        const weeklySpecials = result.filter((item) => item.day === 'Hela veckan');
        expect(weeklySpecials).toHaveLength(1);
    });
});
