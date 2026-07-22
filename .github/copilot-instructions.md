# Agent Guidelines

## General guidelines
- Avoid hardcoding
- Make sure tests are working when you have made changes, run with `make test`
- Always fix a problem before moving on to a new task
- Consider warnings as errors, keep the code clean
- Avoid warnings in included npm packages, update versions as needed
- Simple is good, try to keep the code as simple as possible
- Do not deploy code unless it is fully tested and committed to git

## Debugging

- Run `make debug-scraper` (where scraper is the name of the scraper) to debug a scraper against a live web site

## Makefile First
- Always use Makefile targets for common tasks
- Add new targets when introducing new workflows
- Keep targets simple and descriptive (e.g., `make start`, `make deploy`)

## Documentation Maintenance
- Keep README concise and focused
- Update when adding new features or restaurants
- Less is more - avoid unnecessary sections
- Ensure deployment links and setup instructions are current
- Update API.md when endpoints, response types, field values, caching, or runtime behavior change
- Update relevant SKILL.md files when implementation workflows, shared utilities, contracts, or conventions change
- Update debug documentation when debug commands or workflows change
- After renaming or removing code concepts, search all documentation for stale names and examples

## Node.js Execution
- This project uses TypeScript - always build before running
- Use `make start` (builds + runs) rather than direct `node` commands  
- Never run TypeScript files directly with `node`

## Project Structure
- Source files in `src/`
- Scrapers in `src/scrapers/`
- Web interface in `src/web/`
- Build output goes to `dist/`
- Task-specific workflows live as skills in `.github/skills/` (e.g. adding a new restaurant scraper), not in this file

## TypeScript Conventions
- Use `as const` for all constant arrays (never `readonly T[]`)

## Continuous improvement

When you have completed a task, ALWAYS verify that README.md, API.md, relevant SKILL.md files,
debug documentation, and copilot-instructions.md are still accurate. Only edit documents affected
by the change, but explicitly report which were checked and which were updated.

If you used a SKILL.md workflow, verify that it worked as intended and update it when the task
exposed missing, stale, or incorrect guidance.

End your final output with some refactoring suggestions, preferably on how to reduce code and complexity.⏎