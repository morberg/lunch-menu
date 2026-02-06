import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { MenuItem } from '../types/menu';

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

    const dayMap: Record<string, string> = {
        'måndag': 'Måndag',
        'tisdag': 'Tisdag',
        'onsdag': 'Onsdag',
        'torsdag': 'Torsdag',
        'fredag': 'Fredag'
    };

    // Clean the text and split into lines
    const lines = pdfText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => normalizeLine(line))
        .filter((line) => line.length > 0);

    let currentDay = '';

    let currentDish = '';
    let pendingPrefix = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const dayFound = findDay(line, dayMap);
        if (dayFound) {
            if (currentDish) {
                menuItems.push({
                    name: currentDish,
                    day: dayMap[currentDay] ?? dayMap[dayFound],
                    price: 135
                });
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
            menuItems.push({
                name: currentDish,
                day: dayMap[currentDay],
                price: 135
            });
            currentDish = lineWithPrefix;
        } else {
            currentDish = `${currentDish} ${lineWithPrefix}`.trim();
        }
    }

    if (currentDish && currentDay) {
        menuItems.push({
            name: currentDish,
            day: dayMap[currentDay],
            price: 135
        });
    }

    return menuItems;
}

function findDay(line: string, dayMap: Record<string, string>): string | null {
    const normalized = normalizeLine(line).toLowerCase();
    if (!normalized) {
        return null;
    }

    const tokens = normalized.split(' ').filter(Boolean);
    for (const token of tokens) {
        if (dayMap[token]) {
            return token;
        }
    }

    return null;
}

function normalizeLine(line: string): string {
    return line.replace(/\s+/g, ' ').trim();
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

export function splitIntoDishes(content: string): string[] {
    // The PDF preserves line breaks between dishes - much simpler and more reliable!
    // Split by newlines and filter out empty lines and non-dish content
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const dishes: string[] = [];
    let currentDish = '';

    for (const line of lines) {
        // If line starts with capital letter and we have accumulated dish content,
        // it's likely a new dish
        if (line.match(/^[A-ZÅÄÖ]/) && currentDish.length > 15) {
            dishes.push(currentDish.trim());
            currentDish = line;
        } else {
            // Continue building current dish (handle multi-line dishes)
            if (currentDish) {
                currentDish += ' ' + line;
            } else {
                currentDish = line;
            }
        }
    }

    // Don't forget the last dish
    if (currentDish.length > 15) {
        dishes.push(currentDish.trim());
    }

    return dishes.filter(dish => dish.length > 15);
}
