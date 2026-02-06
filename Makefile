# Makefile for lunch-menu-scraper

.PHONY: install build start dev clean deploy test snapshots

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

snapshots: build
	node dist/scripts/update-snapshots.js

clean:
	rm -rf node_modules dist

deploy: build
	npx vercel --prod
