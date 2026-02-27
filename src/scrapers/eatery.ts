import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { MenuItem } from '../types/menu';
import { SWEDISH_DAYS, SwedishDay } from '../utils/swedish-days';
import { normalizeWhitespace, splitNormalizedLines } from '../utils/scraper';

const EATERY_LUNCH_PRICE = 139;

export const scrapeEatery = async (): Promise<MenuItem[]> => {
    try {
        console.log('Fetching Eatery main page...');

        // First, get the main page to find the current lunch menu PDF URL
        const mainPageResponse = await axios.get('https://eatery.se/anlaggningar/lund');
        const $ = cheerio.load(mainPageResponse.data);

        // Find the "Lunchmeny" link
        let lunchMenuUrl = '';
        $('a').each((_, element) => {
            const linkText = $(element).text().trim();
            const href = $(element).attr('href');

            if (linkText.toLowerCase().includes('lunchmeny') && href && href.includes('.pdf')) {
                try {
                    lunchMenuUrl = new URL(href, 'https://eatery.se').toString();
                } catch {
                    lunchMenuUrl = href;
                }
                return false; // Break the loop
            }
        });

        if (!lunchMenuUrl) {
            console.error('Could not find lunch menu PDF URL');
            return [];
        }

        console.log(`Found lunch menu URL: ${lunchMenuUrl}`);

        // Download the PDF
        const pdfResponse = await axios.get(lunchMenuUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        // Parse the PDF to extract text
        const pdfData = await pdfParse(Buffer.from(pdfResponse.data));
        const pdfText = pdfData.text;

        console.log('PDF text extracted, parsing menu items...');

        // Parse the PDF text to extract menu items
        const menuItems = parsePdfMenu(pdfText);

        console.log(`Extracted ${menuItems.length} menu items from Eatery PDF`);
        return menuItems;

    } catch (error) {
        console.error('Error scraping Eatery:', error);
        return [];
    }
};

export function parsePdfMenu(pdfText: string): MenuItem[] {
    const menuItems: MenuItem[] = [];

    // Clean the text and split into lines
    const lines = splitNormalizedLines(pdfText);

    let currentDay: SwedishDay | null = null;

    let currentDish = '';
    let pendingPrefix = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const dayFound = findDay(line);
        if (dayFound) {
            if (currentDish) {
                pushDish(menuItems, currentDish, currentDay ?? dayFound);
                currentDish = '';
            }
            currentDay = dayFound;
            continue;
        }

        if (!currentDay) {
            continue;
        }

        if (startsFooterBlock(line)) {
            break;
        }

        const adjusted = adjustTrailingCapital(line, lines[i + 1]);
        const lineWithPrefix = pendingPrefix
            ? `${pendingPrefix} ${adjusted.line}`.trim()
            : adjusted.line;
        const startsNew = pendingPrefix.length > 0 || startsWithCapital(lineWithPrefix);
        pendingPrefix = adjusted.nextPrefix;

        if (!currentDish) {
            currentDish = lineWithPrefix;
            continue;
        }

        if (startsNew) {
            pushDish(menuItems, currentDish, currentDay);
            currentDish = lineWithPrefix;
        } else {
            currentDish = `${currentDish} ${lineWithPrefix}`.trim();
        }
    }

    if (currentDish && currentDay) {
        pushDish(menuItems, currentDish, currentDay);
    }

    return menuItems;
}

function pushDish(menuItems: MenuItem[], name: string, day: string | undefined): void {
    if (!name || !day) {
        return;
    }

    menuItems.push({
        name,
        day,
        price: EATERY_LUNCH_PRICE
    });
}

function findDay(line: string): SwedishDay | null {
    const normalized = normalizeLine(line).toLowerCase();
    if (!normalized) {
        return null;
    }

    const tokens = normalized.split(' ').filter(Boolean);
    for (const token of tokens) {
        const matchedDay = SWEDISH_DAYS.find((day) => day.toLowerCase() === token);
        if (matchedDay) {
            return matchedDay;
        }
    }

    return null;
}

function normalizeLine(line: string): string {
    return normalizeWhitespace(line);
}

function startsFooterBlock(line: string): boolean {
    const normalized = normalizeLine(line);
    return normalized.startsWith('GENERÖS');
}

function startsWithCapital(line: string): boolean {
    const trimmed = line.trim();
    if (!trimmed) {
        return false;
    }
    const firstChar = trimmed[0];
    const lower = firstChar.toLowerCase();
    const upper = firstChar.toUpperCase();
    if (lower === upper) {
        return false;
    }
    return firstChar === upper;
}

function adjustTrailingCapital(line: string, nextLine?: string): { line: string; nextPrefix: string } {
    const trimmed = line.trim();
    if (!nextLine) {
        return { line: trimmed, nextPrefix: '' };
    }

    const nextTrimmed = nextLine.trim();
    if (!nextTrimmed || startsWithCapital(nextTrimmed)) {
        return { line: trimmed, nextPrefix: '' };
    }

    const words = trimmed.split(' ').filter(Boolean);
    if (words.length < 2) {
        return { line: trimmed, nextPrefix: '' };
    }

    const lastWord = words[words.length - 1];
    if (!startsWithCapital(lastWord)) {
        return { line: trimmed, nextPrefix: '' };
    }

    return {
        line: words.slice(0, -1).join(' '),
        nextPrefix: lastWord
    };
}
