import * as fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { MenuItem } from '../types/menu';
import { findDay, SwedishDay } from '../utils/days';
import {
    isFileFixtureUrl,
    loadHtmlSource,
    normalizeWhitespace,
    splitNormalizedLines,
    withScraperRequestDefaults
} from '../utils/scraper';

const EATERY_LUNCH_PRICE = 139;
const EATERY_PAGE_URL = 'https://eatery.se/anlaggningar/lund';

export const scrapeEatery = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    let pdfBuffer: Buffer;

    if (isFileFixtureUrl(fixtureUrl)) {
        pdfBuffer = fs.readFileSync((fixtureUrl as string).replace('file://', ''));
    } else {
        const mainPageHtml = await loadHtmlSource(undefined, EATERY_PAGE_URL);
        const lunchMenuUrl = findEateryLunchMenuPdfUrl(mainPageHtml);

        if (!lunchMenuUrl) {
            throw new Error('Could not find Eatery lunch menu PDF URL');
        }

        const pdfResponse = await axios.get(lunchMenuUrl, {
            ...withScraperRequestDefaults(),
            responseType: 'arraybuffer'
        });
        pdfBuffer = Buffer.from(pdfResponse.data);
    }

    const pdfData = await pdfParse(pdfBuffer);
    return parsePdfMenu(pdfData.text);
};

export function findEateryLunchMenuPdfUrl(html: string): string | null {
    const $ = cheerio.load(html);

    for (const element of $('a').toArray()) {
        const linkText = normalizeWhitespace($(element).text()).toLowerCase();
        const href = $(element).attr('href');
        if (!linkText.includes('lunchmeny') || !href) {
            continue;
        }

        try {
            const url = new URL(href, EATERY_PAGE_URL);
            if (url.pathname.toLowerCase().endsWith('.pdf')) {
                return url.toString();
            }
        } catch {
            continue;
        }
    }

    return null;
}

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

function pushDish(menuItems: MenuItem[], name: string, day: SwedishDay | undefined): void {
    if (!name || !day) {
        return;
    }

    menuItems.push({
        name,
        day,
        price: EATERY_LUNCH_PRICE
    });
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
