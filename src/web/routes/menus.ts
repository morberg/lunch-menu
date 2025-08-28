import express from 'express';
import { menuService } from '../../services/menu-service';

const router = express.Router();

router.get('/menus', async (req, res) => {
    try {
        const result = await menuService.getMenus();
        res.json(result);
    } catch (error) {
        console.error('Error in /menus route:', error);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
});

// Admin endpoint to manually refresh cache
router.post('/menus/refresh', async (req, res) => {
    try {
        const result = await menuService.refreshMenus();
        res.json({ message: 'Menus refreshed successfully', data: result });
    } catch (error) {
        console.error('Error refreshing menus:', error);
        res.status(500).json({ error: 'Failed to refresh menus' });
    }
});

// Admin endpoint to check cache status
router.get('/menus/cache-status', (req, res) => {
    const stats = menuService.getCacheStats();
    res.json(stats);
});

export default router;