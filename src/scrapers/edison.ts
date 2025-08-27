import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

export const scrapeEdisonMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://restaurangedison.se/lunch/';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const menuItems: MenuItem[] = [];

        // List of Swedish day names
        const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        let currentDay = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if line is a Swedish day name
            if (swedishDays.includes(line)) {
                currentDay = line;
                continue;
            }

            // Check if line starts with a category (allow extra text after category)
            const categoryMatch = line.match(/^(Green|Local|World Wide)(,.*)?$/);
            if (categoryMatch && currentDay) {
                const category = categoryMatch[1];
                // Next line should be the price
                if (i + 1 < lines.length && i + 2 < lines.length) {
                    const rawPrice = lines[i + 1];
                    const description = lines[i + 2];

                    // Parse the price using our utility
                    const price = parsePrice(rawPrice);

                    const menuItem: MenuItem = {
                        name: `${category}: ${description}`,
                        price: price,
                        day: currentDay
                    };

                    menuItems.push(menuItem);

                    // Skip the processed lines
                    i += 2;
                }
            }
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Edison menu:', error);
        return [];
    }
};