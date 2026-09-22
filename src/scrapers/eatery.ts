import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { MenuItem } from '../types/menu';
import { findDay, SWEDISH_DAYS, SwedishDay } from '../utils/days';
import { parsePrice } from '../utils/price';
import {
    isFileFixtureUrl,
    loadHtmlSource,
    normalizeWhitespace,
    withScraperRequestDefaults
} from '../utils/scraper';

const EATERY_MENU_URL = 'https://menu.pej.io/ea/menus/lund';
const EATERY_PAGE_URL = 'https://eatery.se/anlaggningar/lund';
const EATERY_LUNCH_PRICE = 139;
const EATERY_ORGANIZATION_QUERY_URL =
    'https://firestore.googleapis.com/v1/projects/pej-menu-display/databases/(default)/documents:runQuery';
const EATERY_BATCH_GET_URL =
    'https://firestore.googleapis.com/v1/projects/pej-menu-display/databases/(default)/documents:batchGet';

interface FirestoreValue {
    stringValue?: string;
    integerValue?: string;
    doubleValue?: number;
    booleanValue?: boolean;
    timestampValue?: string;
    nullValue?: null;
    mapValue?: {
        fields?: Record<string, FirestoreValue>;
    };
    arrayValue?: {
        values?: FirestoreValue[];
    };
}

interface FirestoreDocument {
    name?: string;
    fields?: Record<string, FirestoreValue>;
}

interface EateryRecurrence {
    startDate: string;
    interval: number;
    count?: number;
    until?: string;
    exceptions?: string[];
}

interface EateryInformationBlock {
    id?: string;
    libraryItemId?: string;
    recurrence?: EateryRecurrence;
}

interface EateryMenuEntry {
    status?: string;
    informationBlocks?: EateryInformationBlock[];
}

interface EateryMenu {
    slug?: string;
    timezone?: string;
    weekStartsOn?: number;
    entries?: Record<string, EateryMenuEntry>;
}

interface EateryItem {
    id: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    status?: string;
}

export const scrapeEatery = async (
    fixtureUrl?: string,
    referenceDate: Date = new Date()
): Promise<MenuItem[]> => {
    if (isFileFixtureUrl(fixtureUrl)) {
        const fixture = fs.readFileSync((fixtureUrl as string).replace('file://', ''), 'utf8');
        return parseEateryFixture(fixture, referenceDate);
    }

    const [menuHtml, locationHtml] = await Promise.all([
        loadHtmlSource(undefined, EATERY_MENU_URL),
        loadHtmlSource(undefined, EATERY_PAGE_URL)
    ]);
    const price = findEateryOrdinaryPrice(locationHtml);
    if (price === null) {
        throw new Error('Could not find Eatery ordinary lunch price');
    }

    const htmlMenu = parseEateryMenuFromHtml(menuHtml, price);
    if (htmlMenu.length > 0) {
        return htmlMenu;
    }

    return scrapeEateryData(referenceDate, price);
};

export function parseEateryMenuFromHtml(
    html: string,
    price: number | null = EATERY_LUNCH_PRICE
): MenuItem[] {
    const $ = cheerio.load(html);
    const menuItems: MenuItem[] = [];

    $('.menu-public--weekly .day, .menu-public .day').each((_, dayElement) => {
        const dayContainer = $(dayElement);
        const day = findDay(dayContainer.find('.day__title').first().text());
        if (!day) {
            return;
        }

        dayContainer.find('.day__items .item').each((__, itemElement) => {
            const item = $(itemElement);
            const name = normalizeWhitespace(item.find('.item__name').first().text());
            const description = normalizeWhitespace(item.find('.item__description').first().text());
            const fullName = normalizeWhitespace(`${name} ${description}`);

            if (!fullName) {
                return;
            }

            menuItems.push({
                name: fullName,
                day,
                price
            });
        });
    });

    return menuItems;
}

export function findEateryOrdinaryPrice(html: string): number | null {
    const $ = cheerio.load(html);

    for (const paragraph of $('p').toArray()) {
        const text = normalizeWhitespace($(paragraph).text());
        if (!/\bordinarie\b/i.test(text)) {
            continue;
        }

        const match = text.match(
            /\bordinarie\b.*?(\d+(?:[.,]\d{2})?)\s*(?:kr|:-|sek)/i
        );
        if (match) {
            return parsePrice(`${match[1]} kr`);
        }
    }

    return null;
}

