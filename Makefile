# Makefile for lunch-menu-scraper
# See AGENTS.md for development guidelines

.PHONY: install build start dev test test-watch test-coverage test-contract test-all cache-status refresh-cache clean deploy

install:
	npm install

build:
	npm run build

start:
	npm start

# Development server with auto-reload
dev:
	npm run dev

# Test commands
# - test: Fast unit/integration/e2e tests (default)
# - test-contract: Slow contract tests with external dependencies  
# - test-all: Run both fast and contract tests
test:
	npm test

test-watch:
	npm test -- --watch

test-coverage:
	npm test -- --coverage

test-contract:
	@echo "Running contract tests (may be slow due to external dependencies)..."
	npx jest --config jest.contract.config.js

test-all:
	@echo "Running all tests including contract tests..."
	npx jest --config jest.contract.config.js && npm test

# Cache management (requires server to be running)
cache-status:
	@echo "Checking cache status..."
	@curl -s http://localhost:3000/api/menus/cache-status | jq '.' || echo "Server may not be running on port 3000"

refresh-cache:
	@echo "Manually refreshing menu cache..."
	@curl -s -X POST http://localhost:3000/api/menus/refresh | jq '.' || echo "Server may not be running on port 3000"

# Debug targets for individual scrapers
# The 'eatery' and 'edison' targets are placeholders to allow 'make debug eatery' or 'make debug edison'.
# The actual debug logic is handled by the 'debug' target above, which checks which scraper was requested.
debug:
	@if [ "$(filter eatery,$(MAKECMDGOALS))" ]; then \
		npx ts-node --transpile-only test/eatery-scraper-debug.ts; \
	elif [ "$(filter edison,$(MAKECMDGOALS))" ]; then \
		echo "Debug script for edison not implemented yet."; \
	else \
		echo "Usage: make debug <scraper> (e.g. eatery, edison)"; \
	fi

eatery:

edison:

clean:
	rm -rf node_modules dist

deploy:
	npx vercel --prod
