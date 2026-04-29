import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { ENGLISH_DAYS, normalizeToSwedishDay } from '../utils/swedish-days';
import { scrapeHtmlMenu, normalizeWhitespace } from '../utils/scraper';

export const scrapeEdisonMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        scraperName: 'Edison',
        fixtureUrl,
        url: 'https://restaurangedison.se/lunch/',
        parseHtml: parseEdisonMenuFromHtml
    });
};

export const parseEdisonMenuFromHtml = (html: string): MenuItem[] => {
    const $ = cheerio.load(html);
    const menuItems: MenuItem[] = [];

    for (const englishDay of ENGLISH_DAYS) {
        const day = normalizeToSwedishDay(englishDay);
        if (!day) continue;

        $(`.${englishDay} .lunchmeny_container`).each((_: number, el: any) => {
            const title = normalizeWhitespace($(el).find('.lunch_title').text());
            const desc = normalizeWhitespace($(el).find('.lunch_desc').text());
            const priceText = $(el).find('.lunch_price').text();
            const price = parsePrice(priceText);

            if (!title && !desc) return;

            const name = desc ? `${title}: ${desc}` : title;
            menuItems.push({ name, price, day });
        });
    }

    return menuItems;
};