export function parseEateryFixture(
    source: string,
    referenceDate: Date = new Date()
): MenuItem[] {
    const trimmed = source.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        return parseEaterySnapshot(parseJsonSource(trimmed, 'Eatery menu data'), referenceDate);
    }

    const menu = parseEateryMenuFromHtml(source);
    if (menu.length === 0) {
        throw new Error('Could not find Eatery menu items in the fixture');
    }
    return menu;
}

async function scrapeEateryData(referenceDate: Date, price: number): Promise<MenuItem[]> {
    const organizationResponse = await requestJson(EATERY_ORGANIZATION_QUERY_URL, {
        structuredQuery: {
            from: [{ collectionId: 'organizations' }],
            where: {
                fieldFilter: {
                    field: { fieldPath: 'slug' },
                    op: 'EQUAL',
                    value: { stringValue: 'ea' }
                }
            },
            limit: 1
        }
    });
    const organizationDocument = findDocument(organizationResponse, 'organization');
    const organization = decodeDocument(organizationDocument);
    const menu = findEateryMenu(organization);
    const itemIds = findWeekItemIds(menu, referenceDate);

    if (itemIds.length === 0) {
        return buildMenuItems(organization, [], referenceDate, price);
    }

    const organizationPath = organizationDocument.name;
    if (!organizationPath) {
        throw new Error('Eatery organization response did not include a document path');
    }

    const itemResponse = await requestJson(EATERY_BATCH_GET_URL, {
        documents: itemIds.map((itemId) => `${organizationPath}/items/${itemId}`)
    });
    return buildMenuItems(
        organization,
        findItemDocuments(itemResponse),
        referenceDate,
        price
    );
}

function parseEaterySnapshot(source: unknown, referenceDate: Date): MenuItem[] {
    const responses = asArray(source);
    const organizationDocument = findDocument(responses, 'organization');
    const organization = decodeDocument(organizationDocument);
    const items = findItemDocuments(responses);

    return buildMenuItems(organization, items, referenceDate, EATERY_LUNCH_PRICE);
}

function buildMenuItems(
    organization: Record<string, unknown>,
    itemDocuments: FirestoreDocument[],
    referenceDate: Date,
    price: number | null
): MenuItem[] {
    const menu = findEateryMenu(organization);
    const items = new Map(
        itemDocuments.map((document) => {
            const decoded = decodeDocument(document);
            const documentName = document.name?.split('/').pop();
            const id = readString(decoded.id) ?? documentName ?? '';
            return [id, {
                id,
                name: readStringMap(decoded.name),
                description: readStringMap(decoded.description),
                status: readString(decoded.status)
            }] as const;
        })
    );

    return findWeekMenuEntries(menu, referenceDate).flatMap(({ day, blocks }) =>
        blocks.flatMap((block) => {
            if (!block.libraryItemId) {
                return [];
            }

            const item = items.get(block.libraryItemId);
            if (!item || !isVisibleEateryItem(item)) {
                return [];
            }

            const name = selectSwedishText(item.name);
            const description = selectSwedishText(item.description);
            const fullName = normalizeWhitespace(`${name} ${description}`);
            return fullName ? [{ name: fullName, day, price }] : [];
        })
    );
}

function findEateryMenu(organization: Record<string, unknown>): EateryMenu {
    const menus = readArray(organization.menus);
    const menu = menus
        .map(readRecord)
        .find((candidate) => readString(candidate?.slug) === 'lund');
    if (!menu) {
        throw new Error('Could not find the Eatery Lund menu');
    }

    return {
        slug: readString(menu.slug),
        timezone: readString(menu.timezone) ?? 'Europe/Stockholm',
        weekStartsOn: readNumber(menu.weekStartsOn) ?? 1,
        entries: readEntryMap(menu.entries)
    };
}

