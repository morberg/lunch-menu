import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { isSwedishDay } from '../utils/swedish-days';
import { scrapeHtmlMenu, splitNormalizedLines } from '../utils/scraper';

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

    const bodyText = $('body').text();
    const lines = splitNormalizedLines(bodyText);

    let currentDay = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if line is a Swedish day name
        if (isSwedishDay(line)) {
            currentDay = line;
            continue;
        }

        // Check if line starts with a category (allow extra text after category)
        const categoryMatch = line.match(/^(Green|Local|World Wide)(,.*)?$/);
        if (categoryMatch && currentDay) {
            const category = categoryMatch[1];
            // Next line should be the price
            if (i + 1 < lines.length && i + 2 < lines.length) {
                const rawPrice = lines[i + 1];
                const description = lines[i + 2];

                // Parse the price using our utility
                const price = parsePrice(rawPrice);

                const menuItem: MenuItem = {
                    name: `${category}: ${description}`,
                    price: price,
                    day: currentDay
                };

                menuItems.push(menuItem);

                // Skip the processed lines
                i += 2;
            }
        }
    }

    return menuItems;
};