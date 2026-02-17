# Agent Guidelines

## General guidelines
- Avoid hardcoding
- Make sure tests are working when you have made changes, run with `make test`
- Always fix a problem before moving on to a new task
- Consider warnings as errors, keep the code clean
- Avoid warnings in included npm packages, update versions as needed
- Simple is good, try to keep the code as simple as possible
- Do not deploy code unless it is fully tested and committed to git

## Makefile First
- Always use Makefile targets for common tasks
- Add new targets when introducing new workflows
- Keep targets simple and descriptive (e.g., `make start`, `make deploy`)

## README Maintenance
- Keep README concise and focused
- Update when adding new features or restaurants
- Less is more - avoid unnecessary sections
- Ensure deployment links and setup instructions are current

## Node.js Execution
- This project uses TypeScript - always build before running
- Use `make start` (builds + runs) rather than direct `node` commands  
- Never run TypeScript files directly with `node`

## Project Structure
- Source files in `src/`
- Scrapers in `src/scrapers/`
- Web interface in `src/web/`
- Build output goes to `dist/`
