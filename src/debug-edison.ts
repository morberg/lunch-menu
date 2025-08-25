import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugEdisonStructure() {
    try {
        const url = 'https://restaurangedison.se/lunch/';
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        console.log('=== DEBUGGING EDISON WEBSITE STRUCTURE ===');

        const bodyText = $('body').text();
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Print all lines with line numbers
        console.log('\n=== FULL MENU TEXT ===');
        lines.forEach((line, i) => {
            // Highlight lines that are not expected (not a day, not a category, not a price, not a description)
            const dayNames = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];
            const categories = ['Green', 'Local', 'World Wide'];
            if (
                dayNames.includes(line) ||
                categories.includes(line) ||
                line.match(/115:-/) ||
                line.length > 0
            ) {
                // Print normally
                console.log(i + ': ' + line);
            } else {
                // Highlight unexpected lines
                console.log(i + ': [UNEXPECTED] ' + line);
            }
        });

        // Print context around Friday
        const fridayIdx = lines.findIndex(l => l === 'Fredag');
        if (fridayIdx !== -1) {
            console.log('\n=== CONTEXT AROUND FRIDAY ===');
            for (let j = Math.max(0, fridayIdx-5); j <= Math.min(lines.length-1, fridayIdx+10); j++) {
                console.log(j + ': ' + lines[j]);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

debugEdisonStructure();