function findWeekItemIds(menu: EateryMenu, referenceDate: Date): string[] {
    const blocks = findWeekMenuEntries(menu, referenceDate).flatMap(({ blocks: dayBlocks }) => dayBlocks);
    return [...new Set(blocks.flatMap((block) => block.libraryItemId ? [block.libraryItemId] : []))];
}

function findWeekMenuEntries(
    menu: EateryMenu,
    referenceDate: Date
): Array<{ day: SwedishDay; blocks: EateryInformationBlock[] }> {
    const entries = menu.entries ?? {};
    const dateKeys = getWeekDateKeys(
        referenceDate,
        menu.timezone ?? 'Europe/Stockholm',
        menu.weekStartsOn ?? 1
    );

    return dateKeys.flatMap((dateKey, index) => {
        const entry = entries[dateKey];
        if (isClosed(entry?.status)) {
            return [];
        }

        const blocks = getBlocksForDate(entries, dateKey);
        return [{ day: SWEDISH_DAYS[index], blocks }];
    });
}

function getBlocksForDate(
    entries: Record<string, EateryMenuEntry>,
    dateKey: string
): EateryInformationBlock[] {
    const blocks: EateryInformationBlock[] = [];
    const seen = new Set<string>();

    const addBlocks = (entryDate: string, entryBlocks: EateryInformationBlock[]): void => {
        for (const block of entryBlocks) {
            const key = block.id ?? `${block.libraryItemId ?? ''}:${entryDate}`;
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            blocks.push(block);
        }
    };

    addBlocks(dateKey, entries[dateKey]?.informationBlocks ?? []);
    for (const [entryDate, entry] of Object.entries(entries)) {
        if (entryDate === dateKey) {
            continue;
        }
        addBlocks(
            entryDate,
            (entry.informationBlocks ?? []).filter(
                (block) => block.recurrence && isRecurringOn(block.recurrence, dateKey)
            )
        );
    }

    return blocks;
}

function isRecurringOn(recurrence: EateryRecurrence, dateKey: string): boolean {
    if (dateKey < recurrence.startDate || recurrence.exceptions?.includes(dateKey)) {
        return false;
    }
    if (recurrence.until && dateKey > recurrence.until) {
        return false;
    }

    const start = dateFromKey(recurrence.startDate);
    const current = dateFromKey(dateKey);
    const days = Math.round((current.getTime() - start.getTime()) / 86_400_000);
    if (days < 0 || days % (Math.max(1, recurrence.interval) * 7) !== 0) {
        return false;
    }

    const occurrence = Math.floor(days / (Math.max(1, recurrence.interval) * 7)) + 1;
    return !recurrence.count || occurrence <= recurrence.count;
}

function getWeekDateKeys(referenceDate: Date, timeZone: string, weekStartsOn: number): string[] {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(referenceDate);
    const year = Number(parts.find((part) => part.type === 'year')?.value);
    const month = Number(parts.find((part) => part.type === 'month')?.value);
    const day = Number(parts.find((part) => part.type === 'day')?.value);
    if (![year, month, day].every(Number.isFinite)) {
        throw new Error(`Could not determine Eatery week for timezone ${timeZone}`);
    }

    const localDate = new Date(Date.UTC(year, month - 1, day));
    const weekDay = localDate.getUTCDay();
    const startOffset = (weekDay - weekStartsOn + 7) % 7;
    localDate.setUTCDate(localDate.getUTCDate() - startOffset);

    return Array.from({ length: 5 }, (_, index) => {
        const date = new Date(localDate);
        date.setUTCDate(localDate.getUTCDate() + index);
        return date.toISOString().slice(0, 10);
    });
}

