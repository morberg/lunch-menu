import express from 'express';
import axios from 'axios';
import { menuService } from '../../services/menu-service';

const router = express.Router();

router.get('/fredagskaka', async (_req, res) => {
    try {
        const response = await axios.get('https://api.fredagskakan.se/thisweek', { timeout: 5000 });
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching fredagskaka:', error);
        res.status(502).json({ error: 'Failed to fetch fredagskaka' });
    }
});

router.get('/menus', async (req, res) => {
    try {
        const result = await menuService.getMenus();
        // Menus are refreshed daily at 10:00.
        // Allow clients/CDN to cache for 5 minutes; serve stale for up to 24 hours while revalidating.
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        res.json(result);
    } catch (error) {
        console.error('Error in /menus route:', error);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
});

router.post('/menus/refresh', async (_req, res) => {
    try {
        console.log('Manual cache refresh requested');
        const result = await menuService.invalidateCache();
        res.json({ ok: true, refreshed: new Date().toISOString(), menus: result });
    } catch (error) {
        console.error('Error in /menus/refresh route:', error);
        res.status(500).json({ error: 'Failed to refresh menus' });
    }
});

export default router;