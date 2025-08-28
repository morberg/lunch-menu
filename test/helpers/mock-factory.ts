import axios from 'axios';

// Type the mocked modules
export const mockAxios = axios as jest.Mocked<typeof axios>;

/**
 * Mock axios for integration tests
 */
export function setupAxiosMocks() {
    jest.mock('axios');

    // Reset all mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    return mockAxios;
}

/**
 * Mock pdf-parse for integration tests
 * @param textContent - Text content to return from PDF parsing
 */
export function mockPdfParseWith(textContent: string) {
    const mockPdfParse = require('pdf-parse') as jest.MockedFunction<any>;
    mockPdfParse.mockResolvedValue({
        text: textContent,
        numpages: 1,
        numrender: 1,
        info: {},
        metadata: null,
        version: '1.10.100' as any
    });
}

/**
 * Mock fetch for tests that use node-fetch
 */
export function setupFetchMocks() {
    const mockFetch = jest.fn();

    // Mock the global fetch or node-fetch depending on usage
    jest.mock('node-fetch', () => mockFetch);

    beforeEach(() => {
        mockFetch.mockClear();
    });

    return mockFetch;
}

/**
 * Create a mock HTTP response
 */
export function createMockResponse(data: any, status = 200, headers = {}) {
    return {
        data,
        status,
        headers: {
            'content-type': 'text/html',
            ...headers
        },
        statusText: 'OK'
    };
}

/**
 * Create a mock fetch response
 */
export function createMockFetchResponse(body: string, init: ResponseInit = {}) {
    return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        text: () => Promise.resolve(body),
        json: () => Promise.resolve(JSON.parse(body)),
        ...init
    });
}
