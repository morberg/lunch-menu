import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { extractLeadingDay, forEachDay, SwedishDay } from '../utils/days';
import { normalizeWhitespace, scrapeHtmlMenu, splitNormalizedLines } from '../utils/scraper';

const WEEKLY_LABELS = ['Veckans vegetariska', 'Månadens alternativ'] as const;
const KANTIN_LUNCH_PRICE = 145;

const parseKantinLines = (lines: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    let currentDay: SwedishDay | undefined;
    let currentWeeklyLabel: typeof WEEKLY_LABELS[number] | undefined;
    let descriptionParts: string[] = [];

    const flushItem = (): void => {
        const description = normalizeWhitespace(descriptionParts.join(' '));
        if (description && currentWeeklyLabel) {
            menuItems.push(...forEachDay({
                name: `${currentWeeklyLabel}: ${description}`,
                price: KANTIN_LUNCH_PRICE
            }));
        } else if (description && currentDay) {
            menuItems.push({ name: description, price: KANTIN_LUNCH_PRICE, day: currentDay });
        }
        descriptionParts = [];
    };

    for (const line of lines) {
        const weeklyLabel = WEEKLY_LABELS.find((label) =>
            line.toLowerCase().startsWith(label.toLowerCase())
        );
        if (weeklyLabel) {
            flushItem();
            currentDay = undefined;
            currentWeeklyLabel = weeklyLabel;
            const description = line
                .slice(weeklyLabel.length)
                .replace(/^\s*[-–—:]\s*/, '')
                .trim();
            if (description) {
                descriptionParts.push(description);
            }
            continue;
        }

        const leadingDay = extractLeadingDay(line);
        if (leadingDay) {
            flushItem();
            currentWeeklyLabel = undefined;
            currentDay = leadingDay.day;
            if (leadingDay.text) {
                descriptionParts.push(leadingDay.text);
            }
        } else if (currentDay || currentWeeklyLabel) {
            descriptionParts.push(line);
        }
    }

    flushItem();
    return menuItems;
};

export const parseKantinMenuFromHtml = (html: string): MenuItem[] => {
    const $ = cheerio.load(html);
    const menuHeading = $('h1').filter((_, element) => {
        const text = normalizeWhitespace($(element).text());
        return text.toLowerCase().startsWith('meny');
    }).first();

    const headingRoot = menuHeading.closest('div');
    const menuRoot = (headingRoot.length > 0 ? headingRoot : $('body')).clone();
    menuRoot.find('script, style').remove();
    menuRoot.find('br').replaceWith('\n');
    menuRoot.find('p, div, h1, h2, h3, li').prepend('\n').append('\n');
    menuRoot.find('strong, b').prepend('\n').append(' ');
    return parseKantinLines(splitNormalizedLines(menuRoot.text()));
};

export const scrapeKantinMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        fixtureUrl,
        url: 'https://www.kantinlund.se/',
        parseHtml: parseKantinMenuFromHtml
    });
};