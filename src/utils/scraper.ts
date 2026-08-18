import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import { MenuItem } from '../types/menu';

export const SCRAPER_REQUEST_TIMEOUT_MS = 10_000;
export const SCRAPER_REQUEST_HEADERS = {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': 'lunch-menu-scraper/1.0 (+https://github.com/morberg/lunch-menu)'
} as const;

interface ScrapeHtmlMenuOptions {
    fixtureUrl?: string;
    url: string;
    parseHtml: (html: string) => MenuItem[];
    requestConfig?: AxiosRequestConfig;
}

export function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

export function splitNormalizedLines(text: string): string[] {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map((line) => normalizeWhitespace(line))
        .filter((line) => line.length > 0);
}

export function isFileFixtureUrl(url?: string): boolean {
    return Boolean(url && url.startsWith('file://'));
}

function readFixtureHtml(fixtureUrl: string): string {
    return fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8');
}

export function withScraperRequestDefaults(requestConfig: AxiosRequestConfig = {}): AxiosRequestConfig {
    return {
        ...requestConfig,
        timeout: requestConfig.timeout ?? SCRAPER_REQUEST_TIMEOUT_MS,
        headers: {
            ...SCRAPER_REQUEST_HEADERS,
            ...requestConfig.headers
        }
    };
}

export async function loadHtmlSource(
    fixtureUrl: string | undefined,
    url: string,
    requestConfig?: AxiosRequestConfig
): Promise<string> {
    if (isFileFixtureUrl(fixtureUrl)) {
        return readFixtureHtml(fixtureUrl as string);
    }

    const response = await axios.get<string>(url, withScraperRequestDefaults(requestConfig));
    if (typeof response.data !== 'string') {
        throw new Error(`Expected text response from ${url}`);
    }
    return response.data;
}

export async function scrapeHtmlMenu({
    fixtureUrl,
    url,
    parseHtml,
    requestConfig
}: ScrapeHtmlMenuOptions): Promise<MenuItem[]> {
    const html = await loadHtmlSource(fixtureUrl, url, requestConfig);
    return parseHtml(html);
}