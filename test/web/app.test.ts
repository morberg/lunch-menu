import type { Server } from 'http';
import { AddressInfo } from 'net';

jest.mock('../../src/services/menu-service', () => ({
    menuService: {
        getMenus: jest.fn()
    }
}));

jest.mock('../../src/services/fredagskaka', () => ({
    getFridayCake: jest.fn()
}));

import { menuService } from '../../src/services/menu-service';
import { getFridayCake } from '../../src/services/fredagskaka';
import { app } from '../../src/web/app';

const getMenusMock = menuService.getMenus as jest.MockedFunction<typeof menuService.getMenus>;
const getFridayCakeMock = getFridayCake as jest.MockedFunction<typeof getFridayCake>;

async function requestApp(path: string, method: string = 'GET'): Promise<Response> {
    const server = app.listen(0);
    const { port } = server.address() as AddressInfo;

    try {
        return await fetch(`http://127.0.0.1:${port}${path}`, { method });
    } finally {
        await closeServer(server);
    }
}

function closeServer(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
        server.close((error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
}

describe('web application', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        getFridayCakeMock.mockResolvedValue(null);
    });

    test('serves the page with safely serialized initial data and a Vercel cache lifetime', async () => {
        getMenusMock.mockResolvedValue([{
            key: 'edison',
            name: 'Edison',
            url: 'https://restaurangedison.se/lunch/',
            menu: [{ name: '</script><script>window.injected = true</script>', day: 'Måndag', price: 100 }]
        }]);
        getFridayCakeMock.mockResolvedValue({
            Kaka: '</script><script>window.injected = true</script>',
            URL: 'https://fredagskakan.se/example.jpg',
            Year: 2026,
            Week: 32
        });

        const response = await requestApp('/');

        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toMatch(/^public, max-age=0, s-maxage=\d+$/);
        const html = await response.text();
        expect(html).toContain('window.INITIAL_MENUS =');
        expect(html).toContain('window.FREDAGSKAKA =');
        expect(html).toContain('id="fredagskaka-banner"');
        expect(html).toContain('\\u003c/script\\u003e');
        expect(html).not.toContain('</script><script>window.injected = true</script>');
        expect(html).not.toContain("fetch('/api/");
    });

    test('does not expose the former API routes', async () => {
        const response = await requestApp('/api/menus');

        expect(response.status).toBe(404);
        expect(getMenusMock).not.toHaveBeenCalled();
    });

    test('returns a server error when menu loading fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        getMenusMock.mockRejectedValue(new Error('cache unavailable'));

        const response = await requestApp('/');

        expect(response.status).toBe(500);
        await expect(response.text()).resolves.toBe('Kunde inte ladda menyer. Försök igen senare.');
        errorSpy.mockRestore();
    });
});