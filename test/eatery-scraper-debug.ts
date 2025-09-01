import { scrapeEatery, parsePdfMenu, splitIntoDishes } from '../src/scrapers/eatery';
import axios from 'axios';
import * as cheerio from 'cheerio';
import pdfParse from 'pdf-parse';
import * as fs from 'fs';
import * as path from 'path';

async function runEateryScraperDebug() {
    console.log('--- Eatery Scraper Debug ---');

    // First, let's examine the raw PDF text to see line breaks
    try {
        console.log('Fetching Eatery main page to get PDF URL...');
        const response = await axios.get('https://www.eatery.se/lund/', { timeout: 10000 });
        const $ = cheerio.load(response.data);

        let lunchMenuUrl = '';
        $('a').each((_, element) => {
            const linkText = $(element).text().trim();
            const href = $(element).attr('href');
            if (linkText.toLowerCase().includes('lunchmeny') && href && href.includes('.pdf')) {
                lunchMenuUrl = href;
                return false;
            }
        });

        if (lunchMenuUrl) {
            console.log(`Downloading PDF: ${lunchMenuUrl}`);
            const pdfResponse = await axios.get(lunchMenuUrl, { responseType: 'arraybuffer', timeout: 10000 });
            const pdfData = await pdfParse(Buffer.from(pdfResponse.data));

            console.log('\n=== RAW PDF TEXT ===');
            console.log(JSON.stringify(pdfData.text)); // Show with escaped newlines
            console.log('\n=== PDF TEXT WITH VISIBLE NEWLINES ===');
            console.log(pdfData.text.replace(/\n/g, '\\n\n')); // Make newlines visible
        }
    } catch (err) {
        console.error('Error examining PDF:', err);
    }

    // Also run the normal scraper
    try {
        const menuItems = await scrapeEatery();
        console.log('\nscrapeEatery() result:');
        menuItems.forEach(item => console.log(item));
    } catch (err) {
        console.error('scrapeEatery() error:', err);
    }

}

runEateryScraperDebug();
