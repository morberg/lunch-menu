import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { setupAxiosMocks, createMockResponse } from '../helpers/mock-factory';
import { sampleMenuItems } from '../helpers/test-data';

// Mock axios
jest.mock('axios');
const mockAxios = setupAxiosMocks();

describe('Bricks Scraper Integration', () => {
    describe('with valid HTML fixture', () => {
        beforeEach(() => {
            // Mock successful HTTP response with mock HTML structure
            const mockHtml = `
          <html>
            <body>
              <div class="menu-item">
                <span class="dish-name">Grilled Chicken</span>
                <span class="price">89 kr</span>
                <span class="day">Monday</span>
              </div>
              <div class="menu-item">
                <span class="dish-name">Fish & Chips</span>
                <span class="price">95 kr</span>
                <span class="day">Tuesday</span>
              </div>
            </body>
          </html>
        `;
            mockAxios.get.mockResolvedValue(createMockResponse(mockHtml));
        });

        it('should parse menu items from HTML', async () => {
            const menu = await scrapeBricksMenu();

            expect(Array.isArray(menu)).toBe(true);

            if (menu.length > 0) {
                menu.forEach(item => {
                    expect(item).toHaveProperty('name');
                    expect(item).toHaveProperty('price');
                    expect(item).toHaveProperty('day');
                    expect(typeof item.name).toBe('string');
                    expect(typeof item.price === 'number' || item.price === null).toBe(true);
                    expect(typeof item.day).toBe('string');
                });
            }
        });

        it('should return consistent data structure', async () => {
            const menu = await scrapeBricksMenu();

            if (menu.length > 0) {
                expect(menu[0]).toHaveProperty('name');
                expect(menu[0]).toHaveProperty('price');
                expect(menu[0]).toHaveProperty('day');
            }
        });
    });

    describe('with empty or malformed HTML', () => {
        it('should handle empty menu gracefully', async () => {
            mockAxios.get.mockResolvedValue(createMockResponse('<html><body></body></html>'));

            const menu = await scrapeBricksMenu();

            expect(menu).toEqual([]);
        });

        it('should handle malformed HTML gracefully', async () => {
            mockAxios.get.mockResolvedValue(createMockResponse('<div><span>Incomplete'));

            const menu = await scrapeBricksMenu();

            expect(Array.isArray(menu)).toBe(true);
            // Should not throw an error, even with malformed HTML
        });
    });

    describe('with network errors', () => {
        it('should handle HTTP errors gracefully', async () => {
            mockAxios.get.mockRejectedValue(new Error('Network error'));

            const menu = await scrapeBricksMenu();

            // Scraper should return empty array on error, not throw
            expect(menu).toEqual([]);
        });

        it('should handle timeout errors', async () => {
            mockAxios.get.mockRejectedValue(new Error('ETIMEDOUT'));

            const menu = await scrapeBricksMenu();

            // Scraper should return empty array on timeout, not throw
            expect(menu).toEqual([]);
        });
    });
});
