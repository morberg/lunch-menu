import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export async function scrapeFoodHallMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    try {
        if (fixtureUrl && fixtureUrl.startsWith('file://')) {
            const fs = await import('fs');
            const html = fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8');
            return parseFoodHallMenuFromHtml(html);
        }

        const response = await axios.get('https://www.nordrest.se/restaurang/food-hall/');
        return parseFoodHallMenuFromHtml(response.data);
    } catch (error) {
        console.error('Error scraping Food Hall menu:', error);
        return [];
    }
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

        let price = 105;
        const priceMatch = priceText.match(/(\d+)\s*SEK/i);
        if (priceMatch) {
            price = parseInt(priceMatch[1]);
        }

        const fullDishName = description || dishName;

        items.push({
            name: fullDishName,
            price,
            day: 'Hela veckan'
        });
    });

    return items;
}
