import { MenuItem } from '../types/menu';

export async function scrapeSmakapakina(): Promise<MenuItem[]> {
    try {
        // TODO: Parse from https://www.smakapakina.se/meny if it changes from
        // week to week
        const url = 'https://apps.wixrestaurants.com/?type=wixmenus.client&pageId=z7f1i&compId=TPASection_iiu79eq9&viewerCompId=TPASection_iiu79eq9&siteRevision=4&viewMode=site&deviceType=desktop&locale=sv&tz=Europe%2FStockholm&regionalLanguage=sv&width=980&height=3967&instance=_XKqBaPrt2LxIMw9cBo4FyvgRmNmyNq4M9ILMNIFo2k.eyJpbnN0YW5jZUlkIjoiNGM3MTJlN2ItNDA3OS00NTkwLTgxYzgtMTBiYjRlMjRmNmY4IiwiYXBwRGVmSWQiOiIxM2MxNDAyYy0yN2YyLWQ0YWItNzQ2My1lZTdjODllMDc1NzgiLCJtZXRhU2l0ZUlkIjoiYzQzNzczYzEtOTYyZi00YTQ2LWIzY2MtMTEyNTgxYTA5ZWI1Iiwic2lnbkRhdGUiOiIyMDI1LTA4LTI1VDExOjI3OjQxLjQ5MVoiLCJ2ZW5kb3JQcm9kdWN0SWQiOiJyZXN0X3BybyIsImRlbW9Nb2RlIjpmYWxzZSwib3JpZ2luSW5zdGFuY2VJZCI6IjZlNmI5NmUzLWU1NWQtNGYwZi05MGU0LWMyNTEwZDE0ODQ5MSIsImFpZCI6IjJlODBkY2Q1LTE2ZjYtNDViOC1hYjk0LTdmNjJkYjNlYjc1NCIsImJpVG9rZW4iOiI4ODQ2NWRiYS1kNjU2LTBmZDYtMzIwNC0wMTllY2Y4NDY4NGQiLCJzaXRlT3duZXJJZCI6IjU5MDUwZTQ2LWFkODctNDRjMC04Yzc0LWIyY2ZkZjRiYTZlMSIsImJzIjoiUzhDTGI1cW1KTnpRNXl3cmg4bUZqU0FfdkNsRG9QMllDUkRzZVVNWk5vTSIsInNjZCI6IjIwMTctMDktMTNUMDk6MjI6MzUuNTc4WiJ9&currency=SEK&currentCurrency=SEK&commonConfig=%7B%22brand%22%3A%22wix%22%2C%22host%22%3A%22VIEWER%22%2C%22bsi%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%2C%22siteRevision%22%3A%224%22%2C%22branchId%22%3A%220af5bd90-87c6-4b4b-9c86-e8e25a0c6304%22%2C%22renderingFlow%22%3A%22NONE%22%2C%22language%22%3A%22sv%22%2C%22locale%22%3A%22sv-se%22%2C%22BSI%22%3A%2217b6d3e9-e3ad-45fc-bbc2-3937014b56b0%7C1%22%7D&currentRoute=.%2Fmeny&target=_top&section-url=https%3A%2F%2Fwww.smakapakina.se%2Fmeny%2F&vsi=cc5587fd-9100-46f2-b43c-027a54a3efca';

        const response = await fetch(url);
        const html = await response.text();

        // Parse HTML to extract menu items
        const menuItems: MenuItem[] = [];

        // Find all menu items by looking for data-hook="wixrest-menus-item-title"
        const titleRegex = /data-hook="wixrest-menus-item-title"[^>]*>([^<]+)</g;
        const descriptionRegex = /data-hook="wixrest-menus-item-description"[^>]*>([^<]+(?:<[^>]*>[^<]*)*?)</g;
        const priceRegex = /data-hook="wixrest-menus-item-price"[^>]*>([^<]+)</g;

        let titleMatch;
        let descriptionMatch;
        let priceMatch;

        const titles: string[] = [];
        const descriptions: string[] = [];
        const prices: string[] = [];

        // Extract all titles
        while ((titleMatch = titleRegex.exec(html)) !== null) {
            titles.push(titleMatch[1].trim());
        }

        // Extract all descriptions
        while ((descriptionMatch = descriptionRegex.exec(html)) !== null) {
            descriptions.push(descriptionMatch[1].trim());
        }

        // Extract all prices
        while ((priceMatch = priceRegex.exec(html)) !== null) {
            prices.push(priceMatch[1].trim());
        }

        // Match titles, descriptions, and prices
        for (let i = 0; i < titles.length; i++) {
            const title = titles[i];
            const description = descriptions[i] || '';
            const priceText = prices[i] || '';

            // Skip non-lunch items (only process items with Swedish day names)
            if (!title.match(/måndag|tisdag|onsdag|torsdag|fredag/i)) {
                continue;
            }

            // Parse description to extract all dishes as one complete meal
            const dishMatches = description.match(/\d+\.\s*[^0-9]+?(?=\s*\d+\.|$)/g);

            if (dishMatches) {
                // Combine all dishes into one menu description, removing Chinese characters
                const allDishes = dishMatches.map(dish => {
                    const cleanDish = dish.replace(/^\d+\.\s*/, '').trim();
                    // Remove Chinese characters (anything within parentheses that contains Chinese)
                    return cleanDish.replace(/\s*\([^)]*[\u4e00-\u9fff][^)]*\)/g, '').trim();
                }).join(', ');

                if (allDishes) {
                    // Parse day from title
                    const dayMatch = title.match(/(måndag|tisdag|onsdag|torsdag|fredag)/i);
                    const day = dayMatch ? dayMatch[1] : '';

                    // Extract clean price
                    const priceMatch = priceText.match(/(\d+)/);
                    const cleanPrice = priceMatch ? priceMatch[1] + ' kr' : priceText;

                    const menuItem: MenuItem = {
                        name: allDishes,
                        day: day,
                        price: cleanPrice
                    };

                    menuItems.push(menuItem);
                }
            }
        }

        return menuItems;
    } catch (error) {
        console.error('Error scraping Smakapakina:', error);
        return [];
    }
}
