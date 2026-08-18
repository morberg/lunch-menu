.PHONY: start dev check deploy debug-%

start:
	npm start

dev:
	npm run dev

check:
	npm run check

deploy: check
	npx vercel --prod

debug-%:
	npx tsx debug/debug.ts $*
