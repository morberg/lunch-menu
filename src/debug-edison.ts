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
        
        // Let's examine lines around the price patterns
        console.log('\n=== CONTEXT AROUND PRICE PATTERNS ===');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/115:-/)) {
                console.log('--- Context around line', i, '---');
                for (let j = Math.max(0, i-3); j <= Math.min(lines.length-1, i+3); j++) {
                    const marker = j === i ? '>>> ' : '    ';
                    console.log(marker + j + ': ' + lines[j]);
                }
                console.log('');
                
                // Only show first few instances to avoid spam
                if (i > 20) break;
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

debugEdisonStructure();
