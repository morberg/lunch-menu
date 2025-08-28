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

function parsePdfMenu(pdfText: string): MenuItem[] {
    const menuItems: MenuItem[] = [];

    // Clean up the text and split into lines
    const lines = pdfText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Swedish day names to look for
    const dayNames = ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag'];
    const dayMap: { [key: string]: string } = {
        'måndag': 'Måndag',
        'tisdag': 'Tisdag',
        'onsdag': 'Onsdag',
        'torsdag': 'Torsdag',
        'fredag': 'Fredag'
    };

    // Join all lines into one text block for better parsing
    const fullText = lines.join(' ');

    // Split by day names to get sections
    const dayPattern = new RegExp(`(${dayNames.join('|')})`, 'gi');
    const sections = fullText.split(dayPattern);

    for (let i = 1; i < sections.length; i += 2) {
        const dayName = sections[i].toLowerCase().trim();
        const content = sections[i + 1] ? sections[i + 1].trim() : '';

        if (dayNames.includes(dayName) && content.length > 20) {
            // Clean up the content
            let cleanContent = content
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/,\s*,/g, ',') // Remove double commas
                .replace(/^\s*,\s*/, '') // Remove leading comma
                .replace(/\s*,\s*$/, '') // Remove trailing comma
                .trim();

            // Remove common non-dish text patterns
            cleanContent = cleanContent
                .replace(/•[^•]*bubbelvatten och kaffe\/te.*$/i, '') // Remove bullet points about included items
                .replace(/•[^•]*något sött.*$/i, '') // Remove sweet treat mentions
                .replace(/•[^•]*pannkakor.*$/i, '') // Remove pancake mentions
                .replace(/•[^•]*Ta mer om du inte är mätt.*$/i, '') // Remove service text
                .replace(/•[^•]*rabatt med Eatery-kortet.*$/i, '') // Remove discount text
                .replace(/Sweet Tuesday:.*$/i, '') // Remove sweet tuesday text
                .replace(/Pancake Thursday:.*$/i, '') // Remove pancake thursday text
                .replace(/Vi bjuder.*$/i, '') // Remove "Vi bjuder" text
                .replace(/\s+ar\s+.*$/i, '') // Remove artifact "ar" text
                .replace(/^\s*ar\s+/i, '') // Remove leading "ar"
                .trim();

            // Skip content that's too short or looks like artifacts
            if (cleanContent.length > 30 && !cleanContent.match(/^ar\s|^\s*•\s*Ta mer|^\s*•\s*Byta rätt/i)) {
                // Split into individual dishes - look for patterns that indicate dish boundaries
                const dishes = splitIntoDishes(cleanContent);

                dishes.forEach(dish => {
                    if (dish.length > 15) { // Only add dishes with reasonable length
                        menuItems.push({
                            name: dish,
                            day: dayMap[dayName],
                            price: 135 // From the main page: 135kr ordinarie price
                        });
                    }
                });
            }
        }
    }

    return menuItems;
}

function splitIntoDishes(content: string): string[] {
    // Strategy: Look for capital letters that start new dish names
    // Dishes typically start with a capital letter after a space or comma

    // First, try to find natural breaks based on patterns
    let dishes: string[] = [];

    // Look for patterns like "Word Word Word [Capital Letter]" to identify dish boundaries
    // This regex finds positions where a new dish likely starts
    const dishBoundaries: number[] = [0]; // Start with beginning

    // Find potential dish boundaries by looking for:
    // 1. Capital letter after lowercase text and space/comma
    // 2. Common dish starting words
    const commonStarters = ['Gnocchi', 'Pankopanerad', 'Paprika', 'Rostade', 'Sej', 'Pannbiff', 'Halloumi', 'Västerbotten', 'Biff', 'Pad', 'Bakad', 'Biffstroganoff', 'Pinsa', 'Asiatisk', 'Timjan'];

    commonStarters.forEach(starter => {
        const regex = new RegExp(`\\b${starter}\\b`, 'g');
        let match;
        while ((match = regex.exec(content)) !== null) {
            if (match.index > 0 && !dishBoundaries.includes(match.index)) {
                dishBoundaries.push(match.index);
            }
        }
    });

    // Sort boundaries
    dishBoundaries.sort((a, b) => a - b);
    dishBoundaries.push(content.length); // Add end

    // Extract dishes based on boundaries
    for (let i = 0; i < dishBoundaries.length - 1; i++) {
        const dishText = content.substring(dishBoundaries[i], dishBoundaries[i + 1]).trim();
        if (dishText.length > 15) {
            dishes.push(dishText);
        }
    }

    // If we didn't find good boundaries, try a simpler approach
    if (dishes.length <= 1) {
        // Fallback: split on capital letters that follow typical dish ending patterns
        const parts = content.split(/(?<=[a-z])\s+(?=[A-Z][a-z])/);
        dishes = parts.filter(part => part.length > 15);
    }

    // Clean up each dish
    return dishes.map(dish => dish.trim());
}
