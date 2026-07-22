import type { MenuDay } from '../utils/days';

interface MenuItem {
    name: string;
    price: number | null; // Price in SEK, null if not available
    day: MenuDay;
}

interface DailyMenu {
    [day: string]: MenuItem[];
}

export { MenuItem, DailyMenu };