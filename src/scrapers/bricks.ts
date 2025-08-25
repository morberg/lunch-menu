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
            
            // Check if line is a category (Green, Local, Worldwide, Pizza) followed by price and description
            if ((line === 'Green' || line === 'Local' || line === 'Worldwide' || line === 'Pizza') && currentDay) {
                // Next line should be the price
                if (i + 1 < lines.length && i + 2 < lines.length) {
                    const category = line;
                    // Normalize price: extract only the number
                    const rawPrice = lines[i + 1];
                    const priceMatch = rawPrice.match(/(\d+)/);
                    const price = priceMatch ? `${priceMatch[1]} kr` : rawPrice;
                    const description = lines[i + 2];

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