# Makefile for lunch-menu-scraper

install:
	npm install

build:
	npm run build

start:
	npm start

test:
	npm test

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

deploy-vercel:
	npx vercel --prod
