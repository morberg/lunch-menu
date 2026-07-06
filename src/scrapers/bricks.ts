import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';
import { normalizeToSwedishDay } from '../utils/swedish-days';
import { normalizeWhitespace, scrapeHtmlMenu } from '../utils/scraper';
import { DayGroup, parseDayGroupedHtml } from '../utils/day-grouped-html';

export const scrapeBricksMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    return scrapeHtmlMenu({
        scraperName: 'Bricks',
        fixtureUrl,
        url: 'https://brickseatery.se/lunch/',
        parseHtml: parseBricksHtml
    });
};

export function parseBricksHtml(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const groups: DayGroup[] = [];

    // Bricks renders each day in a structured block like:
    // <h3>Monday</h3> ... <div class="lunchmeny_wrapper"> ... <div class="lunchmeny_container"> ...
    // Parsing the DOM is more robust than scanning body text.
    $('div.lunchmeny_wrapper').each((_, wrapperEl) => {
        const wrapper = $(wrapperEl);

        const dayHeading = wrapper
            .closest('.elementor-element')
            .prevAll()
            .find('h3.elementor-heading-title')
            .first();

        const day = normalizeToSwedishDay(dayHeading.text().trim());
        if (!day) {
            return;
        }
        groups.push({
            day,
            elements: wrapper.find('div.lunchmeny_container')
        });
    });

    return parseDayGroupedHtml({
        groups,
        parseElement: (containerEl) => {
            const container = $(containerEl);
            const category = normalizeWhitespace(container.find('span.lunch_title').text());
            const priceText = normalizeWhitespace(container.find('span.lunch_price').text());
            const description = normalizeWhitespace(container.find('div.lunch_desc').text());

            if (!category || !description) {
                return null;
            }

            const price = parsePrice(priceText);
            // Bricks sometimes includes non-lunch promo items (e.g. free dessert) with no price.
            // Only include actual lunch dishes that have a parseable price.
            if (price === null) {
                return null;
            }

            return {
                name: `${category}: ${description}`,
                price
            };
        }
    });
}