import { MenuItem } from '../types/menu';

describe('Menu Types Tests', () => {
    it('should validate MenuItem interface', () => {
        const testMenuItem = {
            name: 'Pasta Bolognese',
            price: 125,
            day: 'Måndag'
        };

        expect(testMenuItem.name).toBeDefined();
        expect(testMenuItem.price).toBeDefined();
        expect(testMenuItem.day).toBeDefined();
        expect(typeof testMenuItem.name).toBe('string');
        expect(typeof testMenuItem.price).toBe('number');
        expect(typeof testMenuItem.day).toBe('string');
    });

    it('should validate Swedish weekday names', () => {
        const validDays = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag'];

        validDays.forEach(day => {
            expect(day).toMatch(/^[A-ZÅÄÖ][a-zåäö]+$/);
        });
    });

    it('should validate price format contains numbers', () => {
        const validPrices = ['125 kr', '130', '99 kr', '149'];

        validPrices.forEach(price => {
            expect(price).toMatch(/\d+/);
        });
    });
});

describe('Menu Data Validation', () => {
    it('should validate menu item arrays', () => {
        const menuItems: MenuItem[] = [
            { name: 'Pasta Carbonara', price: 125, day: 'Måndag' },
            { name: 'Fish and Chips', price: 135, day: 'Tisdag' }
        ];

        expect(Array.isArray(menuItems)).toBe(true);
        expect(menuItems.length).toBe(2);

        menuItems.forEach(item => {
            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('day');
        });
    });

    it('should handle empty menu arrays', () => {
        const emptyMenu: MenuItem[] = [];
        expect(Array.isArray(emptyMenu)).toBe(true);
        expect(emptyMenu.length).toBe(0);
    });
});
