import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { scrapeSmakapakina } from '../src/scrapers/smakapakina';

async function debugSmakapakina() {
    console.log('=== DEBUGGING SMAKA PÅ KINA SCRAPER ===');

    try {
        console.log('\n=== Live scrape attempt ===');
        const liveItems = await scrapeSmakapakina();
        console.log(`Live scrape returned ${liveItems.length} items`);
        liveItems.forEach((item, i) => {
            const priceStr = item.price != null ? `${item.price} SEK` : 'no price';
            console.log(`${i + 1}. ${item.day}: ${item.name} - ${priceStr}`);
        });

        if (liveItems.length === 0) {
            console.log('\nNo items from live scrape. Inspecting HTML structure...');
            const wixUrl = 'https://www.smakapakina.se/meny/';
            console.log('Fetching page:', wixUrl);
            const response = await axios.get(wixUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const $ = cheerio.load(response.data);

            console.log('Page title:', $('title').text().trim());

            const iframes = $('iframe');
            console.log(`Found ${iframes.length} iframes`);
            iframes.each((i, el) => {
                const src = $(el).attr('src');
                if (src && src.includes('wixmenus')) {
                    console.log(`Iframe ${i + 1} wixmenus src:`, src.slice(0, 200) + (src.length > 200 ? '...' : ''));
                }
            });

            const hookMatches = (response.data.match(/data-hook="wixrest-menus-item-title"/g) || []).length;
            console.log('Raw HTML wixrest item title occurrences:', hookMatches);

            const lines = response.data.split('\n');
            let printed = 0;
            for (const line of lines) {
                if (line.includes('wixrest-menus-item-title') && printed < 5) {
                    console.log('LINE:', line.trim().slice(0, 220));
                    printed++;
                }
                if (printed >= 5) break;
            }

            console.log('\nLooking for any JSON data blobs that might contain menu entries...');
            const jsonLike = response.data.match(/<script[^>]*>.*?\{.*?\}.*?<\/script>/gs) || [];
            console.log(`Script tags with potential JSON: ${jsonLike.length}`);
            let jsonPrinted = 0;
            for (const block of jsonLike) {
                if (jsonPrinted >= 3) break;
                if (block.includes('menu') || block.includes('items')) {
                    console.log('\n--- Possible JSON Block ---');
                    console.log(block.slice(0, 500) + (block.length > 500 ? '...' : ''));
                    jsonPrinted++;
                }
            }
        }

        const fixturePath = path.resolve(process.cwd(), 'test/fixtures/smakapakina.html');
        if (fs.existsSync(fixturePath)) {
            console.log('\n=== Fixture scrape attempt ===');
            const fixtureItems = await scrapeSmakapakina(`file://${fixturePath}`);
            console.log(`Fixture scrape returned ${fixtureItems.length} items`);
            fixtureItems.forEach((item, i) => {
                const priceStr = item.price != null ? `${item.price} SEK` : 'no price';
                console.log(`${i + 1}. ${item.day}: ${item.name} - ${priceStr}`);
            });
        } else {
            console.log('\nNo fixture file found at', fixturePath);
        }
    } catch (err) {
        const error = err as Error;
        console.error('❌ Error during Smaka på Kina debug:', error.message);
        console.error(error.stack);
    }
}

debugSmakapakina().catch((error) => {
    console.error(error);
});