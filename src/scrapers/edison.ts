import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { ENGLISH_DAYS, translateEnglishDay } from '../utils/days';
import { scrapeHtmlMenu, normalizeWhitespace } from '../utils/scraper';
import { DayGroup, parseDayGroupedHtml } from '../utils/day-grouped-html';

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
    const groups: DayGroup[] = ENGLISH_DAYS.map((englishDay) => ({
        day: translateEnglishDay(englishDay),
        elements: $(`.${englishDay.toLowerCase()} .lunchmeny_container`)
    }));

    return parseDayGroupedHtml({
        groups,
        parseElement: (element) => {
            const title = normalizeWhitespace($(element).find('.lunch_title').text());
            const desc = normalizeWhitespace($(element).find('.lunch_desc').text());
            const priceText = $(element).find('.lunch_price').text();
            const price = parsePrice(priceText);

            if (!title && !desc) {
                return null;
            }

            return {
                name: desc ? `${title}: ${desc}` : title,
                price
            };
        }
    });
};