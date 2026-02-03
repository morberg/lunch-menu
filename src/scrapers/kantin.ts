import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const stripLeadingSeparators = (text: string): string => text.replace(/^\s*[-–—:]\s*/, '').trim();

const isMenuDescription = (description: string): boolean => {
    if (!description || description.length <= 10) {
        return false;
    }

    const lower = description.toLowerCase();
    return !lower.includes('11.00') &&
        !lower.includes('16.00') &&
        !lower.includes('buffé') &&
        !lower.includes('vi skickar');
};

const isWeeklyLabel = (text: string): boolean =>
    text.startsWith('Veckans vegetariska') || text.startsWith('Månadens');

const isDayLabel = (text: string): boolean => swedishDays.includes(text);

const parseKantinFromLines = (lines: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const dayRegex = /^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)\b\s*(?:–|-|:)?\s*(.+)?$/;
        const dayMatch = line.match(dayRegex);

        if (dayMatch) {
            const day = dayMatch[1];
            let description = dayMatch[2] ? dayMatch[2].trim() : '';

            if (!description && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                if (!dayRegex.test(nextLine) && !isWeeklyLabel(nextLine)) {
                    description = nextLine;
                    i++;
                }
            }

            if (isMenuDescription(description)) {
                const price = parsePrice(description);
                menuItems.push({
                    name: description,
                    price: price,
                    day: day
                });
            }

            continue;
        }

        const weeklyRegex = /^(Veckans vegetariska|Månadens[^–:-]*)\s*(?:–|-|:)?\s*(.+)?$/;
        const weeklyMatch = line.match(weeklyRegex);

        if (weeklyMatch) {
            const itemType = weeklyMatch[1];
            let description = weeklyMatch[2] ? weeklyMatch[2].trim() : '';

            if (!description && i + 1 < lines.length) {
                description = lines[i + 1];
                i++;
            }

            if (isMenuDescription(description)) {
                const price = parsePrice(description);
                menuItems.push({
                    name: `${itemType}: ${description}`,
                    price: price,
                    day: 'Hela veckan'
                });
            }
        }
    }

    return menuItems;
};

export const parseKantinMenuFromHtml = (html: string): MenuItem[] => {
    const $ = cheerio.load(html);
    const menuItems: MenuItem[] = [];

    const menuHeading = $('h1').filter((_, element) => {
        const text = normalizeText($(element).text());
        return text.toLowerCase().startsWith('meny');
    }).first();

    if (menuHeading.length > 0) {
        const menuRoot = menuHeading.closest('div');
        const paragraphs = menuRoot.find('p').toArray();

        for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i];
            const paragraphText = normalizeText($(paragraph).text());

            if (!paragraphText) {
                continue;
            }

            const strongTextRaw = normalizeText($(paragraph).find('strong').first().text());

            if (strongTextRaw) {
                if (isDayLabel(strongTextRaw)) {
                    let description = stripLeadingSeparators(paragraphText.replace(strongTextRaw, ''));

                    if (!description && i + 1 < paragraphs.length) {
                        const nextText = normalizeText($(paragraphs[i + 1]).text());
                        if (nextText && !isDayLabel(nextText) && !isWeeklyLabel(nextText)) {
                            description = nextText;
                            i++;
                        }
                    }

                    if (isMenuDescription(description)) {
                        const price = parsePrice(description);
                        menuItems.push({
                            name: description,
                            price: price,
                            day: strongTextRaw
                        });
                    }

                    continue;
                }

                if (isWeeklyLabel(strongTextRaw)) {
                    const label = normalizeText(strongTextRaw.replace(/[–-]\s*$/, ''));
                    let description = stripLeadingSeparators(paragraphText.replace(strongTextRaw, ''));

                    if (!description && i + 1 < paragraphs.length) {
                        description = normalizeText($(paragraphs[i + 1]).text());
                        i++;
                    }

                    if (isMenuDescription(description)) {
                        const price = parsePrice(description);
                        menuItems.push({
                            name: `${label}: ${description}`,
                            price: price,
                            day: 'Hela veckan'
                        });
                    }
                }

                continue;
            }

            const inlineDayMatch = paragraphText.match(/^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)\b\s*(?:–|-|:)?\s*(.+)$/);
            if (inlineDayMatch) {
                const description = inlineDayMatch[2].trim();

                if (isMenuDescription(description)) {
                    const price = parsePrice(description);
                    menuItems.push({
                        name: description,
                        price: price,
                        day: inlineDayMatch[1]
                    });
                }
            }
        }
    }

    if (menuItems.length > 0) {
        return menuItems;
    }

    const bodyText = $('body').text();
    const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    return parseKantinFromLines(lines);
};

export const scrapeKantinMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://www.kantinlund.se/';
        const response = await axios.get(url);
        return parseKantinMenuFromHtml(response.data);
    } catch (error) {
        console.error('Error scraping Kantin menu:', error);
        return [];
    }
};