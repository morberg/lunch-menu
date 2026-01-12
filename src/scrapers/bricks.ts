import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

export const scrapeBricksMenu = async (fixtureUrl?: string): Promise<MenuItem[]> => {
    try {
        if (fixtureUrl && fixtureUrl.startsWith('file://')) {
            const fs = await import('fs');
            const html = fs.readFileSync(fixtureUrl.replace('file://', ''), 'utf8');
            return parseBricksHtml(html);
        }

        const url = 'https://brickseatery.se/lunch/';
        const response = await axios.get(url);
        return parseBricksHtml(response.data);
    } catch (error) {
        console.error('Error scraping Bricks menu:', error);
        return [];
    }
};

function parseBricksHtml(html: string): MenuItem[] {
    const $ = cheerio.load(html);
    const menuItems: MenuItem[] = [];

    // List of Swedish day names
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

    // Bricks renders each day in a structured block like:
    // <h3>Monday</h3> ... <div class="lunchmeny_wrapper"> ... <div class="lunchmeny_container"> ...
    // Parsing the DOM is more robust than scanning body text.
    $('div.lunchmeny_wrapper').each((_, wrapperEl) => {
        const wrapper = $(wrapperEl);

        const dayHeading = wrapper
            .closest('.elementor-element')
            .prevAll()
            .find('h3.elementor-heading-title')
            .filter((_, h) => swedishDays.includes($(h).text().trim()))
            .first();

        const day = dayHeading.text().trim();
        if (!swedishDays.includes(day)) {
            return;
        }

        wrapper.find('div.lunchmeny_container').each((_, containerEl) => {
            const container = $(containerEl);

            const category = container.find('span.lunch_title').text().replace(/\s+/g, ' ').trim();
            const priceText = container.find('span.lunch_price').text().replace(/\s+/g, ' ').trim();
            const description = container.find('div.lunch_desc').text().replace(/\s+/g, ' ').trim();

            if (!category || !description) {
                return;
            }

            const price = parsePrice(priceText);
            // Bricks sometimes includes non-lunch promo items (e.g. free dessert) with no price.
            // Only include actual lunch dishes that have a parseable price.
            if (price === null) {
                return;
            }
            menuItems.push({
                name: `${category}: ${description}`,
                price,
                day
            });
        });
    });

    return menuItems;
}