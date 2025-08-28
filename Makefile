# Makefile for lunch-menu-scraper
# See AGENTS.md for development guidelines

install:
	npm install

build:
	npm run build

start:
	npm start

test:
	npm test

test-coverage:
	npm test -- --coverage

test-integration:
	npm test src/test/bricks.integration.test.ts

test-all-integration:
	npm test -- --testNamePattern="Integration"

test-bricks-live:
	npm run build && node dist/test/bricks.manual.test.js

test-edison-live:
	npm run build && node dist/test/edison.manual.test.js

test-kantin-live:
	npm run build && node dist/test/kantin.manual.test.js

test-grenden-live:
	npm run build && node dist/test/grenden.manual.test.js

test-smakapakina-live:
	npm run build && node dist/test/smakapakina.manual.test.js

test-all-live:
	npm run build && echo "Testing all scrapers..." && \
	node dist/test/bricks.manual.test.js && \
	node dist/test/edison.manual.test.js && \
	node dist/test/kantin.manual.test.js && \
	node dist/test/grenden.manual.test.js && \
	node dist/test/smakapakina.manual.test.js

clean:
	rm -rf node_modules dist

run-debug-edison:
	npm run build && node dist/debug-edison.js

run-debug-bricks:
	npm run build && node dist/debug-bricks.js

run-debug-kantin:
	npm run build && node dist/debug-kantin.js

run-debug-grenden:
	npm run build && node dist/debug-grenden.js

run-debug-smakapakina:
	npm run build && node dist/debug-smakapakina.js

run-debug-eatery:
	npm run build && node dist/debug-eatery.js

deploy:
	npx vercel --prod
