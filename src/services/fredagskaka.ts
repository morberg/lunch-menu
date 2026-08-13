import axios from 'axios';

const FRIDAY_CAKE_URL = 'https://api.fredagskakan.se/thisweek';
const FRIDAY_CAKE_TIMEOUT_MS = 5000;

export interface FridayCake {
    Kaka: string;
    URL: string;
    Year: number | string;
    Week: number | string;
}

function isFridayCake(value: unknown): value is FridayCake {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const cake = value as Record<string, unknown>;
    const isWeekIdentifier = (identifier: unknown): identifier is number | string =>
        typeof identifier === 'number' || typeof identifier === 'string';

    return typeof cake.Kaka === 'string' && cake.Kaka.length > 0 &&
        typeof cake.URL === 'string' && cake.URL.length > 0 &&
        isWeekIdentifier(cake.Year) && isWeekIdentifier(cake.Week);
}

export async function getFridayCake(): Promise<FridayCake | null> {
    try {
        const response = await axios.get<unknown>(FRIDAY_CAKE_URL, { timeout: FRIDAY_CAKE_TIMEOUT_MS });
        if (!isFridayCake(response.data)) {
            console.error('Unexpected fredagskaka response');
            return null;
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching fredagskaka:', error);
        return null;
    }
}