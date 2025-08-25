import { MenuItem } from '../types/menu';

export function parseMenuData(rawData: any): MenuItem[] {
    const menuItems: MenuItem[] = [];

    // Example parsing logic (this will need to be customized based on the actual structure of the rawData)
    rawData.forEach((item: any) => {
        const menuItem: MenuItem = {
            name: item.name,
            price: item.price,
            day: item.day,
        };
        menuItems.push(menuItem);
    });

    return menuItems;
}

export function formatPrice(price: number): string {
    return `SEK ${price.toFixed(2)}`;
}

export function organizeMenuByDay(menuItems: MenuItem[]): Record<string, MenuItem[]> {
    return menuItems.reduce((acc, item) => {
        if (!acc[item.day]) {
            acc[item.day] = [];
        }
        acc[item.day].push(item);
        return acc;
    }, {} as Record<string, MenuItem[]>);
}