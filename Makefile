# Makefile for lunch-menu-scraper
# See AGENTS.md for development guidelines

install:
	npm install

build:
	npm run build

start:
	npm start

# Test commands
test:
	npm test

test-watch:
	npm test -- --watch

test-coverage:
	npm test -- --coverage

clean:
	rm -rf node_modules dist

deploy:
	npx vercel --prod
