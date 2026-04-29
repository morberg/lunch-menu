import { MenuItem } from '../types/menu';
import { parseCastitMenu } from '../utils/castit';
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
    return parseCastitMenu(html);
}
