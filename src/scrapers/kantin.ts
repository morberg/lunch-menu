import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { SWEDISH_DAYS } from '../utils/swedish-days';
import { findLabelCaseInsensitive } from '../utils/label-matching';
import { normalizeWhitespace, scrapeHtmlMenu } from '../utils/scraper';

const weeklyLabels = ['Veckans vegetariska', 'Månadens alternativ'];
const KANTIN_LUNCH_PRICE = 145;

const normalizeText = (text: string): string => normalizeWhitespace(text);

const stripLeadingSeparators = (text: string): string => text.replace(/^\s*[-–—:]\s*/, '').trim();

const parseKantinParagraphs = (paragraphTexts: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    for (const paragraphTextRaw of paragraphTexts) {
        const paragraphText = normalizeText(paragraphTextRaw);
        if (!paragraphText) {
            continue;
        }

        const weeklyLabel = findLabelCaseInsensitive(paragraphText, weeklyLabels, 'leading');
        if (weeklyLabel) {
            const description = stripLeadingSeparators(paragraphText.slice(weeklyLabel.length));
            if (description) {
                menuItems.push({
                    name: `${weeklyLabel}: ${description}`,
                    price: KANTIN_LUNCH_PRICE,
                    day: 'Hela veckan'
                });
            }
            continue;
        }

        const dayLabel = findLabelCaseInsensitive(paragraphText, SWEDISH_DAYS, 'leading');
        if (dayLabel) {
            const description = stripLeadingSeparators(paragraphText.slice(dayLabel.length));
            if (description) {
                menuItems.push({
                    name: description,
                    price: KANTIN_LUNCH_PRICE,
                    day: dayLabel
                });
            }
        }
    }

    return menuItems;
};

export const parseKantinMenuFromHtml = (html: string): MenuItem[] => {
    const $ = cheerio.load(html);

    const menuHeading = $('h1').filter((_, element) => {
        const text = normalizeText($(element).text());
        return text.toLowerCase().startsWith('meny');
    }).first();

    if (menuHeading.length > 0) {
        const menuRoot = menuHeading.closest('div');
        const menuParagraphs = menuRoot.find('p').toArray().map((paragraph) => normalizeText($(paragraph).text()));
        const menuItems = parseKantinParagraphs(menuParagraphs);
        if (menuItems.length > 0) {
            return menuItems;
        }
    }

    const bodyParagraphs = $('p').toArray().map((paragraph) => normalizeText($(paragraph).text()));
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