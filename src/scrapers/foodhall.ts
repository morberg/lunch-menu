import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { scrapeHtmlMenu } from '../utils/scraper';

export async function scrapeFoodHallMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    return scrapeHtmlMenu({
        scraperName: 'Food Hall',
        fixtureUrl,
        url: 'https://www.nordrest.se/restaurang/food-hall/',
        parseHtml: parseFoodHallMenuFromHtml
    });
}

export function parseFoodHallMenuFromHtml(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const items: MenuItem[] = [];

    const menuItemElements = $('.axis-menu__item');

    menuItemElements.each((index: number, element: cheerio.Element) => {
        const nameEl = $(element).find('.axis-menu__name');
        const priceEl = $(element).find('.axis-menu__price');
        const descEl = $(element).find('.axis-menu__desc');

        if (nameEl.length === 0) {
            return;
        }

        const dishName = nameEl.text().trim();
        const description = descEl.length > 0 ? descEl.text().trim() : '';
        const priceText = priceEl.length > 0 ? priceEl.text().trim() : '';

        const price = parsePrice(priceText);

        const fullDishName = description || dishName;

        items.push({
            name: fullDishName,
            price,
            day: 'Hela veckan'
        });
    });

    return items;
}
