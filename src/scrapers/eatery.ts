import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { MenuItem } from '../types/menu';
import { SWEDISH_DAYS, SwedishDay } from '../utils/days';
import { parsePrice } from '../utils/price';
import { loadHtmlSource, normalizeWhitespace, withScraperRequestDefaults } from '../utils/scraper';

const EATERY_PAGE_URL = 'https://eatery.se/anlaggningar/lund';
const EATERY_MENU_SLUG = 'lund';
const EATERY_LUNCH_PRICE = 139;
const FIRESTORE_QUERY_URL =
    'https://firestore.googleapis.com/v1/projects/pej-menu-display/databases/(default)/documents:runQuery';
const FIRESTORE_BATCH_GET_URL =
    'https://firestore.googleapis.com/v1/projects/pej-menu-display/databases/(default)/documents:batchGet';

type FirestoreFields = Record<string, FirestoreValue>;

interface FirestoreValue {
    stringValue?: string;
    integerValue?: string;
    doubleValue?: number;
    booleanValue?: boolean;
    mapValue?: { fields?: FirestoreFields };
    arrayValue?: { values?: FirestoreValue[] };
}

interface FirestoreDocument {
    name?: string;
    fields?: FirestoreFields;
}

interface FirestoreResponse {
    found?: FirestoreDocument;
    document?: FirestoreDocument;
}

interface EateryRecurrence {
    startDate: string;
    interval: number;
    count?: number;
}

interface EateryBlock {
    id?: string;
    itemId?: string;
    recurrence?: EateryRecurrence;
}

interface EateryMenuEntry {
    status?: string;
    blocks: EateryBlock[];
}

interface EateryMenu {
    timezone: string;
    weekStartsOn: number;
    entries: Record<string, EateryMenuEntry>;
}

interface EateryItem {
    id: string;
    name?: Record<string, string>;
    description?: Record<string, string>;
    status?: string;
}

interface EateryFixture {
    menu?: EateryMenu;
    items?: EateryItem[];
}

export const scrapeEatery = async (
    fixtureUrl?: string,
    referenceDate: Date = new Date()
): Promise<MenuItem[]> => {
    if (fixtureUrl?.startsWith('file://')) {
        return parseEateryFixture(
            fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8'),
            referenceDate
        );
    }

    const [organizationResponse, locationHtml] = await Promise.all([
        requestJson<FirestoreResponse[]>(FIRESTORE_QUERY_URL, {
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
        }),
        loadHtmlSource(undefined, EATERY_PAGE_URL)
    ]);
    const price = findEateryOrdinaryPrice(locationHtml);
    if (price === null) {
        throw new Error('Could not find Eatery ordinary lunch price');
    }

    const organization = findDocument(organizationResponse, 'organization');
    const menu = readFirestoreMenu(organization);
    const itemIds = weekEntries(menu, referenceDate)
        .flatMap(({ blocks }) => blocks.flatMap(({ itemId }) => itemId ? [itemId] : []));
    if (itemIds.length === 0) {
        return [];
    }

    const path = organization.name;
    if (!path) {
        throw new Error('Eatery organization response did not include a document path');
    }

    const itemResponse = await requestJson<FirestoreResponse[]>(FIRESTORE_BATCH_GET_URL, {
        documents: [...new Set(itemIds)].map((id) => `${path}/items/${id}`)
    });
    return buildMenuItems(menu, readItems(itemResponse), referenceDate, price);
};

