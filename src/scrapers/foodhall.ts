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
                    const strongElements = container.find('strong');

                    if (lunchMenuHeading.length > 0 && strongElements.length > 0) {
                        // Found a container with both lunch menu and strong elements (dishes)

                        // Extract price (default to 105)
                        let price = 105;
                        const priceText = container.find('p:contains("PRICE:")').text();
                        const priceMatch = priceText.match(/PRICE:\s*(\d+)KR/i);
                        if (priceMatch) {
                            price = parseInt(priceMatch[1]);
                        }

                        // Extract dishes from strong elements
                        strongElements.each((index: number, element: cheerio.Element) => {
                            const dishName = $(element).text().trim();

                            // Filter out non-dish content (time, phone numbers, etc.)
                            if (dishName.length > 5 &&
                                !dishName.match(/^\d+[\.\:\-]/) && // Not time format
                                !dishName.match(/^\d{10,}/) && // Not phone number
                                !dishName.toLowerCase().includes('order here')) {

                                // Get description from the parent paragraph
                                const parentP = $(element).closest('p');
                                const fullText = parentP.text().trim();

                                // Extract description after the dish name
                                const dishNameRegex = new RegExp(`${dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[–-]\\s*(.+?)(?=\\s*[A-Z][a-z]+\\s*[–-]|$)`);
                                const descriptionMatch = fullText.match(dishNameRegex);
                                const description = descriptionMatch ? descriptionMatch[1].trim() : '';

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
