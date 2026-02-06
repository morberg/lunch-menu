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

export default router;