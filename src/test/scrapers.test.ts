import { MenuItem } from '../types/menu';

describe('Menu Types Tests', () => {
    it('should validate MenuItem interface', () => {
        const testItem: MenuItem = {
            name: 'Köttbullar med potatis',
            price: '125 kr',
            day: 'Måndag'
        };

        expect(testItem.name).toBeDefined();
        expect(testItem.price).toBeDefined();
        expect(testItem.day).toBeDefined();
        expect(typeof testItem.name).toBe('string');
        expect(typeof testItem.price).toBe('string');
        expect(typeof testItem.day).toBe('string');
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
            { name: 'Pasta Carbonara', price: '125 kr', day: 'Måndag' },
            { name: 'Fish and Chips', price: '135 kr', day: 'Tisdag' }
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
