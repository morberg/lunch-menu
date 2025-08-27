interface MenuItem {
    name: string;
    price: number | null; // Price in SEK, null if not available
    day: string;
}

interface DailyMenu {
    [day: string]: MenuItem[];
}

export { MenuItem, DailyMenu };