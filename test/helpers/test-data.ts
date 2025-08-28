import { MenuItem } from '../../src/types/menu';

/**
 * Sample menu items for testing
 */
export const sampleMenuItems: MenuItem[] = [
    {
        name: 'Grilled Chicken with Rice',
        price: 89,
        day: 'Monday'
    },
    {
        name: 'Vegetarian Pasta',
        price: 79,
        day: 'Tuesday'
    },
    {
        name: 'Fish and Chips',
        price: 95,
        day: 'Wednesday'
    }
];

/**
 * Sample menu item for testing edge cases
 */
export const edgeCaseMenuItems: MenuItem[] = [
    {
        name: 'Dish with Special Characters: åäö & "quotes"',
        price: 100,
        day: 'Thursday'
    },
    {
        name: 'Very Long Dish Name That Might Cause Issues With Parsing Or Display Because It Contains So Many Words And Characters',
        price: 120,
        day: 'Friday'
    },
    {
        name: 'Contact Restaurant',
        price: null,
        day: 'Saturday'
    }
];

/**
 * Sample price strings for testing price parsing
 */
export const priceTestCases = [
    { input: '89 kr', expected: 89 },
    { input: '99.50 kr', expected: 99.5 },
    { input: '120:-', expected: 120 },
    { input: '75 SEK', expected: 75 },
    { input: '49,50 kr', expected: 49.5 },
    { input: 'Se restaurang', expected: null },
    { input: 'Contact restaurant', expected: null },
    { input: '', expected: null },
    { input: '-', expected: null },
    { input: 'N/A', expected: null }
];

/**
 * Sample HTML fragments for testing HTML parsing
 */
export const htmlTestFragments = {
    menuItem: `
    <div class="menu-item">
      <span class="dish-name">Test Dish</span>
      <span class="price">89 kr</span>
      <span class="day">Monday</span>
    </div>
  `,
    emptyMenu: '<div class="menu-container"></div>',
    malformedHtml: '<div><span>Incomplete'
};

/**
 * Sample PDF text content for testing PDF parsing
 */
export const pdfTestContent = `
Vecka 45 Lunchmeny

Måndag
Grilled Chicken with Rice - 89 kr
Vegetarian Option - 79 kr

Tisdag  
Fish and Chips - 95 kr
Pasta Bolognese - 85 kr

Onsdag
Thai Curry - 92 kr
Caesar Salad - 75 kr
`;

/**
 * Create a test menu item with optional overrides
 */
export function createTestMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
    return {
        name: 'Test Dish',
        price: 89,
        day: 'Monday',
        ...overrides
    };
}

/**
 * Create multiple test menu items
 */
export function createTestMenuItems(count: number, baseItem: Partial<MenuItem> = {}): MenuItem[] {
    return Array.from({ length: count }, (_, index) => createTestMenuItem({
        name: `Test Dish ${index + 1}`,
        ...baseItem
    }));
}
