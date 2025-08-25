import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export const scrapeEdisonMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://restaurangedison.se/lunch/';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const menuItems: MenuItem[] = [];

        // Map Swedish day names to English
        const dayMap: { [key: string]: string } = {
            'Måndag': 'Monday',
            'Tisdag': 'Tuesday', 
            'Onsdag': 'Wednesday',
            'Torsdag': 'Thursday',
            'Fredag': 'Friday'
        };

        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let currentDay = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check if line is a day name
            if (dayMap[line]) {
                currentDay = dayMap[line];
                continue;
            }
            
            // Check if line is a category (Green, Local, World Wide) followed by price and description
            if ((line === 'Green' || line === 'Local' || line === 'World Wide') && currentDay) {
                // Next line should be the price
                if (i + 1 < lines.length && lines[i + 1] === '115:-') {
                    // Line after that should be the description
                    if (i + 2 < lines.length) {
                        const category = line;
                        const price = lines[i + 1];
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
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Edison menu:', error);
        return [];
    }
};