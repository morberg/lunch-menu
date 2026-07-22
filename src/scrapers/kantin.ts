import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { extractLeadingDay, forEachDay } from '../utils/days';
import { normalizeWhitespace, scrapeHtmlMenu } from '../utils/scraper';

const WEEKLY_LABELS = ['Veckans vegetariska', 'Månadens alternativ'] as const;
const KANTIN_LUNCH_PRICE = 145;

const parseKantinParagraphs = (paragraphTexts: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    for (const paragraphTextRaw of paragraphTexts) {
        const paragraphText = normalizeWhitespace(paragraphTextRaw);
        if (!paragraphText) {
            continue;
        }

        const paragraphTextLower = paragraphText.toLowerCase();
        const weeklyLabel = WEEKLY_LABELS.find((label) =>
            paragraphTextLower.startsWith(label.toLowerCase())
        );
        if (weeklyLabel) {
            const description = paragraphText
                .slice(weeklyLabel.length)
                .replace(/^\s*[-–—:]\s*/, '')
                .trim();
            if (description) {
                menuItems.push(...forEachDay({
                    name: `${weeklyLabel}: ${description}`,
                    price: KANTIN_LUNCH_PRICE
                }));
            }
            continue;
        }

        const leadingDay = extractLeadingDay(paragraphText);
        if (leadingDay?.text) {
            menuItems.push({
                name: leadingDay.text,
                price: KANTIN_LUNCH_PRICE,
                day: leadingDay.day
            });
        }
    }

    return menuItems;
};

export const parseKantinMenuFromHtml = (html: string): MenuItem[] => {
    const $ = cheerio.load(html);

    const menuHeading = $('h1').filter((_, element) => {
        const text = normalizeWhitespace($(element).text());
        return text.toLowerCase().startsWith('meny');
    }).first();

    if (menuHeading.length > 0) {
        const menuRoot = menuHeading.closest('div');
        const menuParagraphs = menuRoot.find('p').toArray().map((paragraph) => $(paragraph).text());
        const menuItems = parseKantinParagraphs(menuParagraphs);
        if (menuItems.length > 0) {
            return menuItems;
        }
    }

    const bodyParagraphs = $('p').toArray().map((paragraph) => $(paragraph).text());
    return parseKantinParagraphs(bodyParagraphs);
};

export const scrapeKantinMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        scraperName: 'Kantin',
        fixtureUrl,
        url: 'https://www.kantinlund.se/',
        parseHtml: parseKantinMenuFromHtml
    });
};