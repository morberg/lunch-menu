import axios from 'axios';
import { getFridayCake } from '../../src/services/fredagskaka';

jest.mock('axios');

const axiosGetMock = axios.get as jest.MockedFunction<typeof axios.get>;

describe('getFridayCake', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('returns a valid Friday cake response', async () => {
        const cake = {
            Kaka: 'Citronkaka',
            URL: 'https://fredagskakan.se/citronkaka.jpg',
            Year: 2026,
            Week: 32
        };
        axiosGetMock.mockResolvedValue({ data: cake } as never);

        await expect(getFridayCake()).resolves.toEqual(cake);
        expect(axiosGetMock).toHaveBeenCalledWith('https://api.fredagskakan.se/thisweek', { timeout: 5000 });
    });

    test('returns null when the source response is invalid', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        axiosGetMock.mockResolvedValue({ data: { Kaka: 'Citronkaka' } } as never);

        await expect(getFridayCake()).resolves.toBeNull();
        errorSpy.mockRestore();
    });

    test('returns null when the source request fails', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
        axiosGetMock.mockRejectedValue(new Error('network unavailable'));

        await expect(getFridayCake()).resolves.toBeNull();
        errorSpy.mockRestore();
    });
});