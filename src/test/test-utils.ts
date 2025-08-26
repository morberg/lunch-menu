// Test utilities for scraper testing with local fixtures
import * as fs from 'fs';
import * as path from 'path';
import { MenuItem } from '../types/menu';

// Simple HTML text extractor (no cheerio dependency)
function extractTextFromHTML(htmlContent: string): string {
    // Remove script and style tags completely
    let text = htmlContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Remove HTML tags but keep the text content
    text = text.replace(/<[^>]*>/g, ' ');

    // Decode common HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');

    return text;
}

// Function to parse Bricks menu from HTML content (simplified version)
export function parseBricksMenuFromHTML(htmlContent: string): MenuItem[] {
    const bodyText = extractTextFromHTML(htmlContent);
    const menuItems: MenuItem[] = [];

    // List of Swedish day names
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

    const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentDay = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if this line is a day name
        if (swedishDays.includes(line)) {
            currentDay = line;
            continue;
        }

        // If we have a current day and this line looks like a menu item
        if (currentDay && line.length > 10 && !swedishDays.includes(line)) {
            // Check if the next few lines might contain price information
            let potentialPrice = '';
            let categoryDetected = false;

            // Look ahead for price or category patterns
            for (let j = 1; j <= 3 && i + j < lines.length; j++) {
                const nextLine = lines[i + j];

                // Check for price pattern
                if (nextLine.match(/^\d+\s*(kr|kronor|\d+:\-)?\s*$/i)) {
                    potentialPrice = nextLine.includes('kr') ? nextLine : nextLine + ' kr';
                    break;
                }

                // Check for category patterns (short lines that might be categories)
                if (nextLine.length <= 20 &&
                    (nextLine.toLowerCase().includes('green') ||
                        nextLine.toLowerCase().includes('local') ||
                        nextLine.toLowerCase().includes('world') ||
                        nextLine.toLowerCase().includes('pizza') ||
                        nextLine.toLowerCase().includes('bonus'))) {
                    categoryDetected = true;
                }
            }

            // If we found a price or detected a category structure, this is likely a menu item
            if (potentialPrice || categoryDetected) {
                // Use a default price if none found
                const price = potentialPrice || '115 kr';

                menuItems.push({
                    name: line,
                    price: price,
                    day: currentDay
                });
            }
        }
    }

    return menuItems;
}

// Function to parse Edison menu from HTML content
export function parseEdisonMenuFromHTML(htmlContent: string): MenuItem[] {
    const bodyText = extractTextFromHTML(htmlContent);
    const menuItems: MenuItem[] = [];

    // List of Swedish day names
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

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
                // Look for any number in the price line
                const priceMatch = rawPrice.match(/(\d+)/);
                const price = priceMatch ? priceMatch[1] + ' kr' : rawPrice;
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
}

// Function to parse Kantin menu from HTML content
export function parseKantinMenuFromHTML(htmlContent: string): MenuItem[] {
    const bodyText = extractTextFromHTML(htmlContent);
    const menuItems: MenuItem[] = [];

    // List of Swedish day names
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

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

                    // Kantin doesn't always show prices, so fallback to 'Se restaurang'
                    let price = 'Se restaurang';
                    // Try to extract a price from the description if present
                    const priceMatch = description.match(/(\d+)[ ]?(kr|:-|kj)?/i);
                    if (priceMatch) {
                        price = `${priceMatch[1]} kr`;
                    }
                    const menuItem = {
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
            const menuItem = {
                name: `Veckans vegetariska: ${description}`,
                price: 'Se restaurang',
                day: 'Weekly Special'
            };
            menuItems.push(menuItem);
            i++; // Skip the processed description line
        }
    }

    return menuItems;
}

// Function to parse Grenden menu from HTML content
export function parseGrendenMenuFromHTML(htmlContent: string): MenuItem[] {
    const bodyText = extractTextFromHTML(htmlContent);
    const menuItems: MenuItem[] = [];

    // List of Swedish day names
    const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

    const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let currentDay = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Check if line is a Swedish day name
        if (swedishDays.includes(line)) {
            currentDay = line;
            continue;
        }

        // Look for menu items (simple approach - lines with reasonable length)
        if (currentDay && line.length > 15 && line.length < 200 && !swedishDays.includes(line)) {
            // Try to extract price from the line or use default
            let price = '135 kr'; // Default Grenden price
            const priceMatch = line.match(/(\d+)[ ]?(kr|:-)?/i);
            if (priceMatch) {
                price = `${priceMatch[1]} kr`;
            }

            // Remove price from dish name if it was found
            const dishName = line.replace(/\d+[ ]?(kr|:-)?/i, '').trim();

            if (dishName.length > 5) {
                menuItems.push({
                    name: dishName,
                    price: price,
                    day: currentDay
                });
            }
        }
    }

    return menuItems;
}

// Function to parse Smakapakina menu from HTML content
export function parseSmakapakinaMenuFromHTML(htmlContent: string): MenuItem[] {
    const menuItems: MenuItem[] = [];

    // Smakapakina uses a complex Wix structure, so we'll look for common patterns
    // Try to find menu items by looking for text patterns
    const lines = htmlContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Look for lines that might contain menu data
        if (line.includes('wixrest-menus-item-title') ||
            line.includes('menu-item') ||
            line.includes('"title"') ||
            line.includes('"price"')) {

            // Try to extract dish names and prices from JSON-like structures
            const titleMatch = line.match(/"title":\s*"([^"]+)"/);
            const priceMatch = line.match(/"price":\s*(\d+)/);

            if (titleMatch) {
                const dishName = titleMatch[1];
                const price = priceMatch ? `${priceMatch[1]} kr` : '155 kr'; // Default Smakapakina price

                // Assign to a weekly special since Smakapakina often has weekly menus
                menuItems.push({
                    name: dishName,
                    price: price,
                    day: 'Weekly Special'
                });
            }
        }
    }

    // If no JSON structure found, try simple text extraction
    if (menuItems.length === 0) {
        const bodyText = extractTextFromHTML(htmlContent);
        const textLines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        for (const line of textLines) {
            // Look for lines that might be menu items (reasonable length, contains food words)
            if (line.length > 10 && line.length < 100 &&
                (line.toLowerCase().includes('kött') ||
                    line.toLowerCase().includes('fisk') ||
                    line.toLowerCase().includes('vegetar') ||
                    line.toLowerCase().includes('pasta') ||
                    line.toLowerCase().includes('sallad'))) {

                menuItems.push({
                    name: line,
                    price: '155 kr',
                    day: 'Weekly Special'
                });
            }
        }
    }

    return menuItems;
}

// Function to load test fixture HTML
export function loadTestFixture(filename: string): string {
    const fixturePath = path.join(__dirname, 'fixtures', filename);
    return fs.readFileSync(fixturePath, 'utf-8');
}
