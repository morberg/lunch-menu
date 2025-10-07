import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

/**
 * Smakapakina scraper
 * Supports two historical site shapes:
 *  1. Legacy Wix Restaurants embedded menu (data-hook="wixrest-menus-item-title" etc) – fixture: smakapakina.html
 *  2. New (2025) full site /meny page where weekday dishes are only present in rendered textual content – fixture: smakapakina_v2.html
 *
 * Policy:
 *  - Always return exactly one MenuItem per weekday (Mon–Fri) when available.
 *  - Legacy version includes a price (100 kr) – parsed via parsePrice.
 *  - New version has no visible lunch price → price null.
 *  - Remove dates, enumeration indexes, Chinese parenthetical parts, duplicated dishes, and trailing punctuation.
 */
export async function scrapeSmakapakina(fixtureUrl?: string): Promise<MenuItem[]> {
    try {
        if (fixtureUrl && fixtureUrl.startsWith('file://')) {
            const fs = await import('fs');
            const html = fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8');
            return parseFixtureHtml(html);
        }

        // Live strategy (kept simple – we still prefer fixtures in tests)
        const mainUrl = 'https://www.smakapakina.se/meny/';
        let html: string | null = null;
        try {
            const res = await axios.get(mainUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            html = res.data;
        } catch {/* ignore network errors */ }
        if (!html) return [];
        const parsed = parseFixtureHtml(html);
        return parsed;
    } catch (err) {
        console.error('Error scraping Smakapakina:', err);
        return [];
    }
}

function parseFixtureHtml(html: string): MenuItem[] {
    // Decide which parser to use
    if (html.includes('data-hook="wixrest-menus-item-title"')) {
        return parseLegacyEmbedded(html);
    }
    return parseModernMainPage(html);
}

// ---------------- Legacy parser (wix embedded component) ----------------
function parseLegacyEmbedded(html: string): MenuItem[] {
    const titleRegex = /data-hook="wixrest-menus-item-title"[^>]*>([^<]+)</g;
    const descriptionRegex = /data-hook="wixrest-menus-item-description"[^>]*>([^<]+(?:<[^>]*>[^<]*)*?)</g;
    const priceRegex = /data-hook="wixrest-menus-item-price"[^>]*>([^<]+)</g;
    let titleMatch: RegExpExecArray | null;
    let descriptionMatch: RegExpExecArray | null;
    let priceMatch: RegExpExecArray | null;
    const titles: string[] = [];
    const descriptions: string[] = [];
    const prices: string[] = [];

    while ((titleMatch = titleRegex.exec(html)) !== null) titles.push(titleMatch[1].trim());
    while ((descriptionMatch = descriptionRegex.exec(html)) !== null) descriptions.push(descriptionMatch[1].trim());
    while ((priceMatch = priceRegex.exec(html)) !== null) prices.push(priceMatch[1].trim());

    const items: MenuItem[] = [];
    for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        if (!/(måndag|tisdag|onsdag|torsdag|fredag)/i.test(title)) continue;
        const description = descriptions[i] || '';
        const priceText = prices[i] || '';
        const dishMatches = description.match(/\d+\.\s*[^0-9]+?(?=\s*\d+\.|$)/g);
        if (!dishMatches) continue;
        const dishes = dishMatches.map(d => cleanDish(d.replace(/^\d+\.\s*/, ''))).filter(Boolean);
        if (!dishes.length) continue;
        const day = (title.match(/(måndag|tisdag|onsdag|torsdag|fredag)/i)?.[1] || '').toLowerCase();
        const dayCap = capitalizeSv(day);
        const price = parsePrice(priceText); // will return number or null per policy
        items.push({ name: joinDishes(dishes), day: dayCap, price });
    }
    // Ensure ordering
    return sortByWeekday(items);
}

// Extract price data from JSON embedded in the HTML
function extractPriceData(html: string): Map<string, number> {
    const priceMap = new Map<string, number>();

    try {
        // Look for name field followed by priceInfo data in the HTML
        // Pattern: "name":"Weekday, date","description":"...","featured":false,"priceInfo":{"price":"100"
        const nameWithPriceRegex = /"name":"([^"]+)"[^}]*"priceInfo":\{"price":"(\d+)"/g;

        let match;
        while ((match = nameWithPriceRegex.exec(html)) !== null) {
            const name = match[1].toLowerCase();
            const price = parseInt(match[2], 10);

            // Map Swedish weekday names to our expected format
            if (name.includes('måndag')) priceMap.set('måndag', price);
            else if (name.includes('tisdag')) priceMap.set('tisdag', price);
            else if (name.includes('onsdag')) priceMap.set('onsdag', price);
            else if (name.includes('torsdag')) priceMap.set('torsdag', price);
            else if (name.includes('fredag')) priceMap.set('fredag', price);
        }
    } catch (error) {
        // If price extraction fails, return empty map (prices will be null)
        console.warn('Failed to extract price data:', error);
    }

    return priceMap;
}

// ---------------- Modern main page parser (v2) ----------------
function parseModernMainPage(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const bodyText = $('body').text();

    // Extract price data from JSON embedded in HTML
    const priceMap = extractPriceData(html);

    // Extract blocks per weekday
    const dayBlockRegex = /(måndag|tisdag|onsdag|torsdag|fredag)[^]*?(?=(måndag|tisdag|onsdag|torsdag|fredag)|$)/gi;
    const seen = new Set<string>();
    const results: MenuItem[] = [];
    let m: RegExpExecArray | null;
    while ((m = dayBlockRegex.exec(bodyText)) !== null) {
        const dayLower = m[1].toLowerCase();
        if (seen.has(dayLower)) continue; // first occurrence only
        seen.add(dayLower);
        let block = m[0];
        // Stop at start of dumpling / non-lunch sections to avoid spillover (Friday issue)
        const spillIndex = block.search(/DUMPLINGS|JIAO\s+ZI/i);
        if (spillIndex > 0) {
            block = block.slice(0, spillIndex);
        }
        const dishes = extractEnumeratedDishes(block);
        if (!dishes.length) continue;

        // Get price for this day from the extracted price map
        const rawPrice = priceMap.get(dayLower);
        const dayPrice = rawPrice ? parsePrice(rawPrice.toString()) : null;
        results.push({ day: capitalizeSv(dayLower), name: joinDishes(dishes), price: dayPrice });
    }
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
                .replace(/^(måndag|tisdag|onsdag|torsdag|fredag)[^a-zA-ZåäöÅÄÖ]*/i, '')
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

function capitalizeSv(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

function sortByWeekday(items: MenuItem[]): MenuItem[] {
    const order = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
    return items.sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day));
}

// Extract the first dumpling filling variant (used to append to Friday per expected v2 JSON)
export { parseFixtureHtml as _parseSmakapakinaFixtureHtml }; // for potential unit testing
// end
