# Test Strategy for Lunch Menu Scraper

## Overview
This document outlines a robust, maintainable test strategy for the lunch-menu project. The goal is to create fast, reliable tests that don't depend on external services and provide good coverage of our scraping logic.

## Test Types

### 1. Unit Tests (`*.unit.test.ts`)
- **Purpose**: Test individual functions in isolation
- **Scope**: Utility functions, parsing logic, data transformations
- **Dependencies**: None (pure functions)
- **Speed**: Very fast (< 1ms per test)

**Examples:**
- `parsePrice()` function with various input formats
- `formatPrice()` function output validation
- Date parsing and normalization
- Text cleaning and sanitization

### 2. Integration Tests (`*.integration.test.ts`)
- **Purpose**: Test scraper functions with mocked HTTP responses
- **Scope**: Full scraper workflow using saved HTML/PDF fixtures
- **Dependencies**: Mocked HTTP clients (axios, fetch)
- **Speed**: Fast (< 100ms per test)

**Examples:**
- Bricks scraper with mocked HTML response
- Eatery scraper with mocked PDF response
- Error handling for malformed responses

### 3. Contract Tests (`*.contract.test.ts`)
- **Purpose**: Validate that our scrapers still work with live sites
- **Scope**: Minimal tests that check basic structure
- **Dependencies**: Live HTTP requests (run separately)
- **Speed**: Slow (1-5s per test)

**Examples:**
- Verify that target URLs return 200 status
- Check that expected DOM elements exist
- Validate response content type

### 4. End-to-End Tests (`*.e2e.test.ts`)
- **Purpose**: Test the full web application workflow
- **Scope**: Web UI, API endpoints, user journeys
- **Dependencies**: Running web server, browser automation
- **Speed**: Slow (2-10s per test)

**Examples:**
- Web page loads and displays restaurants
- API endpoints return expected data structure
- User can view menu for different days

## Directory Structure

```
test/
├── unit/
│   ├── price.unit.test.ts
│   ├── parser.unit.test.ts
│   └── date-utils.unit.test.ts
├── integration/
│   ├── bricks.integration.test.ts
│   ├── edison.integration.test.ts
│   ├── kantin.integration.test.ts
│   ├── smakapakina.integration.test.ts
│   └── eatery.integration.test.ts
├── contract/
│   ├── bricks.contract.test.ts
│   ├── edison.contract.test.ts
│   └── api-health.contract.test.ts
├── e2e/
│   ├── web-ui.e2e.test.ts
│   └── api.e2e.test.ts
├── fixtures/
│   ├── html/
│   │   ├── bricks-menu.html
│   │   ├── edison-menu.html
│   │   └── kantin-menu.html
│   ├── pdf/
│   │   └── eatery-menu.pdf
│   └── json/
│       └── expected-menu-format.json
├── helpers/
│   ├── fixture-loader.ts
│   ├── mock-factory.ts
│   └── test-data.ts
└── setup/
    ├── jest.setup.ts
    ├── mock-setup.ts
    └── global-teardown.ts
```

## Test Implementation Guidelines

### Unit Tests
```typescript
// test/unit/price.unit.test.ts
import { parsePrice, formatPrice } from '../../src/utils/price';

describe('Price Utils', () => {
  describe('parsePrice', () => {
    it('should parse Swedish currency formats', () => {
      expect(parsePrice('89 kr')).toBe(89);
      expect(parsePrice('99,50 SEK')).toBe(99.5);
      expect(parsePrice('120:-')).toBe(120);
    });

    it('should return null for invalid prices', () => {
      expect(parsePrice('Contact restaurant')).toBeNull();
      expect(parsePrice('')).toBeNull();
    });
  });
});
```

