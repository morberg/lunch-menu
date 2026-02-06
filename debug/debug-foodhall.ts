import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeFoodHallMenu } from '../src/scrapers/foodhall';

async function debugFoodHall() {
    console.log('Debugging Food Hall scraper...');

    try {
        console.log('\n=== Testing actual scraper ===');
        const result = await scrapeFoodHallMenu();
        console.log(`Found ${result.length} items:`);
        result.forEach((item, index) => {
            console.log(`${index + 1}. [${item.day}] ${item.name} - ${item.price} SEK`);
        });

        if (result.length === 0) {
            console.log('\n=== Debugging HTML structure ===');
            const response = await axios.get('https://www.nordrest.se/restaurang/food-hall/');
            const $ = cheerio.load(response.data);

            console.log('Finding restaurant headings...');

            const baoBaoHeading = $('h2:contains("Bao Bao")');
            console.log('Bao Bao heading found:', baoBaoHeading.length > 0);
            if (baoBaoHeading.length > 0) {
                console.log('Bao Bao heading text:', baoBaoHeading.text());
            }

            const wurstCaseHeading = $('h2:contains("Wurst Case Scenario")');
            console.log('Wurst Case heading found:', wurstCaseHeading.length > 0);
            if (wurstCaseHeading.length > 0) {
                console.log('Wurst Case heading text:', wurstCaseHeading.text());
            }

            const lunchMenus = $('h3:contains("Lunch menu"), h2:contains("Lunch menu")');
            console.log(`Found ${lunchMenus.length} lunch menu headings`);

            lunchMenus.each((index, element) => {
                const container = $(element).closest('.elementor-element');
                console.log(`Lunch menu ${index + 1} container has ${container.find('strong').length} strong elements`);

                const strongElements = container.find('strong');
                strongElements.each((idx, strongEl) => {
                    const text = $(strongEl).text().trim();
                    if (text.length > 5) {
                        console.log(`  Strong ${idx + 1}: "${text}"`);
                    }
                });
            });

            const priceElements = $('p:contains("PRICE:")');
            console.log(`Found ${priceElements.length} price elements`);

            priceElements.each((index, element) => {
                console.log(`Price ${index + 1}: "${$(element).text().trim()}"`);
            });

            const title = $('title').text();
            console.log(`Page title: "${title}"`);

            console.log('\n=== All h2 headings on page ===');
            $('h2').each((index, element) => {
                console.log(`H2 ${index + 1}: "${$(element).text().trim()}"`);
            });

            console.log('\n=== All h3 headings on page ===');
            $('h3').each((index, element) => {
                console.log(`H3 ${index + 1}: "${$(element).text().trim()}"`);
            });
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

debugFoodHall().catch((error) => {
    console.error('Error:', error);
});