import axios, { AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import { MenuItem } from '../types/menu';

interface ScrapeHtmlMenuOptions {
    scraperName: string;
    fixtureUrl?: string;
    url: string;
    parseHtml: (html: string) => MenuItem[];
    requestConfig?: AxiosRequestConfig;
    fallback?: MenuItem[];
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

export function readFixtureHtml(fixtureUrl: string): string {
    return fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8');
}

export async function loadHtmlSource(
    fixtureUrl: string | undefined,
    url: string,
    requestConfig?: AxiosRequestConfig
): Promise<string> {
    if (isFileFixtureUrl(fixtureUrl)) {
        return readFixtureHtml(fixtureUrl as string);
    }

    const response = await axios.get<string>(url, requestConfig);
    return response.data;
}

export async function scrapeHtmlMenu({
    scraperName,
    fixtureUrl,
    url,
    parseHtml,
    requestConfig,
    fallback = []
}: ScrapeHtmlMenuOptions): Promise<MenuItem[]> {
    try {
        const html = await loadHtmlSource(fixtureUrl, url, requestConfig);
        return parseHtml(html);
    } catch (error) {
        console.error(`Error scraping ${scraperName} menu:`, error);
        return fallback;
    }
}