### Integration Tests
```typescript
// test/integration/bricks.integration.test.ts
import { scrapeBricksMenu } from '../../src/scrapers/bricks';
import { loadFixture } from '../helpers/fixture-loader';
import { mockAxios } from '../helpers/mock-factory';

jest.mock('axios');

describe('Bricks Scraper Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse menu from HTML fixture', async () => {
    const htmlFixture = loadFixture('html/bricks-menu.html');
    mockAxios.get.mockResolvedValue({ data: htmlFixture });

    const menu = await scrapeBricksMenu();

    expect(menu).toHaveLength(5);
    expect(menu[0]).toMatchObject({
      name: expect.any(String),
      price: expect.any(Number),
      day: expect.any(String)
    });
  });

  it('should handle empty menu gracefully', async () => {
    mockAxios.get.mockResolvedValue({ data: '<html><body></body></html>' });

    const menu = await scrapeBricksMenu();

    expect(menu).toEqual([]);
  });
});
```

### Contract Tests
```typescript
// test/contract/bricks.contract.test.ts
describe('Bricks Contract Tests', () => {
  it('should have accessible menu page', async () => {
    const response = await axios.get('https://bricks.se/lunch');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
  });

  it('should contain expected DOM structure', async () => {
    const response = await axios.get('https://bricks.se/lunch');
    const $ = cheerio.load(response.data);
    
    // Basic structure checks
    expect($('.menu-item')).toHaveLength.greaterThan(0);
    expect($('.price')).toHaveLength.greaterThan(0);
  });
});
```

## Mock Strategy

### HTTP Mocking
- Use Jest mocks for axios/fetch in integration tests
- Store real responses as fixtures for realistic testing
- Mock different scenarios (success, failure, malformed data)

### PDF Mocking
```typescript
// test/helpers/mock-factory.ts
export const mockPdfParse = (textContent: string) => {
  jest.mock('pdf-parse', () => jest.fn().mockResolvedValue({
    text: textContent,
    numpages: 1,
    numrender: 1
  }));
};
```

## Fixture Management

### HTML Fixtures
- Save real responses from restaurant websites
- Update fixtures when sites change
- Include edge cases (empty menus, special characters)

### Fixture Naming Convention
```
fixtures/
├── html/
│   ├── {restaurant}-{scenario}.html
│   ├── bricks-normal-menu.html
│   ├── bricks-empty-menu.html
│   └── bricks-weekend-menu.html
```

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: [
    '**/test/**/*.test.ts'
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/debug-*.ts'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.ts'],
  testTimeout: 10000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/test/unit/**/*.test.ts'],
      testTimeout: 1000
    },
    {
      displayName: 'integration',
      testMatch: ['**/test/integration/**/*.test.ts'],
      testTimeout: 5000
    },
    {
      displayName: 'contract',
      testMatch: ['**/test/contract/**/*.test.ts'],
      testTimeout: 15000,
      runner: './test/runners/contract-runner.js'
    }
  ]
};
```

## Makefile Integration

```makefile
# Test commands
test:
	npm run test:unit

test-unit:
	npm run test -- --testPathPattern=unit

test-integration:
	npm run test -- --testPathPattern=integration

test-contract:
	npm run test -- --testPathPattern=contract

test-e2e:
	npm run test -- --testPathPattern=e2e

test-all:
	npm run test:unit && npm run test:integration

test-coverage:
	npm test -- --coverage

test-watch:
	npm test -- --watch
```

## CI/CD Strategy

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      
  contract:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test:contract
```

## Benefits of This Strategy

1. **Fast Feedback**: Unit and integration tests run in < 5 seconds
2. **Reliable**: No external dependencies in main test suite
3. **Maintainable**: Clear separation of concerns and responsibilities
4. **Comprehensive**: Good coverage without being brittle
5. **CI-Friendly**: Fast tests run on every commit, slow tests run periodically
6. **Developer-Friendly**: Easy to run specific test types during development

## Migration Plan

1. **Phase 1**: Set up new directory structure and Jest configuration
2. **Phase 2**: Create unit tests for utility functions
3. **Phase 3**: Convert integration tests to use fixtures and mocks
4. **Phase 4**: Add contract tests for external dependencies
5. **Phase 5**: Remove old test files and update documentation
6. **Phase 6**: Set up CI/CD pipeline with appropriate test scheduling
