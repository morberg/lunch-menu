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
        res.json(result);
    } catch (error) {
        console.error('Error in /menus route:', error);
        res.status(500).json({ error: 'Failed to fetch menus' });
    }
});

export default router;