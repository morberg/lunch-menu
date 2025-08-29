import { scrapeFoodHallMenu } from '../../src/scrapers/foodhall';
import { setupAxiosMocks, createMockResponse } from '../helpers/mock-factory';

// Mock axios
jest.mock('axios');
const mockAxios = setupAxiosMocks();

describe('Food Hall Scraper Integration', () => {
    describe('with valid HTML fixture', () => {
        beforeEach(() => {
            // Mock successful HTTP response with Food Hall HTML structure that matches the real site
            const mockHtml = `
                <html>
                    <body>
                        <div class="elementor-element elementor-element-602ab73">
                            <div class="elementor-widget-container">
                                <h2 class="elementor-heading-title elementor-size-default">Bao Bao</h2>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-5057614">
                            <div class="elementor-widget-container">
                                <h3 class="elementor-heading-title elementor-size-default">Lunch menu</h3>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-2ae038e elementor-widget-text-editor">
                            <div class="elementor-widget-container">
                                <p>PRICE: 105KR</p>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-0ec9aee elementor-widget-text-editor">
                            <div class="elementor-widget-container">
                                <p><strong>Korean fried chicken</strong> – served with fragrant jasmine rice and crisp quick-pickled vegetables</p>
                                <p><strong>Sticky Cauliflower</strong> – glazed in our signature sauce, with jasmine rice, fresh spring onion, and toasted sesame seeds</p>
                            </div>
                        </div>
                        
                        <div class="elementor-element elementor-element-76f24f5">
                            <div class="elementor-widget-container">
                                <h2 class="elementor-heading-title elementor-size-default">Wurst Case Scenario</h2>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-0489e00">
                            <div class="elementor-widget-container">
                                <h3 class="elementor-heading-title elementor-size-default">Lunch menu</h3>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-09c941d elementor-widget-text-editor">
                            <div class="elementor-widget-container">
                                <p>PRICE: 105KR</p>
                            </div>
                        </div>
                        <div class="elementor-element elementor-element-b0448d7 elementor-widget-text-editor">
                            <div class="elementor-widget-container">
                                <p><strong>Kabanoss flatbread roll</strong> – kabanoss with creamy mighty mash, spicy shrimp mix, pickled chili, and mustard</p>
                                <p><strong>Stroganoff</strong> – a modern twist on the classic, with falukorv and spiced sausage, smetana, roasted cherry tomatoes, cornichons, and mighty mash</p>
                            </div>
                        </div>
                    </body>
                </html>
            `;
            mockAxios.get.mockResolvedValue(createMockResponse(mockHtml));
        });

        it('should parse menu items from both concepts', async () => {
            const menu = await scrapeFoodHallMenu();

            expect(Array.isArray(menu)).toBe(true);
            expect(menu.length).toBe(4); // Should be exactly 4 items

            // Check that we have items from both concepts
            const baoItems = menu.filter(item => item.name.includes('Bao Bao'));
            const wurstItems = menu.filter(item => item.name.includes('Wurst Case Scenario'));

            expect(baoItems.length).toBe(2);
            expect(wurstItems.length).toBe(2);
        });

        it('should have correct structure for menu items', async () => {
            const menu = await scrapeFoodHallMenu();

            menu.forEach(item => {
                expect(item).toHaveProperty('name');
                expect(item).toHaveProperty('price');
                expect(item).toHaveProperty('day');

                expect(typeof item.name).toBe('string');
                expect(typeof item.price).toBe('number');
                expect(item.day).toBe('Hela veckan');

                // Check that name includes concept
                expect(item.name).toMatch(/^(Bao Bao|Wurst Case Scenario):/);
            });
        });

        it('should parse price correctly', async () => {
            const menu = await scrapeFoodHallMenu();

            menu.forEach(item => {
                expect(item.price).toBe(105);
            });
        });

        it('should assign all items to "Hela veckan"', async () => {
            const menu = await scrapeFoodHallMenu();

            menu.forEach(item => {
                expect(item.day).toBe('Hela veckan');
            });
        });
    });

    describe('with empty response', () => {
        beforeEach(() => {
            const emptyHtml = '<html><body></body></html>';
            mockAxios.get.mockResolvedValue(createMockResponse(emptyHtml));
        });

        it('should return empty array for empty HTML', async () => {
            const menu = await scrapeFoodHallMenu();
            expect(menu).toEqual([]);
        });
    });

    describe('with malformed HTML', () => {
        beforeEach(() => {
            const malformedHtml = '<html><body><h2>Bao Bao</h2><p>No lunch menu section</p></body></html>';
            mockAxios.get.mockResolvedValue(createMockResponse(malformedHtml));
        });

        it('should handle missing lunch menu sections gracefully', async () => {
            const menu = await scrapeFoodHallMenu();
            expect(Array.isArray(menu)).toBe(true);
            // May be empty if no proper lunch menu structure is found
        });
    });

    describe('error handling', () => {
        beforeEach(() => {
            mockAxios.get.mockRejectedValue(new Error('Network error'));
        });

        it('should return empty array on network error', async () => {
            const menu = await scrapeFoodHallMenu();
            expect(menu).toEqual([]);
        });

        it('should not throw on network error', async () => {
            await expect(scrapeFoodHallMenu()).resolves.not.toThrow();
        });
    });

    describe('with realistic HTML structure', () => {
        beforeEach(() => {
            // HTML structure that will NOT match our scraper (for negative testing)
            const realisticHtml = `
                <html>
                    <body>
                        <div class="content">
                            <h1>Food hall</h1>
                            <section>
                                <h2>Bao Bao</h2>
                                <p>Pan-Asian street food with a focus on fresh flavors and simple, vibrant dishes.</p>
                                <div class="menu-section">
                                    <h3>Lunch menu</h3>
                                    <div class="price-info">
                                        <p>PRICE: 105KR</p>
                                    </div>
                                    <div class="dishes">
                                        <p>Korean fried chicken – served with fragrant jasmine rice and crisp quick-pickled vegetables</p>
                                        <p>Sticky Cauliflower – glazed in our signature sauce, with jasmine rice, fresh spring onion, and toasted sesame seeds</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </body>
                </html>
            `;
            mockAxios.get.mockResolvedValue(createMockResponse(realisticHtml));
        });

        it('should handle HTML without proper elementor structure', async () => {
            const menu = await scrapeFoodHallMenu();

            // This HTML structure doesn't have the proper elementor classes or strong tags
            // so the scraper should return an empty array
            expect(menu).toEqual([]);
        });
    });
});
