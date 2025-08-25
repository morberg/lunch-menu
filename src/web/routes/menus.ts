import express from 'express';
import { scrapeEdisonMenu } from '../../scrapers/edison';
import { scrapeBricksMenu } from '../../scrapers/bricks';
import { scrapeKantinMenu } from '../../scrapers/kantin';

const router = express.Router();

router.get('/menus', async (req, res) => {
    try {
        console.log('Fetching menus from all restaurants...');
        
        const [edisonMenu, bricksMenu, kantinMenu] = await Promise.allSettled([
            scrapeEdisonMenu(),
            scrapeBricksMenu(),
            scrapeKantinMenu()
        ]);

        const result = {
            edison: edisonMenu.status === 'fulfilled' ? edisonMenu.value : [],
            bricks: bricksMenu.status === 'fulfilled' ? bricksMenu.value : [],
            kantin: kantinMenu.status === 'fulfilled' ? kantinMenu.value : [],
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

        res.json(result);
    } catch (error) {
        console.error('Error in /menus route:', error);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
});

export default router;