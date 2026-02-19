import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
const KANTIN_LUNCH_PRICE = 145;

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

const getLeadingDayLabel = (text: string): string | null =>
    swedishDays.find(label => text.startsWith(label)) ?? null;

const parseKantinFromLines = (lines: string[]): MenuItem[] => {
    const menuItems: MenuItem[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const dayLabel = getLeadingDayLabel(line);
        if (dayLabel) {
            let description = stripLeadingSeparators(line.slice(dayLabel.length));

            if (!description && i + 1 < lines.length) {
                const nextLine = lines[i + 1];
                const nextDayLabel = getLeadingDayLabel(nextLine);
                if (!nextDayLabel && !isWeeklyLabel(nextLine)) {
                    description = nextLine;
                    i++;
                }
            }

            if (isMenuDescription(description)) {
                menuItems.push({
                    name: description,
                    price: KANTIN_LUNCH_PRICE,
                    day: dayLabel
                });
            }

            continue;
        }

        if (isWeeklyLabel(line)) {
            const weeklyLabel = line.startsWith('Veckans vegetariska')
                ? 'Veckans vegetariska'
                : 'Månadens alternativ';
            let description = stripLeadingSeparators(line.slice(weeklyLabel.length));

            if (!description && i + 1 < lines.length) {
                description = lines[i + 1];
                i++;
            }

            if (isMenuDescription(description)) {
                menuItems.push({
                    name: `${weeklyLabel}: ${description}`,
                    price: KANTIN_LUNCH_PRICE,
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

            const strongElement = $(paragraph).find('strong').first();
            const strongTextRaw = normalizeText(strongElement.text());

            if (strongTextRaw) {
                const strongDayLabel = getLeadingDayLabel(strongTextRaw);
                if (strongDayLabel) {
                    let description = stripLeadingSeparators(strongTextRaw.slice(strongDayLabel.length));
                    const spanText = normalizeText(strongElement.parent().find('span').first().text());
                    if (spanText) {
                        description = stripLeadingSeparators(spanText);
                    }

                    if (!description) {
                        const parts = strongElement.parent().contents().toArray().flatMap((node) => {
                            if (node.type === 'text') {
                                return [normalizeText(node.data ?? '')];
                            }

                            if (node.type === 'tag' && node.name !== 'strong') {
                                return [normalizeText($(node).text())];
                            }

                            return [];
                        }).filter(text => text.length > 0);
                        description = stripLeadingSeparators(parts.join(' '));
                    }

                    if (!description && i + 1 < paragraphs.length) {
                        const nextText = normalizeText($(paragraphs[i + 1]).text());
                        if (nextText && !getLeadingDayLabel(nextText) && !isWeeklyLabel(nextText)) {
                            description = nextText;
                            i++;
                        }
                    }

                    if (isMenuDescription(description)) {
                        menuItems.push({
                            name: description,
                            price: KANTIN_LUNCH_PRICE,
                            day: strongDayLabel
                        });
                    }

                    continue;
                }

                if (isWeeklyLabel(strongTextRaw)) {
                    const weeklyLabel = strongTextRaw.startsWith('Veckans vegetariska')
                        ? 'Veckans vegetariska'
                        : 'Månadens alternativ';
                    let description = '';
                    const spanText = normalizeText(strongElement.find('span').first().text());
                    if (spanText) {
                        description = stripLeadingSeparators(spanText);
                    }

                    if (!description) {
                        const siblingParts = strongElement.parent().contents().toArray().flatMap((node) => {
                            if (node.type === 'text') {
                                return [normalizeText(node.data ?? '')];
                            }

                            if (node.type === 'tag' && node.name !== 'strong') {
                                return [normalizeText($(node).text())];
                            }

                            return [];
                        }).filter(text => text.length > 0);
                        description = stripLeadingSeparators(siblingParts.join(' '));
                    }

                    if (!description && i + 1 < paragraphs.length) {
                        description = normalizeText($(paragraphs[i + 1]).text());
                        i++;
                    }

                    if (isMenuDescription(description)) {
                        menuItems.push({
                            name: `${weeklyLabel}: ${description}`,
                            price: KANTIN_LUNCH_PRICE,
                            day: 'Hela veckan'
                        });
                    }
                }

                continue;
            }

            const inlineDayLabel = getLeadingDayLabel(paragraphText);
            if (inlineDayLabel) {
                const description = stripLeadingSeparators(paragraphText.slice(inlineDayLabel.length));

                if (isMenuDescription(description)) {
                    menuItems.push({
                        name: description,
                        price: KANTIN_LUNCH_PRICE,
                        day: inlineDayLabel
                    });
                }
                continue;
            }

            if (isWeeklyLabel(paragraphText)) {
                const weeklyLabel = paragraphText.startsWith('Veckans vegetariska')
                    ? 'Veckans vegetariska'
                    : 'Månadens alternativ';
                const description = stripLeadingSeparators(paragraphText.slice(weeklyLabel.length));

                if (isMenuDescription(description)) {
                    menuItems.push({
                        name: `${weeklyLabel}: ${description}`,
                        price: KANTIN_LUNCH_PRICE,
                        day: 'Hela veckan'
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