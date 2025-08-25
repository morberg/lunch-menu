import axios from 'axios';
import * as cheerio from 'cheerio';

async function debugSmakapakinaStructure() {
    try {
        const url = 'https://apps.wixrestaurants.com/?type=wixmenus.client&pageId=z7f1i&compId=TPASection_iiu79eq9&viewerCompId=TPASection_iiu79eq9&siteRevision=4&viewMode=site&deviceType=desktop&locale=sv&tz=Europe%2FStockholm&regionalLanguage=sv&width=980&height=3967&instance=_XKqBaPrt2LxIMw9cBo4FyvgRmNmyNq4M9ILMNIFo2k.eyJpbnN0YW5jZUlkIjoiNGM3MTJlN2ItNDA3OS00NTkwLTgxYzgtMTBiYjRlMjRmNmY4IiwiYXBwRGVmSWQiOiIxM2MxNDAyYy0yN2YyLWQ0YWItNzQ2My1lZTdjODllMDc1NzgiLCJtZXRhU2l0ZUlkIjoiYzQzNzczYzEtOTYyZi00YTQ2LWIzY2MtMTEyNTgxYTA5ZWI1Iiwic2lnbkRhdGUiOiIyMDI1LTA4LTI1VDExOjI3OjQxLjQ5MVoiLCJ2ZW5kb3JQcm9kdWN0SWQiOiJyZXN0X3BybyIsImRlbW9Nb2RlIjpmYWxzZSwib3JpZ2luSW5zdGFuY2VJZCI6IjZlNmI5NmUzLWU1NWQtNGYwZi05MGU0LWMyNTEwZDE0ODQ5MSIsImFpZCI6IjJlODBkY2Q1LTE2ZjYtNDViOC1hYjk0LTdmNjJkYjNlYjc1NCIsImJpVG9rZW4iOiI4ODQ2NWRiYS1kNjU2LTBmZDYtMzIwNC0wMTllY2Y4NDY4NGQiLCJzaXRlT3duZXJJZCI6IjU5MDUwZTQ2LWFkODctNDRjMC04Yzc0LWIyY2ZkZjRiYTZlMSIsImJzIjoiUzhDTGI1cW1KTnpRNXl3cmg4bUZqU0FfdkNsRG9QMllDUkRzZVVNWk5vTSIsInNjZCI6IjIwMTctMDktMTNUMDk6MjI6MzUuNTc4WiJ9&currency=SEK&currentCurrency=SEK&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22host%22%3A%22VIEWER%22%2C%22bsi%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%2C%22siteRevision%22%3A%224%22%2C%22branchId%22%3A%220af5bd90-87c6-4b4b-9c86-e8e25a0c6304%22%2C%22renderingFlow%22%3A%22NONE%22%2C%22language%22%3A%22sv%22%2C%22locale%22%3A%22sv-se%22%2C%22BSI%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%7D&currentRoute=.%2Fmeny&target=_top&section-url=https%3A%2F%2Fwww.smakapakina.se%2Fmeny%2F&vsi=cc5587fd-9100-46f2-b43c-027a54a3efca';
        console.log('Fetching:', url);

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        console.log('=== DEBUGGING SMAKAPAKINA STRUCTURE ===');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);

        // Get page title
        console.log('Page title:', $('title').text());

        // Get the main content
        const bodyText = $('body').text();
        console.log('Body text length:', bodyText.length);

        // Look for Swedish days
        const swedishDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

        console.log('\n=== SEARCHING FOR DAYS ===');
        swedishDays.forEach(day => {
            const found = bodyText.includes(day);
            console.log(`${day}: ${found ? 'FOUND' : 'NOT FOUND'}`);

            if (found) {
                // Find the context around the day
                const index = bodyText.indexOf(day);
                const context = bodyText.substring(Math.max(0, index - 50), Math.min(bodyText.length, index + 200));
                console.log(`  Context: "${context}"`);
            }
        });

        // Split into lines and show relevant ones
        const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        console.log(`\n=== TEXT LINES (${lines.length} total) ===`);

        // Show lines containing Swedish days
        lines.forEach((line, index) => {
            if (swedishDays.some(day => line.includes(day))) {
                console.log(`Line ${index}: "${line}"`);
            }
        });

        // Show first 20 lines
        console.log('\n=== FIRST 20 LINES ===');
        lines.slice(0, 20).forEach((line, index) => {
            console.log(`${index}: "${line}"`);
        });

        // Show any lines with "kr" in them
        console.log('\n=== LINES WITH "kr" ===');
        lines.filter(line => line.includes('kr')).slice(0, 10).forEach((line, index) => {
            console.log(`${index}: "${line}"`);
        });

    } catch (error) {
        console.error('Error in debug:', error);
    }
}

debugSmakapakinaStructure();
