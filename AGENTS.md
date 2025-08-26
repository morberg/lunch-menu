# Agent Guidelines

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
- For debugging individual scrapers: `make run-debug-{restaurant}`
- Never run TypeScript files directly with `node`

## Project Structure
- Source files in `src/`
- Scrapers in `src/scrapers/`
- Web interface in `src/web/`
- Build output goes to `dist/`
