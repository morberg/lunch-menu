import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import { MenuItem } from '../types/menu';
import { parsePrice } from '../utils/price';

export const scrapeEatery = async (): Promise<MenuItem[]> => {
    try {
        console.log('Fetching Eatery main page...');

        // First, get the main page to find the current lunch menu PDF URL
        const mainPageResponse = await axios.get('https://eatery.se/anlaggningar/lund');
        const $ = cheerio.load(mainPageResponse.data);

        // Find the "Lunchmeny" link
        let lunchMenuUrl = '';
        $('a').each((_, element) => {
            const linkText = $(element).text().trim();
            const href = $(element).attr('href');

            if (linkText.toLowerCase().includes('lunchmeny') && href && href.includes('.pdf')) {
                lunchMenuUrl = href;
                return false; // Break the loop
            }
        });

        if (!lunchMenuUrl) {
            console.error('Could not find lunch menu PDF URL');
            return [];
        }

        console.log(`Found lunch menu URL: ${lunchMenuUrl}`);

        // Download the PDF
        const pdfResponse = await axios.get(lunchMenuUrl, {
            responseType: 'arraybuffer',
            timeout: 10000
        });

        // Parse the PDF to extract text
        const pdfData = await pdfParse(Buffer.from(pdfResponse.data));
        const pdfText = pdfData.text;

        console.log('PDF text extracted, parsing menu items...');

        // Parse the PDF text to extract menu items
        const menuItems = parsePdfMenu(pdfText);

        console.log(`Extracted ${menuItems.length} menu items from Eatery PDF`);
        return menuItems;

    } catch (error) {
        console.error('Error scraping Eatery:', error);
        return [];
    }
};

export function parsePdfMenu(pdfText: string): MenuItem[] {
    const menuItems: MenuItem[] = [];

    // Swedish day names to look for
    const dayNames = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag'];
    const dayMap: { [key: string]: string } = {
        'måndag': 'Måndag',
        'tisdag': 'Tisdag',
        'onsdag': 'Onsdag',
        'torsdag': 'Torsdag',
        'fredag': 'Fredag'
    };

    // Split by day names to get sections, but preserve line structure
    const dayPattern = new RegExp(`(${dayNames.join('|')})`, 'gi');
    const sections = pdfText.split(dayPattern);

    for (let i = 1; i < sections.length; i += 2) {
        const dayName = sections[i].toLowerCase().trim();
        const content = sections[i + 1] ? sections[i + 1].trim() : '';

        if (dayNames.includes(dayName) && content.length > 20) {
            // Split content into lines and process each line as a potential dish
            const lines = content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            let currentDish = '';

            for (const line of lines) {
                // Skip non-dish lines
                if (line.match(/^(Sweet Tuesday|Pancake Thursday|Vi bjuder|•|\d+%|Med reservation)/i)) {
                    continue;
                }

                // If line starts with capital letter and we have accumulated dish content,
                // it's likely a new dish starting
                if (line.match(/^[A-ZÅÄÖ]/) && currentDish.length > 30) {
                    // Save the completed dish
                    const cleanDish = currentDish
                        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                        .replace(/,\s*,/g, ',') // Remove double commas
                        .replace(/^\s*,\s*/, '') // Remove leading comma
                        .replace(/\s*,\s*$/, '') // Remove trailing comma
                        .trim();

                    menuItems.push({
                        name: cleanDish,
                        day: dayMap[dayName],
                        price: 135
                    });

                    // Start new dish
                    currentDish = line;
                } else {
                    // Continue building current dish (handle multi-line dishes)
                    if (currentDish) {
                        currentDish += ' ' + line;
                    } else {
                        currentDish = line;
                    }
                }
            }

            // Don't forget the last dish for this day
            if (currentDish.length > 30) {
                const cleanDish = currentDish
                    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                    .replace(/,\s*,/g, ',') // Remove double commas
                    .replace(/^\s*,\s*/, '') // Remove leading comma
                    .replace(/\s*,\s*$/, '') // Remove trailing comma
                    .trim();

                menuItems.push({
                    name: cleanDish,
                    day: dayMap[dayName],
                    price: 135
                });
            }
        }
    }

    return menuItems;
}

export function splitIntoDishes(content: string): string[] {
    // The PDF preserves line breaks between dishes - much simpler and more reliable!
    // Split by newlines and filter out empty lines and non-dish content
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const dishes: string[] = [];
    let currentDish = '';

    for (const line of lines) {
        // Skip lines that are clearly not dish content
        if (line.match(/^(Sweet Tuesday|Pancake Thursday|Vi bjuder|•|\d+%)/i)) {
            continue;
        }

        // If line starts with capital letter and we have accumulated dish content,
        // it's likely a new dish
        if (line.match(/^[A-ZÅÄÖ]/) && currentDish.length > 15) {
            dishes.push(currentDish.trim());
            currentDish = line;
        } else {
            // Continue building current dish (handle multi-line dishes)
            if (currentDish) {
                currentDish += ' ' + line;
            } else {
                currentDish = line;
            }
        }
    }

    // Don't forget the last dish
    if (currentDish.length > 15) {
        dishes.push(currentDish.trim());
    }

    return dishes.filter(dish => dish.length > 15);
}