function dateFromKey(value: string): Date {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid Eatery date: ${value}`);
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function isClosed(status: string | undefined): boolean {
    return status?.trim().toLowerCase() === 'closed';
}

function isVisibleEateryItem(item: EateryItem): boolean {
    const status = item.status?.trim().toLowerCase();
    return !status || status === 'forsale' || status === 'for_sale' || status === 'temporarysoldout';
}

function selectSwedishText(values: Record<string, string> | undefined): string {
    if (!values) {
        return '';
    }
    return normalizeWhitespace(values.sv ?? Object.values(values).find((value) => value.trim()) ?? '');
}

function findDocument(source: unknown, description: string): FirestoreDocument {
    for (const response of asArray(source)) {
        const record = readRecord(response);
        const document = readDocument(record?.found) ?? readDocument(record?.document);
        if (document) {
            return document;
        }
    }
    throw new Error(`Could not find Eatery ${description} document`);
}

function findItemDocuments(source: unknown): FirestoreDocument[] {
    return asArray(source).flatMap((response) => {
        const record = readRecord(response);
        const document = readDocument(record?.found);
        return document?.name?.includes('/items/') ? [document] : [];
    });
}

function readEntryMap(value: unknown): Record<string, EateryMenuEntry> {
    const record = readRecord(value);
    if (!record) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(record).flatMap(([date, entryValue]) => {
            const entry = readRecord(entryValue);
            if (!entry) {
                return [];
            }
            return [[date, {
                status: readString(entry.status),
                informationBlocks: readArray(entry.informationBlocks).flatMap(readInformationBlock)
            }]];
        })
    );
}

function readInformationBlock(value: unknown): EateryInformationBlock[] {
    const record = readRecord(value);
    if (!record) {
        return [];
    }

    const recurrenceRecord = readRecord(record.recurrence);
    const recurrence = recurrenceRecord
        ? {
              startDate: readString(recurrenceRecord.startDate) ?? '',
              interval: readNumber(recurrenceRecord.interval) ?? 1,
              count: readNumber(recurrenceRecord.count),
              until: readString(recurrenceRecord.until),
              exceptions: readArray(recurrenceRecord.exceptions).flatMap((item) =>
                  typeof item === 'string' ? [item] : []
              )
          }
        : undefined;

    return [{
        id: readString(record.id),
        libraryItemId: readString(record.libraryItemId),
        ...(recurrence?.startDate ? { recurrence } : {})
    }];
}

function decodeDocument(document: FirestoreDocument): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(document.fields ?? {}).map(([key, value]) => [key, decodeFirestoreValue(value)])
    );
}

function decodeFirestoreValue(value: FirestoreValue): unknown {
    if (value.stringValue !== undefined) {
        return value.stringValue;
    }
    if (value.integerValue !== undefined) {
        return Number(value.integerValue);
    }
    if (value.doubleValue !== undefined) {
        return value.doubleValue;
    }
    if (value.booleanValue !== undefined) {
        return value.booleanValue;
    }
    if (value.timestampValue !== undefined) {
        return value.timestampValue;
    }
    if (value.nullValue !== undefined) {
        return null;
    }
    if (value.mapValue) {
        return Object.fromEntries(
            Object.entries(value.mapValue.fields ?? {}).map(([key, nested]) => [
                key,
                decodeFirestoreValue(nested)
            ])
        );
    }
    if (value.arrayValue) {
        return (value.arrayValue.values ?? []).map(decodeFirestoreValue);
    }
    return null;
}

async function requestJson(url: string, body: Record<string, unknown>): Promise<unknown> {
    const response = await axios.post<string>(
        url,
        body,
        withScraperRequestDefaults({
            responseType: 'text',
            transformResponse: (data) => data,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
    );
    if (typeof response.data !== 'string') {
        throw new Error(`Expected JSON response from ${url}`);
    }
    return parseJsonSource(response.data, url);
}

function parseJsonSource(source: string, description: string): unknown {
    try {
        return JSON.parse(source) as unknown;
    } catch (error) {
        throw new Error(`Could not parse ${description}`, { cause: error });
    }
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function readDocument(value: unknown): FirestoreDocument | null {
    const record = readRecord(value);
    if (!record) {
        return null;
    }
    const fields = readRecord(record.fields);
    return {
        name: readString(record.name),
        fields: fields as Record<string, FirestoreValue> | undefined
    };
}

function readRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function readString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function readStringMap(value: unknown): Record<string, string> | undefined {
    const record = readRecord(value);
    if (!record) {
        return undefined;
    }
    const strings = Object.fromEntries(
        Object.entries(record).flatMap(([key, candidate]) =>
            typeof candidate === 'string' ? [[key, candidate]] : []
        )
    );
    return Object.keys(strings).length > 0 ? strings : undefined;
}
