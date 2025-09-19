import axios from 'axios';
import * as cheerio from 'cheerio';
import { MenuItem } from '../types/menu';

export async function scrapeFoodHallMenu(): Promise<MenuItem[]> {
    try {
        const response = await axios.get('https://www.nordrest.se/restaurang/food-hall/');
        const $ = cheerio.load(response.data);

        const menuItems: MenuItem[] = [];

        // Find both restaurant sections and extract dishes
        const restaurantSections = [
            { name: 'Bao Bao', selector: 'h2:contains("Bao Bao")' },
            { name: 'Wurst Case Scenario', selector: 'h2:contains("Wurst Case Scenario")' }
        ];

        for (const restaurant of restaurantSections) {
            const restaurantHeading = $(restaurant.selector);

            if (restaurantHeading.length > 0) {
                // Find the closest container that has both the restaurant and its menu
                let container = restaurantHeading.closest('.elementor-element');

                // Look for a wider container that might contain both restaurant info and menu
                while (container.length > 0) {
                    const lunchMenuHeading = container.find('h3:contains("Lunch menu")');
                    const menuItemElements = container.find('.axis-menu__item');

                    if (lunchMenuHeading.length > 0 && menuItemElements.length > 0) {
                        // Found a container with both lunch menu and menu items

                        // Extract dishes from menu items
                        menuItemElements.each((index: number, element: cheerio.Element) => {
                            const nameEl = $(element).find('.axis-menu__name');
                            const priceEl = $(element).find('.axis-menu__price');
                            const descEl = $(element).find('.axis-menu__desc');

                            if (nameEl.length > 0) {
                                const dishName = nameEl.text().trim();
                                const description = descEl.length > 0 ? descEl.text().trim() : '';
                                const priceText = priceEl.length > 0 ? priceEl.text().trim() : '';

                                // Extract price from text like "105 SEK"
                                let price = 105; // Default price
                                const priceMatch = priceText.match(/(\d+)\s*SEK/i);
                                if (priceMatch) {
                                    price = parseInt(priceMatch[1]);
                                }

                                // Combine name and description
                                const fullDishName = description ? `${dishName} – ${description}` : dishName;

                                menuItems.push({
                                    name: `${restaurant.name}: ${fullDishName}`,
                                    price: price,
                                    day: 'Hela veckan'
                                });
                            }
                        });

                        break; // Found the right container, stop searching
                    }

                    // Move to parent container
                    container = container.parent().closest('.elementor-element');
                }
            }
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Food Hall menu:', error);
        return [];
    }
}
