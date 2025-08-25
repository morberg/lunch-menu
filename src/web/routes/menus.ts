import express from 'express';
import { scrapeEdisonMenu } from '../../scrapers/edison';
import { scrapeBricksMenu } from '../../scrapers/bricks';
import { scrapeKantinMenu } from '../../scrapers/kantin';
import { scrapeSmakapakina } from '../../scrapers/smakapakina';
import { scrapeGrendenMenu } from '../../scrapers/grenden';

const router = express.Router();

router.get('/menus', async (req, res) => {
    try {
        console.log('Fetching menus from all restaurants...');

        const [edisonMenu, bricksMenu, kantinMenu, smakapakinaMenu, grendenMenu] = await Promise.allSettled([
            scrapeEdisonMenu(),
            scrapeBricksMenu(),
            scrapeKantinMenu(),
            scrapeSmakapakina(),
            scrapeGrendenMenu()
        ]);

        const result = {
            edison: edisonMenu.status === 'fulfilled' ? edisonMenu.value : [],
            bricks: bricksMenu.status === 'fulfilled' ? bricksMenu.value : [],
            kantin: kantinMenu.status === 'fulfilled' ? kantinMenu.value : [],
            smakapakina: smakapakinaMenu.status === 'fulfilled' ? smakapakinaMenu.value : [],
            grenden: grendenMenu.status === 'fulfilled' ? grendenMenu.value : [],
        };

        // Log any errors
        if (edisonMenu.status === 'rejected') {
            console.error('Edison scraper failed:', edisonMenu.reason);
        }
        if (bricksMenu.status === 'rejected') {
            console.error('Bricks scraper failed:', bricksMenu.reason);
        }
        if (kantinMenu.status === 'rejected') {
            console.error('Kantin scraper failed:', kantinMenu.reason);
        }
        if (smakapakinaMenu.status === 'rejected') {
            console.error('Smakapakina scraper failed:', smakapakinaMenu.reason);
        }
        if (grendenMenu.status === 'rejected') {
            console.error('Grenden scraper failed:', grendenMenu.reason);
        }

        res.json(result);
    } catch (error) {
        console.error('Error in /menus route:', error);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
});

export default router;