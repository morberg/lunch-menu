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
    const items: Array<MenuItem & { dishText?: string }> = [];
    const dishCount: { [key: string]: number } = {};

    // Extract special pricing information from the page - target specifically the "grill & fusion special" price
    const specialPriceText = $('*:contains("grill & fusion special")').text();
    const specialPriceMatch = specialPriceText.match(/grill\s*&\s*fusion\s*special\s*(\d+)\s*SEK/i);
    const specialPrice = specialPriceMatch ? parseInt(specialPriceMatch[1]) : 125;

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

                // Count occurrences of each dish to identify weekly specials
                dishCount[cleanDish] = (dishCount[cleanDish] || 0) + 1;

                // Split by | to separate name and ingredients
                const parts = cleanDish.split('|').map((part: string) => part.trim());

                if (parts.length >= 2) {
                    const name = parts[0];
                    const description = parts.slice(1).join(' | ');

                    items.push({
                        name: `${name} – ${description}`,
                        price: basePrice,
                        day: dayName,
                        dishText: cleanDish
                    });
                } else if (cleanDish.length > 10) {
                    // Handle dishes without | separator
                    items.push({
                        name: cleanDish,
                        price: basePrice,
                        day: dayName,
                        dishText: cleanDish
                    });
                }
            }
        });
    });

    // Identify dishes that appear on multiple days (weekly specials)
    const weeklySpecials = new Set<string>();
    const totalDays = weekdayItems.length;

    for (const [dishText, count] of Object.entries(dishCount)) {
        if (count >= Math.max(3, Math.floor(totalDays * 0.6))) { // Appears on 60% or more of days
            weeklySpecials.add(dishText);
        }
    }

    // Process items: remove duplicates and handle weekly specials
    const processedItems: MenuItem[] = [];
    const seenDishes = new Set<string>();

    for (const item of items) {
        const dishText = item.dishText!;

        if (weeklySpecials.has(dishText)) {
            // This is a weekly special - only add once with special pricing
            if (!seenDishes.has(dishText)) {
                processedItems.push({
                    name: item.name,
                    price: specialPrice,
                    day: "Hela veckan"
                });
                seenDishes.add(dishText);
            }
        } else {
            // Regular daily dish
            if (!seenDishes.has(dishText)) {
                processedItems.push({
                    name: item.name,
                    price: item.price,
                    day: item.day
                });
                seenDishes.add(dishText);
            }
        }
    }

    return processedItems;
}