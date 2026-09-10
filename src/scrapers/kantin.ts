import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
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
    const getParagraphText = (paragraph: Element): string => {
        const $paragraph = $(paragraph);
        const leadingStrong = $paragraph.children('strong').first();
        if (leadingStrong.length === 0) {
            return $paragraph.text();
        }

        const trailingText = $paragraph.clone().children('strong').remove().end().text();
        return normalizeWhitespace(`${leadingStrong.text()} ${trailingText}`);
    };

    const menuHeading = $('h1').filter((_, element) => {
        const text = normalizeWhitespace($(element).text());
        return text.toLowerCase().startsWith('meny');
    }).first();

    if (menuHeading.length > 0) {
        const menuRoot = menuHeading.closest('div');
        const menuParagraphs = menuRoot.find('p').toArray().map(getParagraphText);
        const menuItems = parseKantinParagraphs(menuParagraphs);
        if (menuItems.length > 0) {
            return menuItems;
        }
    }

    const bodyParagraphs = $('p').toArray().map(getParagraphText);
    return parseKantinParagraphs(bodyParagraphs);
};

export const scrapeKantinMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        fixtureUrl,
        url: 'https://www.kantinlund.se/',
        parseHtml: parseKantinMenuFromHtml
    });
};