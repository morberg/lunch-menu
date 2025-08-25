import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugKantinStructure() {
    try {
        const url = 'https://www.kantinlund.se/';
        console.log('Fetching:', url);
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        
        console.log('=== DEBUGGING KANTIN WEBSITE STRUCTURE ===');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        
        // Get page title
        console.log('Page title:', $('title').text());
        
        // Get the main content
        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        console.log('\n=== FIRST 50 LINES OF CONTENT ===');
        lines.slice(0, 50).forEach((line, i) => {
            console.log(`${i + 1}: ${line}`);
        });
        
        // Look for common menu-related terms
        console.log('\n=== SEARCHING FOR MENU-RELATED CONTENT ===');
        const menuKeywords = ['lunch', 'menu', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'kr', ':-'];
        
        menuKeywords.forEach(keyword => {
            const matches = lines.filter(line => line.toLowerCase().includes(keyword.toLowerCase()));
            if (matches.length > 0) {
                console.log(`\nFound "${keyword}" in ${matches.length} lines:`);
                matches.slice(0, 5).forEach(match => console.log(`  - ${match}`));
            }
        });
        
        // Check for specific elements
        console.log('\n=== HTML STRUCTURE ANALYSIS ===');
        console.log('Number of divs:', $('div').length);
        console.log('Number of paragraphs:', $('p').length);
        console.log('Number of spans:', $('span').length);
        console.log('Number of lists:', $('ul, ol').length);
        console.log('Number of tables:', $('table').length);
        
        // Look for any elements with menu-related classes
        const menuClasses = $('[class*="menu"], [class*="lunch"], [class*="day"]');
        console.log(`\nFound ${menuClasses.length} elements with menu-related classes:`);
        menuClasses.each((i, el) => {
            if (i < 10) { // Limit output
                console.log(`  - ${$(el).prop('tagName')}: class="${$(el).attr('class')}", text="${$(el).text().trim().substring(0, 100)}"`);
            }
        });
        
    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

debugKantinStructure();
