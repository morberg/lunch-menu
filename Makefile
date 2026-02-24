# Makefile for lunch-menu-scraper

.PHONY: install build start dev clean deploy test snapshots debug-% profile-scrapers

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
	@echo "Tip: run 'make snapshots' to refresh fixtures/expected outputs when tests fail."

snapshots: build
	node dist/scripts/update-snapshots.js

debug-%:
	npx tsx debug/debug-$*.ts

profile-scrapers:
	npx tsx debug/profile-scrapers.ts

clean:
	rm -rf node_modules dist

deploy: build
	npx vercel --prod
