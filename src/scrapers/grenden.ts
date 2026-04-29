import { MenuItem } from '../types/menu';
import { parseCastitMenu } from '../utils/castit';
import { scrapeHtmlMenu } from '../utils/scraper';

export async function scrapeGrendenMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    return scrapeHtmlMenu({
        scraperName: 'Grenden',
        fixtureUrl,
        url: 'https://www.nordrest.se/restaurang/grenden/',
        parseHtml: parseGrendenMenuFromHtml,
        fallback: [
            {
                name: 'Dagens lunch – Meny inte tillgänglig för tillfället',
                price: null,
                day: 'Hela veckan'
            }
        ]
    });
}

export function parseGrendenMenuFromHtml(html: string): MenuItem[] {
    return parseCastitMenu(html);
}