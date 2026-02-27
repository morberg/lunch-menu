import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { loadHtmlSource } from '../utils/scraper';
import { SWEDISH_DAYS, normalizeToSwedishDay } from '../utils/swedish-days';

const SWEDISH_DAY_PATTERN = SWEDISH_DAYS.map((day) => day.toLowerCase()).join('|');
const LEADING_DAY_REGEX = new RegExp(`^(${SWEDISH_DAY_PATTERN})[^a-zA-ZåäöÅÄÖ]*`, 'i');

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

        const dayCandidate = nameText.split(',')[0].trim();
        const day = normalizeToSwedishDay(dayCandidate);
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

    return sortByWeekday(results);
}

// Extract enumerated dishes like: 1. Dish, 2. Another dish ... from a block
function extractEnumeratedDishes(text: string): string[] {
    const collected: string[] = [];
    // Primary: capture multi-line blocks between numbers (handles lack of newline after first, or spaces)
    const blockRegex = /(\d+)\.\s*([^]+?)(?=(\d+)\.|$)/g;
    let bm: RegExpExecArray | null;
    while ((bm = blockRegex.exec(text)) !== null) {
        let dish = bm[2];
        // Trim any trailing enumeration marker remnants
        dish = dish.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ');
        // Cut off if dumpling section keyword appears inside the captured dish chunk
        const dumplingIdx = dish.search(/DUMPLINGS|JIAO\s+ZI/i);
        if (dumplingIdx >= 0) {
            dish = dish.slice(0, dumplingIdx);
        }
        dish = cleanDish(dish);
        if (dish && !collected.some(d => d.toLowerCase() === dish.toLowerCase())) collected.push(dish);
        if (collected.length >= 6) break; // guard early
    }
    // Secondary: line-based enumerations (in case block parsing missed due to nested punctuation)
    if (!collected.length) {
        const enumRegex = /\b\d+\.\s*([^\n\r]+?)(?=(?:\n|\r|$))/g;
        let em: RegExpExecArray | null;
        while ((em = enumRegex.exec(text)) !== null) {
            let dish = cleanDish(em[1]);
            if (dish && !collected.some(d => d.toLowerCase() === dish.toLowerCase())) collected.push(dish);
        }
    }
    // If we have enumerated dishes but appear to be missing a leading dish (expected 3-4 but got 2-3) try to capture a preface
    if (collected.length && collected.length < 4) {
        // Look for pattern DayName ... FirstDish before '1.'
        const preEnumMatch = text.split(/\b1\./)[0];
        if (preEnumMatch) {
            // Remove the day name and any date
            const pre = preEnumMatch
                .replace(LEADING_DAY_REGEX, '')
                .replace(/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|Maj|Jun|Jul|Aug|Sep|Okt|Nov|Dec)\b/gi, '')
                .trim();
            // Heuristic: a dish phrase with at least one space and few commas
            if (pre && pre.length > 3 && pre.length < 80 && !/\d+/.test(pre)) {
                const cleaned = cleanDish(pre);
                if (cleaned && !collected.some(d => d.toLowerCase() === cleaned.toLowerCase())) {
                    collected.unshift(cleaned);
                }
            }
        }
    }
    return collected.slice(0, 6); // guard against spillover (e.g. dumpling filling lists)
}

// Normalization & cleaning for dish fragments
function cleanDish(raw: string): string {
    return raw
        .replace(/\(.*?[\u4e00-\u9fff].*?\)/g, '') // remove Chinese parenthetical content
        .replace(/\b\d{1,2}\s+(Jan|Feb|Mar|Apr|Maj|Jun|Jul|Aug|Sep|Okt|Nov|Dec)\b/gi, '') // date tokens
        .replace(/\b\d+\s*(kr|sek)\b/gi, '') // price artifacts
        .replace(/^[\s,.;:-]+/, '')
        .replace(/[\s,.;:-]+$/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function joinDishes(dishes: string[]): string {
    return dishes.join(', ').replace(/[\s,.;:-]+$/, '');
}

function sortByWeekday(items: MenuItem[]): MenuItem[] {
    return items.sort((a, b) => SWEDISH_DAYS.indexOf(a.day as (typeof SWEDISH_DAYS)[number]) - SWEDISH_DAYS.indexOf(b.day as (typeof SWEDISH_DAYS)[number]));
}

export { parseModernMainPage as parseSmakapakinaMenuFromHtml };
