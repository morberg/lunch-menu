# Makefile for lunch-menu-scraper

.PHONY: install build start dev cache-status refresh-cache clean deploy test test-acceptance

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
test:
	npm test

test-acceptance:
	npm run test:acceptance

# Cache management (requires server to be running)
cache-status:
	@echo "Checking cache status..."
	@curl -s http://localhost:3000/api/menus/cache-status | jq '.' || echo "Server may not be running on port 3000"

refresh-cache:
	@echo "Manually refreshing menu cache..."
	@curl -s -X POST http://localhost:3000/api/menus/refresh | jq '.' || echo "Server may not be running on port 3000"

clean:
	rm -rf node_modules dist

deploy: build
	npx vercel --prod
