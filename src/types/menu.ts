interface MenuItem {
    name: string;
    price: string;
    day: string;
}

interface DailyMenu {
    [day: string]: MenuItem[];
}

export { MenuItem, DailyMenu };