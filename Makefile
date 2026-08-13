# Makefile for lunch-menu-scraper

.PHONY: install build start dev clean deploy test lint check setup debug-%

install:
	npm install

setup: install
	cp -n .git/hooks/pre-commit .git/hooks/pre-commit.bak 2>/dev/null || true
	printf '#!/bin/sh\nset -e\nmake check\n' > .git/hooks/pre-commit
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

check:
	npm run check

debug-%:
	npx tsx debug/debug.ts $*

clean:
	rm -rf node_modules dist

deploy: check
	npx vercel --prod
