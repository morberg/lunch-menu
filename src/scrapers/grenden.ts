import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export async function scrapeGrendenMenu(): Promise<MenuItem[]> {
    try {
        const response = await axios.get('https://www.nordrest.se/restaurang/grenden/');
        const $ = cheerio.load(response.data);

        const items: MenuItem[] = [];

        // Extract base price - look for "PRICE: 105KR" pattern
        const priceText = $('*:contains("PRICE:")').text();
        const priceMatch = priceText.match(/PRICE:\s*(\d+)KR/i);
        const basePrice = priceMatch ? parseInt(priceMatch[1]) : 105;

        // Find the currently visible accordion wrapper (the one with display: block)
        const visibleAccordion = $('.accordion-wrapper').filter((index, element) => {
            const style = $(element).attr('style');
            return Boolean(style && style.includes('display: block'));
        });

        if (visibleAccordion.length === 0) {
            // Fallback to first accordion wrapper if none explicitly visible
            const firstAccordion = $('.accordion-wrapper').first();
            if (firstAccordion.length > 0) {
                return extractMenuItems(firstAccordion, $, basePrice);
            }
        } else {
            return extractMenuItems(visibleAccordion, $, basePrice);
        }

        return [
            {
                name: 'Dagens lunch – Dagligt växlande meny med svenska klassiker och moderna gröna rätter',
                price: 105,
                day: "Hela veckan"
            }
        ];

    } catch (error) {
        console.error('Error scraping Grenden menu:', error);
        return [
            {
                name: 'Dagens lunch – Meny inte tillgänglig för tillfället',
                price: 105,
                day: "Hela veckan"
            }
        ];
    }
}

function extractMenuItems(accordionWrapper: any, $: any, basePrice: number): MenuItem[] {
    const items: MenuItem[] = [];

    // Find all weekday accordion items within this wrapper
    const weekdayItems = accordionWrapper.find('.weekday-item');

    weekdayItems.each((index: number, element: any) => {
        const dayElement = $(element);
        const dayName = dayElement.find('.accordion-header').first().text().trim().split('\n')[0].trim();

        // Find all ratter items (menu dishes) for this day
        const ratterItems = dayElement.find('li.ratter');

        ratterItems.each((ratterIndex: number, ratterElement: any) => {
            const dishElement = $(ratterElement);
            const dishText = dishElement.clone().children().remove().end().text().trim();

            if (dishText && dishText.length > 5) {
                // Clean up the dish text and extract name/description
                const cleanDish = dishText.replace(/\s+/g, ' ').trim();

                // Split by | to separate name and ingredients
                const parts = cleanDish.split('|').map((part: string) => part.trim());

                if (parts.length >= 2) {
                    const name = parts[0];
                    const description = parts.slice(1).join(' | ');

                    items.push({
                        name: `${name} – ${description}`,
                        price: basePrice,
                        day: dayName
                    });
                } else if (cleanDish.length > 10) {
                    // Handle dishes without | separator
                    items.push({
                        name: cleanDish,
                        price: basePrice,
                        day: dayName
                    });
                }
            }
        });
    });

    // Remove duplicates (some dishes appear on multiple days)
    const uniqueItems = items.filter((item, index, self) =>
        index === self.findIndex(t => t.name === item.name)
    );

    return uniqueItems;
}