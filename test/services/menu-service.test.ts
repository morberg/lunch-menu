jest.mock('../../src/scrapers/edison', () => ({ scrapeEdisonMenu: jest.fn() }));
jest.mock('../../src/scrapers/bricks', () => ({ scrapeBricksMenu: jest.fn() }));
jest.mock('../../src/scrapers/kantin', () => ({ scrapeKantinMenu: jest.fn() }));
jest.mock('../../src/scrapers/smakapakina', () => ({ scrapeSmakapakina: jest.fn() }));
jest.mock('../../src/scrapers/eatery', () => ({ scrapeEatery: jest.fn() }));
jest.mock('../../src/scrapers/foodhall', () => ({ scrapeFoodHallMenu: jest.fn() }));
jest.mock('../../src/scrapers/grenden', () => ({ scrapeGrendenMenu: jest.fn() }));

import { scrapeEdisonMenu } from '../../src/scrapers/edison';
import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { scrapeKantinMenu } from '../../src/scrapers/kantin';
import { scrapeSmakapakina } from '../../src/scrapers/smakapakina';
import { scrapeEatery } from '../../src/scrapers/eatery';
import { scrapeFoodHallMenu } from '../../src/scrapers/foodhall';
import { scrapeGrendenMenu } from '../../src/scrapers/grenden';
import MenuService, { menuService } from '../../src/services/menu-service';

const edisonMock = scrapeEdisonMenu as jest.MockedFunction<typeof scrapeEdisonMenu>;
const bricksMock = scrapeBricksMenu as jest.MockedFunction<typeof scrapeBricksMenu>;
const kantinMock = scrapeKantinMenu as jest.MockedFunction<typeof scrapeKantinMenu>;
const smakapakinaMock = scrapeSmakapakina as jest.MockedFunction<typeof scrapeSmakapakina>;
const eateryMock = scrapeEatery as jest.MockedFunction<typeof scrapeEatery>;
const foodhallMock = scrapeFoodHallMenu as jest.MockedFunction<typeof scrapeFoodHallMenu>;
const grendenMock = scrapeGrendenMenu as jest.MockedFunction<typeof scrapeGrendenMenu>;

function mockAllScrapersResolved(): void {
    edisonMock.mockResolvedValue([{ name: 'Edison item', day: 'Måndag', price: 100 }]);
    bricksMock.mockResolvedValue([{ name: 'Bricks item', day: 'Måndag', price: 101 }]);
    kantinMock.mockResolvedValue([{ name: 'Kantin item', day: 'Måndag', price: 102 }]);
    smakapakinaMock.mockResolvedValue([{ name: 'Smakapakina item', day: 'Måndag', price: 103 }]);
    eateryMock.mockResolvedValue([{ name: 'Eatery item', day: 'Måndag', price: 104 }]);
    foodhallMock.mockResolvedValue([{ name: 'Food Hall item', day: 'Hela veckan', price: 105 }]);
    grendenMock.mockResolvedValue([{ name: 'Grenden item', day: 'Måndag', price: 106 }]);
}

describe('MenuService cache behavior', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    beforeAll(() => {
        menuService.stopBackgroundRefresh();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockAllScrapersResolved();
    });

    afterAll(() => {
        logSpy.mockRestore();
        errorSpy.mockRestore();
    });

    test('caches fetched menus between getMenus calls', async () => {
        const service = new MenuService(false);

        const first = await service.getMenus();
        const second = await service.getMenus();

        expect(first).toEqual(second);
        expect(edisonMock).toHaveBeenCalledTimes(1);
        expect(bricksMock).toHaveBeenCalledTimes(1);
    });

    test('returns empty list for rejected scraper while keeping others', async () => {
        const service = new MenuService(false);
        bricksMock.mockRejectedValue(new Error('bricks failed'));

        const result = await service.getMenus();

        expect(result.bricks).toEqual([]);
        expect(result.edison).toEqual([{ name: 'Edison item', day: 'Måndag', price: 100 }]);
    });

    test('invalidateCache forces refetch', async () => {
        const service = new MenuService(false);

        await service.getMenus();
        await service.invalidateCache();

        expect(edisonMock).toHaveBeenCalledTimes(2);
        expect(grendenMock).toHaveBeenCalledTimes(2);
    });
});
