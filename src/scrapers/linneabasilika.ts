import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { normalizeToSwedishDay } from '../utils/swedish-days';
import { normalizeWhitespace, scrapeHtmlMenu } from '../utils/scraper';
import { bodyText } from '../utils/html-text';

export async function scrapeLinneaBasilikaMenu(fixtureUrl?: string): Promise<MenuItem[]> {
    return scrapeHtmlMenu({
        scraperName: 'Linnea & Basilika',
        fixtureUrl,
        url: 'https://www.linneabasilika.se/lund-brunnshog/',
        parseHtml: parseLinneaBasilikaMenuFromHtml
    });
}

/**
 * Linnea & Basilika renders each weekday as an <h4> heading (e.g. "Måndag 6 juli")
 * followed by one <p> per dish available in the buffet that day. The buffet price
 * is not tied to a menu item, but stated once as free text elsewhere on the page
 * (e.g. "...för 155 kr."), so it is located via pattern matching and shared across all items.
 */
export function parseLinneaBasilikaMenuFromHtml(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const price = extractLunchPrice(html);
    const menuItems: MenuItem[] = [];

    $('h4').each((_: number, headingEl: any) => {
        const heading = $(headingEl);
        const dayCandidate = normalizeWhitespace(heading.text()).split(' ')[0];
        const day = normalizeToSwedishDay(dayCandidate);
        if (!day) {
            return;
        }

        heading.parent().find('p').each((_: number, dishEl: any) => {
            const dishText = normalizeWhitespace($(dishEl).text());
            if (!dishText) {
                return;
            }
            menuItems.push({ name: dishText, price, day });
        });
    });

    return menuItems;
}

function extractLunchPrice(html: string): number | null {
    const text = bodyText(html);
    const match = text.match(/för\s+\d+(?:[.,]\d{2})?\s*(?:kr|:-|sek)/i);
    return match ? parsePrice(match[0]) : null;
}
