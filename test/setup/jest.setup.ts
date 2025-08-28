// Jest setup file for all tests

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeAll(() => {
    // Suppress console output during tests unless specifically needed
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
});

afterAll(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
});

// Global test utilities
export { }; // Make this file a module

declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidMenuItem(): R;
            toHaveValidPrice(): R;
        }
    }
}

// Custom Jest matchers
expect.extend({
    toBeValidMenuItem(received) {
        const pass =
            received &&
            typeof received === 'object' &&
            typeof received.name === 'string' &&
            received.name.length > 0 &&
            (typeof received.price === 'number' || received.price === null) &&
            typeof received.day === 'string' &&
            received.day.length > 0;

        if (pass) {
            return {
                message: () => `expected ${JSON.stringify(received)} not to be a valid menu item`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${JSON.stringify(received)} to be a valid menu item with name (string), price (number|null), and day (string)`,
                pass: false,
            };
        }
    },

    toHaveValidPrice(received) {
        const pass = typeof received === 'number' && received > 0;

        if (pass) {
            return {
                message: () => `expected ${received} not to be a valid price`,
                pass: true,
            };
        } else {
            return {
                message: () => `expected ${received} to be a valid price (positive number)`,
                pass: false,
            };
        }
    },
});
