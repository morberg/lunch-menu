import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { loadHtmlSource } from '../utils/scraper';
import { compareDays, parseDay } from '../utils/days';

/**
 * Smakapakina scraper
 * Parses the current /meny page where weekday dishes are present in rendered textual content.
 *
 * Policy:
 *  - Always return exactly one MenuItem per weekday (Mon–Fri) when available.
 *  - Price is extracted from embedded JSON when present, otherwise null.
 *  - Remove dates, enumeration indexes, Chinese parenthetical parts, duplicated dishes, and trailing punctuation.
 */
export async function scrapeSmakapakina(fixtureUrl?: string): Promise<MenuItem[]> {
    try {
        const html = await loadHtmlSource(
            fixtureUrl,
            'https://www.smakapakina.se/meny/',
            { headers: { 'User-Agent': 'Mozilla/5.0' } }
        );
        return parseModernMainPage(html);
    } catch (err) {
        console.error('Error scraping Smakapakina:', err);
        return [];
    }
}

function parseModernMainPage(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const seen = new Set<string>();
    const results: MenuItem[] = [];

    $('[data-hook="item.container"]').each((_, element) => {
        const item = $(element);
        const nameText = item.find('[data-hook="item.name"]').first().text().trim();
        const descriptionText = item.find('[data-hook="item.description"]').first().text().trim();
        const priceText = item.find('[data-hook="item.price"]').first().text().trim();

        if (!nameText || !descriptionText) {
            return;
        }

        const day = parseDay(nameText);
        if (!day) {
            return;
        }

        const dayLower = day.toLowerCase();
        if (seen.has(dayLower)) {
            return;
        }

        const dishes = extractEnumeratedDishes(descriptionText);
        if (!dishes.length) {
            return;
        }

        seen.add(dayLower);
        results.push({
            day,
            name: joinDishes(dishes),
            price: parsePrice(priceText)
        });
    });

    return results.sort((left, right) => compareDays(left.day, right.day));
}

// Extract enumerated dishes like: 1. Dish, 2. Another dish ... from a block
function extractEnumeratedDishes(text: string): string[] {
    const collected: string[] = [];
    const normalized = text.replace(/\s+/g, ' ').trim();
    const dishRegex = /\d+\.\s*([^()（）]+?)\s*[（(]\s*[\u3400-\u9FFF][^）)]*[）)]\s*[;,.]?/g;

    let match: RegExpExecArray | null;
    while ((match = dishRegex.exec(normalized)) !== null) {
        const dish = match[1];
        if (dish && !collected.some((existing) => existing.toLowerCase() === dish.toLowerCase())) {
            collected.push(dish);
        }
        if (collected.length >= 6) {
            break;
        }
    }

    return collected;
}

function joinDishes(dishes: string[]): string {
    return dishes.join(', ').replace(/[\s,.;:-]+$/, '');
}

export { parseModernMainPage as parseSmakapakinaMenuFromHtml };
