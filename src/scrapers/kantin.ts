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

        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Handle both live website format and fixtures format
        const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for lines that start with Swedish day names followed by " –" (live website format)
            const dayRegex = /^(Måndag|Tisdag|Onsdag|Torsdag|Fredag)\s*–\s*(.+)$/;
            const dayMatch = line.match(dayRegex);

            if (dayMatch) {
                const day = dayMatch[1];
                const description = dayMatch[2];

                // Skip lines that are clearly not menu items
                if (description &&
                    !description.includes('11.00') &&  // Opening hours
                    !description.includes('16.00') &&  // Opening hours
                    description.length > 10) {

                    // Parse price from description, keep null if not found
                    const price = parsePrice(description);

                    const menuItem: MenuItem = {
                        name: description,
                        price: price,
                        day: day
                    };

                    menuItems.push(menuItem);
                }
            }
            // Check for separate day names (fixtures format)
            else if (swedishDays.includes(line)) {
                const day = line;
                // Next line should be the menu description
                if (i + 1 < lines.length) {
                    const description = lines[i + 1];

                    // Skip lines that are not menu descriptions
                    if (description &&
                        !description.includes('11.00') &&  // Opening hours
                        !description.includes('16.00') &&  // Opening hours
                        !description.includes('buffé') &&
                        !description.includes('Vi skickar') &&
                        description.length > 10) {

                        const price = parsePrice(description);

                        const menuItem: MenuItem = {
                            name: description,
                            price: price,
                            day: day
                        };

                        menuItems.push(menuItem);
                        i++; // Skip the processed description line
                    }
                }
            }

            // Check for special weekly items with " – " format (live website)
            const weeklyRegex = /^(Veckans vegetariska|Månadens.*?)\s*–\s*(.+)$/;
            const weeklyMatch = line.match(weeklyRegex);

            if (weeklyMatch) {
                const itemType = weeklyMatch[1];
                const description = weeklyMatch[2];
                const price = parsePrice(description);

                const menuItem: MenuItem = {
                    name: `${itemType}: ${description}`,
                    price: price,
                    day: 'Hela veckan'
                };
                menuItems.push(menuItem);
            }
            // Check for separate weekly items (fixtures format)
            else if ((line === 'Veckans vegetariska' || line.startsWith('Månadens')) && i + 1 < lines.length) {
                const itemType = line;
                const description = lines[i + 1];
                const price = parsePrice(description);

                const menuItem: MenuItem = {
                    name: `${itemType}: ${description}`,
                    price: price,
                    day: 'Hela veckan'
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