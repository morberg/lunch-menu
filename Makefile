# Makefile for lunch-menu-scraper

.PHONY: install build start dev clean deploy test lint setup debug-% profile-scrapers

install:
	npm install

setup: install
	cp -n .git/hooks/pre-commit .git/hooks/pre-commit.bak 2>/dev/null || true
	printf '#!/bin/sh\necho "Running lint before commit..."\nnpm run lint\necho "Running tests before commit..."\nnpm test\n' > .git/hooks/pre-commit
	chmod +x .git/hooks/pre-commit
	@echo "Git hooks installed."

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

lint:
	npm run lint

debug-%:
	npx tsx debug/debug.ts $*

profile-scrapers:
	npx tsx debug/profile-scrapers.ts

clean:
	rm -rf node_modules dist

deploy: build
	npx vercel --prod
