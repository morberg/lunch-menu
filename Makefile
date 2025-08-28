# Makefile for lunch-menu-scraper
# See AGENTS.md for development guidelines

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

test-watch:
	npm test -- --watch

test-coverage:
	npm test -- --coverage

# Cache management (requires server to be running)
cache-status:
	@echo "Checking cache status..."
	@curl -s http://localhost:3000/api/menus/cache-status | jq '.' || echo "Server may not be running on port 3000"

refresh-cache:
	@echo "Manually refreshing menu cache..."
	@curl -s -X POST http://localhost:3000/api/menus/refresh | jq '.' || echo "Server may not be running on port 3000"

clean:
	rm -rf node_modules dist

deploy:
	npx vercel --prod
