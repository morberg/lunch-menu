import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export const scrapeBricksMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://brickseatery.se/lunch/';
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

            // Check if this looks like a category
            if (currentDay && i + 1 < lines.length && i + 2 < lines.length) {
                const nextLine = lines[i + 1];
                const thirdLine = lines[i + 2];

                // Check if next line looks like a price (contains digits and 'kr')
                if (nextLine.match(/\d+.*kr/i) && thirdLine.length > 20) {
                    const category = line;
                    // Normalize price: extract only the number
                    const priceMatch = nextLine.match(/(\d+)/);
                    const price = priceMatch ? `${priceMatch[1]} kr` : nextLine;
                    const description = thirdLine;

                    const menuItem = {
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
        console.error('Error scraping Bricks menu:', error);
        return [];
    }
};