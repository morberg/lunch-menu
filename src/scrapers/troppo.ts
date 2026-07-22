import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { forEachDay } from '../utils/days';
import { bodyText } from '../utils/html-text';
import { parsePrice } from '../utils/price';
import { normalizeWhitespace, scrapeHtmlMenu } from '../utils/scraper';

const stripInvisibleChars = (text: string): string => text.replace(/[\u200B-\u200D\uFEFF]/g, '');

const normalizeTroppoText = (text: string): string => normalizeWhitespace(stripInvisibleChars(text));

const extractLunchPrice = (html: string): number | null => {
    const lunchPriceMatch = bodyText(html).match(/Lunch\s+(\d+(?:[.,]\d+)?)(?:\s*-\s*(\d+(?:[.,]\d+)?))?\s*(?:kr|:-|sek)/i);
    if (!lunchPriceMatch) {
        return null;
    }

    const prices = lunchPriceMatch
        .slice(1)
        .filter((value): value is string => Boolean(value))
        .map((value) => parsePrice(value))
        .filter((value): value is number => value !== null);

    return prices.length > 0 ? Math.max(...prices) : null;
};

const extractWeeklyDishes = (html: string): string[] => {
    const $ = cheerio.load(html);
    const mondayFridayHeading = $('h2').filter((_, element) => normalizeTroppoText($(element).text()).toLowerCase() === 'monday-friday').first();
    if (mondayFridayHeading.length === 0) {
        return [];
    }

    const mondayFridayMenuSection = mondayFridayHeading
        .nextAll('div')
        .filter((_, element) => $(element).find('.w-richtext').length > 0)
        .first();

    const dishes: string[] = [];
    const seen = new Set<string>();

    mondayFridayMenuSection.find('.w-richtext strong').each((_, element) => {
        const dishName = normalizeTroppoText($(element).text());
        if (!dishName || dishName.toLowerCase() === 'or') {
            return;
        }

        const dishKey = dishName.toLowerCase();
        if (seen.has(dishKey)) {
            return;
        }
        seen.add(dishKey);
        dishes.push(dishName);
    });

    return dishes;
};

export function parseTroppoHtml(html: string): MenuItem[] {
    const price = extractLunchPrice(html);
    const dishes = extractWeeklyDishes(html);

    return dishes.flatMap((name) => forEachDay({ name, price }));
}

export const scrapeTroppoMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        scraperName: 'Troppo',
        fixtureUrl,
        url: 'https://www.troppo.se/lunch',
        parseHtml: parseTroppoHtml
    });
};
