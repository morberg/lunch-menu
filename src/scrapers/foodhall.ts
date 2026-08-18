import { MenuItem } from '../types/menu';
import { parseCastitMenu } from '../utils/castit';
import { scrapeHtmlMenu } from '../utils/scraper';

export async function scrapeFoodHallMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    return scrapeHtmlMenu({
        fixtureUrl,
        url: 'https://www.nordrest.se/restaurang/food-hall/',
        parseHtml: parseCastitMenu
    });
}
