import { MenuItem } from '../types/menu';
import { parseCastitMenu } from '../utils/castit';
import { scrapeHtmlMenu } from '../utils/scraper';

export async function scrapeRootMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    return scrapeHtmlMenu({
        fixtureUrl,
        url: 'https://www.nordrest.se/restaurang/root/',
        parseHtml: parseCastitMenu
    });
}