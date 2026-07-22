import { parseSmakapakinaMenuFromHtml } from '../../src/scrapers/smakapakina';

describe('Smakapakina parser robustness', () => {
    test('parses numbered dishes with inconsistent whitespace and full-width parenthesis', () => {
        const html = `
            <div data-hook="item.container">
                <span data-hook="item.name">Måndag, 1 Jan</span>
                <span data-hook="item.description">
                    1. Bräserade fläsklägg (冰糖肘子)
                    2. Vitlök krispig kycklingvingar (蒜香鸡翅）
                    3.Wokade aubergin ( 烧茄子)
                </span>
                <span data-hook="item.price">110 kr</span>
            </div>
        `;

        const result = parseSmakapakinaMenuFromHtml(html);

        expect(result).toEqual([
            {
                day: 'Måndag',
                price: 110,
                name: 'Bräserade fläsklägg, Vitlök krispig kycklingvingar, Wokade aubergin'
            }
        ]);
    });

    test('parses Wednesday when day header is missing comma before date', () => {
        const html = `
            <div data-hook="item.container">
                <span data-hook="item.name">Onsdag 22 Jul</span>
                <span data-hook="item.description">
                    1. Rött bräserat sidfläsk (红烧肉)
                    2. Kyckling med chili olja sås(口水鸡)
                    3. Bakad pumpa med saltad ankäggula (咸蛋黄焗南瓜)
                </span>
                <span data-hook="item.price">110 kr</span>
            </div>
        `;

        const result = parseSmakapakinaMenuFromHtml(html);

        expect(result).toEqual([
            {
                day: 'Onsdag',
                price: 110,
                name: 'Rött bräserat sidfläsk, Kyckling med chili olja sås, Bakad pumpa med saltad ankäggula'
            }
        ]);
    });
});
