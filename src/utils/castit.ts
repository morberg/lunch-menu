import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { normalizeToSwedishDay } from '../utils/swedish-days';
import { normalizeWhitespace } from '../utils/scraper';

export interface CastitPrices {
    dailyPrice: number | null;
    weeklyPrice: number | null;
}

export function parseCastitMenu(html: string, defaultPrices?: CastitPrices): MenuItem[] {
    const $ = cheerio.load(html);
    const items: MenuItem[] = [];

    const { dailyPrice, weeklyPrice } = extractPrices($, defaultPrices);

    const weekPanel = $('.castit-weekpanel.is-active').first();
    const container = weekPanel.length > 0 ? weekPanel : $('body');

    container.find('section.castit-day.castit-day--week .castit-dish:not(.castit-dish--day-note)').each((_: number, el: any) => {
        const dish = extractDish($, el);
        if (dish) {
            items.push({ name: dish, price: weeklyPrice, day: 'Hela veckan' });
        }
    });

    container.find('section.castit-day:not(.castit-day--week)').each((_: number, section: any) => {
        const dayText = normalizeWhitespace(
            $(section).find('h3.castit-day__title .castit-i18n').first().attr('data-sv') ||
            $(section).find('h3.castit-day__title .castit-i18n').first().text()
        );
        const dayName = normalizeToSwedishDay(dayText);
        if (!dayName) return;

        $(section).find('.castit-dish:not(.castit-dish--day-note)').each((_: number, el: any) => {
            const dish = extractDish($, el);
            if (dish) {
                items.push({ name: dish, price: dailyPrice, day: dayName });
            }
        });
    });

    return items;
}

function extractDish($: cheerio.Root, el: any): string | null {
    const titleEl = $(el).find('.castit-dish__title .castit-i18n').first();
    const descEl = $(el).find('.castit-dish__desc .castit-i18n').first();

    const title = normalizeWhitespace(titleEl.attr('data-sv') || titleEl.text());
    const desc = normalizeWhitespace(descEl.attr('data-sv') || descEl.text());

    if (!title) return null;

    return desc ? `${title}, ${desc}` : title;
}

function extractPrices($: cheerio.Root, defaults?: CastitPrices): CastitPrices {
    let dailyPrice: number | null = defaults?.dailyPrice ?? null;
    let weeklyPrice: number | null = defaults?.weeklyPrice ?? null;

    $('.castit-lunch-meta__item').each((_: number, el: any) => {
        const text = normalizeWhitespace($(el).text());
        const price = parsePrice(text);
        if (price === null) return;

        if (/weekly|vecka/i.test(text)) {
            weeklyPrice = price;
        } else {
            dailyPrice = price;
        }
    });

    if (weeklyPrice === null) {
        const noteText = normalizeWhitespace($('.castit-week-note .castit-week-note__title').text());
        weeklyPrice = parsePrice(noteText);
    }

    return { dailyPrice, weeklyPrice };
}
