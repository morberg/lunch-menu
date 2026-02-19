import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
const KANTIN_LUNCH_PRICE = 145;

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const stripLeadingSeparators = (text: string): string => text.replace(/^\s*[-–—:]\s*/, '').trim();

const extractKantinMenuItems = (text: string): MenuItem[] => {
    const menuItems: MenuItem[] = [];
    const dayPattern = swedishDays.join('|');
    const nextLabelPattern = `(?:Veckans vegetariska|Månadens alternativ|${dayPattern})`;
    const weeklyVegetarianRegex = new RegExp(
        `Veckans vegetariska\\s*[:\\-–—]?\\s*(.+?)(?=\\b(?:Månadens alternativ|${dayPattern})\\b|$)`,
        'i'
    );
    const monthlyAlternativeRegex = new RegExp(
        `Månadens alternativ\\s*[:\\-–—]?\\s*(.+?)(?=\\b(?:Veckans vegetariska|${dayPattern})\\b|$)`,
        'i'
    );
    const dayRegex = new RegExp(
        `\\b(${dayPattern})\\b\\s*[:\\-–—]?\\s*(.+?)(?=\\b${nextLabelPattern}\\b|$)`,
        'g'
    );

    const vegetarianMatch = text.match(weeklyVegetarianRegex);
    if (vegetarianMatch) {
        const description = stripLeadingSeparators(normalizeText(vegetarianMatch[1] ?? ''));
        if (description) {
            menuItems.push({
                name: `Veckans vegetariska: ${description}`,
                price: KANTIN_LUNCH_PRICE,
                day: 'Hela veckan'
            });
        }
    }

    const monthlyMatch = text.match(monthlyAlternativeRegex);
    if (monthlyMatch) {
        const description = stripLeadingSeparators(normalizeText(monthlyMatch[1] ?? ''));
        if (description) {
            menuItems.push({
                name: `Månadens alternativ: ${description}`,
                price: KANTIN_LUNCH_PRICE,
                day: 'Hela veckan'
            });
        }
    }

    for (const match of text.matchAll(dayRegex)) {
        const dayLabel = normalizeText(match[1] ?? '');
        const description = stripLeadingSeparators(normalizeText(match[2] ?? ''));
        if (swedishDays.includes(dayLabel) && description) {
            menuItems.push({
                name: description,
                price: KANTIN_LUNCH_PRICE,
                day: dayLabel
            });
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
        const menuText = normalizeText(menuRoot.text());
        const menuItems = extractKantinMenuItems(menuText);
        if (menuItems.length > 0) {
            return menuItems;
        }
    }

    const bodyText = normalizeText($('body').text());
    return extractKantinMenuItems(bodyText);
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