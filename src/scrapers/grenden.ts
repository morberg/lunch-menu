import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export const scrapeGrendenMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://lund.pieplowsmat.se/grenden/';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const menuItems: MenuItem[] = [];

        // Swedish day names to look for
        const swedishDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
        const dayMapping: { [key: string]: string } = {
            'MONDAY': 'Måndag',
            'TUESDAY': 'Tisdag',
            'WEDNESDAY': 'Onsdag',
            'THURSDAY': 'Torsdag',
            'FRIDAY': 'Fredag'
        };

        // Get the page content
        const pageText = $('body').text();

        // Split into lines and clean
        const lines = pageText.split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);

        let currentDay = '';
        let fieldsAndForests = '';
        let justLikeGrandmas = '';
        let price = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check if this line is a day
            if (swedishDays.includes(line)) {
                // Save previous day's items if we have them
                if (currentDay && (fieldsAndForests || justLikeGrandmas)) {
                    if (fieldsAndForests) {
                        menuItems.push({
                            name: `Fields & Forests: ${fieldsAndForests}`,
                            day: dayMapping[currentDay] || currentDay,
                            price: price
                        });
                    }
                    if (justLikeGrandmas) {
                        menuItems.push({
                            name: `Just Like Grandma's: ${justLikeGrandmas}`,
                            day: dayMapping[currentDay] || currentDay,
                            price: price
                        });
                    }
                }

                // Reset for new day
                currentDay = line;
                fieldsAndForests = '';
                justLikeGrandmas = '';
                price = '';
                continue;
            }

            // Look for menu categories
            if (line.startsWith('FIELDS & FORESTS')) {
                fieldsAndForests = line.replace('FIELDS & FORESTS –', '').replace('FIELDS & FORESTS', '').trim();
                // Continue reading the description if it spans multiple lines
                let j = i + 1;
                while (j < lines.length &&
                    !lines[j].startsWith('JUST LIKE GRANDMA') &&
                    !lines[j].includes('kr') &&
                    !swedishDays.includes(lines[j]) &&
                    !lines[j].startsWith('COMFORT') &&
                    lines[j].length > 0) {
                    fieldsAndForests += ' ' + lines[j].trim();
                    j++;
                }
                i = j - 1; // Update main loop counter
            }

            if (line.startsWith('JUST LIKE GRANDMA')) {
                justLikeGrandmas = line.replace('JUST LIKE GRANDMA´S –', '').replace('JUST LIKE GRANDMA´S', '').trim();
                // Continue reading the description if it spans multiple lines
                let j = i + 1;
                while (j < lines.length &&
                    !lines[j].includes('kr') &&
                    !swedishDays.includes(lines[j]) &&
                    !lines[j].startsWith('FIELDS & FORESTS') &&
                    !lines[j].startsWith('COMFORT') &&
                    lines[j].length > 0) {
                    justLikeGrandmas += ' ' + lines[j].trim();
                    j++;
                }
                i = j - 1; // Update main loop counter
            }

            // Look for price (but ignore prices from COMFORT section)
            if (line.includes('kr') && /\d+\s*kr/.test(line)) {
                // Skip if this line contains COMFORT
                if (line.includes('COMFORT')) {
                    continue;
                }

                // Check if we're in the COMFORT section by looking at previous lines
                let isInComfortSection = false;
                for (let k = Math.max(0, i - 10); k < i; k++) {
                    if (lines[k] && lines[k].includes('COMFORT')) {
                        // Check if there's a new day between COMFORT and current line
                        let dayFoundAfterComfort = false;
                        for (let m = k + 1; m < i; m++) {
                            if (swedishDays.includes(lines[m])) {
                                dayFoundAfterComfort = true;
                                break;
                            }
                        }
                        if (!dayFoundAfterComfort) {
                            isInComfortSection = true;
                            break;
                        }
                    }
                }

                if (!isInComfortSection) {
                    const priceMatch = line.match(/(\d+)\s*kr/);
                    if (priceMatch) {
                        price = priceMatch[1] + ' kr';
                    }
                }
            }
        }

        // Don't forget to add the last day's items
        if (currentDay && (fieldsAndForests || justLikeGrandmas)) {
            if (fieldsAndForests) {
                menuItems.push({
                    name: `Fields & Forests: ${fieldsAndForests}`,
                    day: dayMapping[currentDay] || currentDay,
                    price: price
                });
            }
            if (justLikeGrandmas) {
                menuItems.push({
                    name: `Just Like Grandma's: ${justLikeGrandmas}`,
                    day: dayMapping[currentDay] || currentDay,
                    price: price
                });
            }
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Grenden menu:', error);
        return [];
    }
};
