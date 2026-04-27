# Makefile for lunch-menu-scraper

.PHONY: install build start dev clean deploy test debug-% profile-scrapers

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

debug-%:
	npx tsx debug/debug.ts $*

profile-scrapers:
	npx tsx debug/profile-scrapers.ts

clean:
	rm -rf node_modules dist

deploy: build
	npx vercel --prod
