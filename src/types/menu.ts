import type { SwedishDay } from '../utils/days';

export interface MenuItem {
    name: string;
    price: number | null; // Price in SEK, null if not available
    day: SwedishDay;
}