import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

export const scrapeKantinMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://www.kantinlund.se/';
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
                // Next line should be the menu description
                if (i + 1 < lines.length) {
                    const description = lines[i + 1];

                    // Skip lines that are not menu descriptions (section headers, etc.)
                    if (!description.includes('buffé') &&
                        !description.includes('Kantins') &&
                        !description.includes('Vi skickar') &&
                        description.length > 10) {

                        // Parse price from description or use fallback
                        const price = parsePrice(description);
                        
                        const menuItem: MenuItem = {
                            name: description,
                            price: price,
                            day: currentDay
                        };

                        menuItems.push(menuItem);
                        i++; // Skip the processed description line
                    }
                }
            }

            // Check for special weekly items
            if (line === 'Veckans vegetariska' && i + 1 < lines.length) {
                const description = lines[i + 1];
                const price = parsePrice('Se restaurang');
                
                const menuItem: MenuItem = {
                    name: `Veckans vegetariska: ${description}`,
                    price: price,
                    day: 'Weekly Special'
                };
                menuItems.push(menuItem);
                i++; // Skip the processed line
            }

            if (line === 'Månadens alternativ' && i + 1 < lines.length) {
                const description = lines[i + 1];
                const price = parsePrice('Se restaurang');
                
                const menuItem: MenuItem = {
                    name: `Månadens alternativ: ${description}`,
                    price: price,
                    day: 'Monthly Special'
                };
                menuItems.push(menuItem);
                i++; // Skip the processed line
            }
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Kantin menu:', error);
        return [];
    }
};