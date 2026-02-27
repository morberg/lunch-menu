import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import axios from 'axios';
import {
    loadHtmlSource,
    scrapeHtmlMenu,
    splitNormalizedLines
} from '../../src/utils/scraper';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scraper utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('splitNormalizedLines normalizes whitespace and removes blanks', () => {
        const lines = splitNormalizedLines('  A   line  \r\n\r\n B\tline \n   ');
        expect(lines).toEqual(['A line', 'B line']);
    });

    test('loadHtmlSource reads fixture URLs from disk', async () => {
        const fixturePath = path.join(os.tmpdir(), `scraper-fixture-${Date.now()}.html`);
        fs.writeFileSync(fixturePath, '<html>fixture</html>', 'utf8');

        try {
            const html = await loadHtmlSource(`file://${fixturePath}`, 'https://example.com');
            expect(html).toBe('<html>fixture</html>');
            expect(mockedAxios.get).not.toHaveBeenCalled();
        } finally {
            fs.unlinkSync(fixturePath);
        }
    });

    test('loadHtmlSource fetches remote HTML when no fixture URL is provided', async () => {
        mockedAxios.get.mockResolvedValue({ data: '<html>remote</html>' } as any);

        const html = await loadHtmlSource(undefined, 'https://example.com', { timeout: 5000 });

        expect(html).toBe('<html>remote</html>');
        expect(mockedAxios.get).toHaveBeenCalledWith('https://example.com', { timeout: 5000 });
    });

    test('scrapeHtmlMenu returns fallback on load failure', async () => {
        mockedAxios.get.mockRejectedValue(new Error('network down'));
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

        const menu = await scrapeHtmlMenu({
            scraperName: 'TestScraper',
            url: 'https://example.com',
            parseHtml: () => [{ name: 'ignored', day: 'Måndag', price: 100 }],
            fallback: [{ name: 'fallback', day: 'Hela veckan', price: null }]
        });

        expect(menu).toEqual([{ name: 'fallback', day: 'Hela veckan', price: null }]);
        expect(errorSpy).toHaveBeenCalled();

        errorSpy.mockRestore();
    });
});
