import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export const scrapeKantinMenu = async (): Promise<MenuItem[]> => {
    try {
        const url = 'https://www.kantinlund.se/';
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
                // Next line should be the menu description
                if (i + 1 < lines.length) {
                    const description = lines[i + 1];
                    
                    // Skip lines that are not menu descriptions (section headers, etc.)
                    if (!description.includes('buffé') && 
                        !description.includes('Kantins') && 
                        !description.includes('Vi skickar') &&
                        description.length > 10) {
                        
                        const menuItem = {
                            name: description,
                            price: 'Se restaurang för pris', // Kantin doesn't always show prices on website
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
                const menuItem = {
                    name: `Veckans vegetariska: ${description}`,
                    price: 'Se restaurang för pris',
                    day: 'Weekly Special'
                };
                menuItems.push(menuItem);
                i++; // Skip the processed line
            }
            
            if (line === 'Månadens alternativ' && i + 1 < lines.length) {
                const description = lines[i + 1];
                const menuItem = {
                    name: `Månadens alternativ: ${description}`,
                    price: 'Se restaurang för pris',
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