export function findEateryOrdinaryPrice(html: string): number | null {
    const $ = cheerio.load(html);
    for (const paragraph of $('p').toArray()) {
        const text = normalizeWhitespace($(paragraph).text());
        const match = text.match(/\bordinarie\b.*?(\d+(?:[.,]\d{2})?)\s*(?:kr|:-|sek)/i);
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
    const fixture = parseJsonSource<EateryFixture>(source);
    if (!fixture.menu || !Array.isArray(fixture.items)) {
        throw new Error('Could not parse Eatery menu fixture');
    }
    return buildMenuItems(fixture.menu, fixture.items, referenceDate, EATERY_LUNCH_PRICE);
}

function buildMenuItems(
    menu: EateryMenu,
    items: EateryItem[],
    referenceDate: Date,
    price: number | null
): MenuItem[] {
    const itemsById = new Map(items.map((item) => [item.id, item]));
    return weekEntries(menu, referenceDate).flatMap(({ day, blocks }) =>
        blocks.flatMap(({ itemId }) => {
            const item = itemId ? itemsById.get(itemId) : undefined;
            if (!item || !isVisible(item)) {
                return [];
            }

            const name = localized(item.name);
            const description = localized(item.description);
            const fullName = normalizeWhitespace(`${name} ${description}`);
            return fullName ? [{ name: fullName, day, price }] : [];
        })
    );
}

function readFirestoreMenu(document: FirestoreDocument): EateryMenu {
    const menu = (document.fields?.menus?.arrayValue?.values ?? []).find(
        (value) => stringField(mapValue(value), 'slug') === EATERY_MENU_SLUG
    );
    if (!menu) {
        throw new Error('Could not find the Eatery Lund menu');
    }

    const fields = mapValue(menu);
    const entries = mapField(fields, 'entries') ?? {};
    return {
        timezone: stringField(fields, 'timezone') ?? 'Europe/Stockholm',
        weekStartsOn: numberField(fields, 'weekStartsOn') ?? 1,
        entries: Object.fromEntries(
            Object.entries(entries).map(([date, value]) => {
                const entry = mapValue(value);
                return [date, {
                    status: stringField(entry, 'status'),
                    blocks: (entry?.informationBlocks?.arrayValue?.values ?? []).map(readBlock)
                }];
            })
        )
    };
}

function readBlock(value: FirestoreValue): EateryBlock {
    const fields = mapValue(value);
    const recurrence = mapField(fields, 'recurrence');
    return {
        id: stringField(fields, 'id'),
        itemId: stringField(fields, 'libraryItemId'),
        ...(recurrence ? {
            recurrence: {
                startDate: stringField(recurrence, 'startDate') ?? '',
                interval: numberField(recurrence, 'interval') ?? 1,
                count: numberField(recurrence, 'count')
            }
        } : {})
    };
}

function readItems(responses: FirestoreResponse[]): EateryItem[] {
    return responses.flatMap(({ found }) => {
        if (!found?.name?.includes('/items/')) {
            return [];
        }

        const fields = found.fields ?? {};
        return [{
            id: stringField(fields, 'id') ?? found.name.split('/').pop() ?? '',
            name: localizedField(fields, 'name'),
            description: localizedField(fields, 'description'),
            status: stringField(fields, 'status')
        }];
    });
}

function weekEntries(
    menu: EateryMenu,
    referenceDate: Date
): Array<{ day: SwedishDay; blocks: EateryBlock[] }> {
    return weekDates(referenceDate, menu.timezone, menu.weekStartsOn).flatMap((date, index) => {
        const entry = menu.entries[date];
        if (entry?.status?.toLowerCase() === 'closed') {
            return [];
        }

        const blocks = [...(entry?.blocks ?? [])];
        const seen = new Set(blocks.map((block) => blockKey(block, date)));
        for (const [sourceDate, candidate] of Object.entries(menu.entries)) {
            if (sourceDate === date) {
                continue;
            }
            for (const block of candidate.blocks) {
                if (block.recurrence && isRecurringOn(block.recurrence, date)) {
                    const key = blockKey(block, sourceDate);
                    if (!seen.has(key)) {
                        seen.add(key);
                        blocks.push(block);
                    }
                }
            }
        }
        return [{ day: SWEDISH_DAYS[index], blocks }];
    });
}

function blockKey(block: EateryBlock, sourceDate: string): string {
    return block.id ?? `${sourceDate}:${block.itemId ?? ''}`;
}

function isRecurringOn(recurrence: EateryRecurrence, date: string): boolean {
    const days = Math.round(
        (dateFromKey(date).getTime() - dateFromKey(recurrence.startDate).getTime()) / 86_400_000
    );
    const interval = Math.max(1, recurrence.interval) * 7;
    return days >= 0 && days % interval === 0 && (!recurrence.count || days / interval < recurrence.count);
}

function weekDates(referenceDate: Date, timeZone: string, weekStartsOn: number): string[] {
    const date = new Date(
        `${new Intl.DateTimeFormat('sv-SE', { timeZone }).format(referenceDate)}T00:00:00Z`
    );
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() - weekStartsOn + 7) % 7));

    return Array.from({ length: SWEDISH_DAYS.length }, (_, index) => {
        const current = new Date(date);
        current.setUTCDate(date.getUTCDate() + index);
        return current.toISOString().slice(0, 10);
    });
}

function dateFromKey(value: string): Date {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid Eatery date: ${value}`);
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function isVisible(item: EateryItem): boolean {
    const status = item.status?.trim().toLowerCase();
    return !status || ['forsale', 'for_sale', 'temporarysoldout'].includes(status);
}

function localized(values: Record<string, string> | undefined): string {
    return normalizeWhitespace(values?.sv || Object.values(values ?? {}).find((value) => value.trim()) || '');
}

function localizedField(fields: FirestoreFields, key: string): Record<string, string> | undefined {
    const values = mapField(fields, key);
    if (!values) {
        return undefined;
    }

    const result: Record<string, string> = {};
    for (const [language, value] of Object.entries(values)) {
        if (value.stringValue !== undefined) {
            result[language] = value.stringValue;
        }
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

function findDocument(responses: FirestoreResponse[], description: string): FirestoreDocument {
    const document = responses
        .map(({ found, document }) => found ?? document)
        .find((candidate): candidate is FirestoreDocument => candidate !== undefined);
    if (!document) {
        throw new Error(`Could not find Eatery ${description} document`);
    }
    return document;
}

function mapValue(value: FirestoreValue | undefined): FirestoreFields {
    return value?.mapValue?.fields ?? {};
}

function mapField(fields: FirestoreFields, key: string): FirestoreFields | undefined {
    return fields[key]?.mapValue?.fields;
}

function stringField(fields: FirestoreFields, key: string): string | undefined {
    return fields[key]?.stringValue;
}

function numberField(fields: FirestoreFields, key: string): number | undefined {
    const value = fields[key];
    if (value?.integerValue !== undefined) {
        return Number(value.integerValue);
    }
    return value?.doubleValue;
}

async function requestJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
    const response = await axios.post<T>(
        url,
        body,
        withScraperRequestDefaults({
            responseType: 'json',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            }
        })
    );
    return response.data;
}

function parseJsonSource<T>(source: string): T {
    try {
        return JSON.parse(source) as T;
    } catch (error) {
        throw new Error('Could not parse Eatery menu fixture', { cause: error });
    }
}
