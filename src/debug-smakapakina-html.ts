async function debugSmakapakinaHTML() {
    console.log('=== Fetching URL and examining HTML structure ===');

    const url = 'https://apps.wixrestaurants.com/?type=wixmenus.client&pageId=z7f1i&compId=TPASection_iiu79eq9&viewerCompId=TPASection_iiu79eq9&siteRevision=4&viewMode=site&deviceType=desktop&locale=sv&tz=Europe%2FStockholm&regionalLanguage=sv&width=980&height=3967&instance=_XKqBaPrt2LxIMw9cBo4FyvgRmNmyNq4M9ILMNIFo2k.eyJpbnN0YW5jZUlkIjoiNGM3MTJlN2ItNDA3OS00NTkwLTgxYzgtMTBiYjRlMjRmNmY4IiwiYXBwRGVmSWQiOiIxM2MxNDAyYy0yN2YyLWQ0YWItNzQ2My1lZTdjODllMDc1NzgiLCJtZXRhU2l0ZUlkIjoiYzQzNzczYzEtOTYyZi00YTQ2LWIzY2MtMTEyNTgxYTA5ZWI1Iiwic2lnbkRhdGUiOiIyMDI1LTA4LTI1VDExOjI3OjQxLjQ5MVoiLCJ2ZW5kb3JQcm9kdWN0SWQiOiJyZXN0X3BybyIsImRlbW9Nb2RlIjpmYWxzZSwib3JpZ2luSW5zdGFuY2VJZCI6IjZlNmI5NmUzLWU1NWQtNGYwZi05MGU0LWMyNTEwZDE0ODQ5MSIsImFpZCI6IjJlODBkY2Q1LTE2ZjYtNDViOC1hYjk0LTdmNjJkYjNlYjc1NCIsImJpVG9rZW4iOiI4ODQ2NWRiYS1kNjU2LTBmZDYtMzIwNC0wMTllY2Y4NDY4NGQiLCJzaXRlT3duZXJJZCI6IjU5MDUwZTQ2LWFkODctNDRjMC04Yzc0LWIyY2ZkZjRiYTZlMSIsImJzIjoiUzhDTGI1cW1KTnpRNXl3cmg4bUZqU0FfdkNsRG9QMllDUkRzZVVNWk5vTSIsInNjZCI6IjIwMTctMDktMTNUMDk6MjI6MzUuNTc4WiJ9&currency=SEK&currentCurrency=SEK&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22host%22%3A%22VIEWER%22%2C%22bsi%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%2C%22siteRevision%22%3A%224%22%2C%22branchId%22%3A%220af5bd90-87c6-4b4b-9c86-e8e25a0c6304%22%2C%22renderingFlow%22%3A%22NONE%22%2C%22language%22%3A%22sv%22%2C%22locale%22%3A%22sv-se%22%2C%22BSI%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%7D&currentRoute=.%2Fmeny&target=_top&section-url=https%3A%2F%2Fwww.smakapakina.se%2Fmeny%2F&vsi=cc5587fd-9100-46f2-b43c-027a54a3efca';

    try {
        const response = await fetch(url);
        const html = await response.text();

        console.log('Response status:', response.status);
        console.log('Content-Type:', response.headers.get('content-type'));
        console.log('\n=== First 1000 characters ===');
        console.log(html.substring(0, 1000));

        console.log('\n=== Next 1000 characters ===');
        console.log(html.substring(1000, 2000));

        console.log('\n=== Looking for menu-related content ===');

        // Look for various patterns that might contain menu data
        const patterns = [
            /menu/gi,
            /lunch/gi,
            /måndag/gi,
            /tisdag/gi,
            /onsdag/gi,
            /torsdag/gi,
            /fredag/gi,
            /kr\b/gi,
            /\d+\s*kr/gi
        ];

        patterns.forEach((pattern, index) => {
            const matches = html.match(pattern);
            if (matches) {
                console.log(`Pattern ${index + 1} (${pattern.source}): Found ${matches.length} matches`);
                // Show context around first few matches
                matches.slice(0, 3).forEach((match, matchIndex) => {
                    const matchPos = html.indexOf(match);
                    const start = Math.max(0, matchPos - 50);
                    const end = Math.min(html.length, matchPos + match.length + 50);
                    console.log(`  Match ${matchIndex + 1}: "${html.substring(start, end)}"`);
                });
            }
        });

        console.log('\n=== Total HTML length ===');
        console.log(`${html.length} characters`);

        // Try to find script tags or data structures
        const scriptMatches = html.match(/<script[^>]*>[\s\S]*?<\/script>/gi);
        if (scriptMatches) {
            console.log(`\n=== Found ${scriptMatches.length} script tags ===`);
            scriptMatches.forEach((script, index) => {
                if (script.length < 500) {
                    console.log(`Script ${index + 1}: ${script}`);
                } else {
                    console.log(`Script ${index + 1}: ${script.substring(0, 200)}... (${script.length} chars total)`);
                }
            });
        }

    } catch (error) {
        console.error('Error fetching URL:', error);
    }
}

debugSmakapakinaHTML().catch(console.error);
