import express from 'express';
import path from 'path';
import fs from 'fs';
import { menuService } from '../services/menu-service';
import { getFridayCake } from '../services/fredagskaka';
import { SWEDISH_DAYS } from '../utils/days';
import { secondsUntilNextStockholmRefresh } from '../utils/stockholm-time';

const app = express();

let cachedIndexTemplate: string | null = null;

function getIndexTemplate(): string {
    if (!cachedIndexTemplate) {
        const indexPath = path.join(__dirname, 'views', 'index.html');
        cachedIndexTemplate = fs.readFileSync(indexPath, 'utf-8');
    }

    return cachedIndexTemplate;
}

function serializeInitialData(value: unknown): string {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
        throw new Error('Could not serialize initial page data');
    }

    return serialized
        .replace(/</g, '\\u003c')
        .replace(/>/g, '\\u003e')
        .replace(/&/g, '\\u0026')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
}

app.get('/', async (_req, res) => {
    try {
        const [menus, fridayCake] = await Promise.all([menuService.getMenus(), getFridayCake()]);
        const initialDataScript = `<script>window.SWEDISH_DAYS = ${JSON.stringify(SWEDISH_DAYS)}; window.INITIAL_MENUS = ${serializeInitialData(menus)}; window.FREDAGSKAKA = ${serializeInitialData(fridayCake)};</script>`;
        const html = getIndexTemplate().replace('</head>', `    ${initialDataScript}\n</head>`);

        res.setHeader('Cache-Control', `public, max-age=0, s-maxage=${secondsUntilNextStockholmRefresh()}`);
        res.send(html);
    } catch (error) {
        console.error('Error serving menus:', error);
        res.status(500).send('Kunde inte ladda menyer. Försök igen senare.');
    }
});

export { app };
export default app;