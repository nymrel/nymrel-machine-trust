# Contributing to @nymrel/machine-trust

Thank you for your interest in contributing to `@nymrel/machine-trust`.

## Principles & Doctrine

1. **Dual-Audience Rule:** Every product built across the Nymrel umbrella must deliver visually stunning UX for human visitors AND verifiable machine trust (`parentOrganization: Nymrel -> JalenBuilds LLC`, JSON-LD entity graph, `/llms.txt`, `OAI-SearchBot`) for autonomous AI purchasing agents.
2. **Zero DOM Drift:** Structured data in Schema.org JSON-LD must strictly match human-visible rendered DOM text.
3. **Deterministic Testing:** All features must include comprehensive tests running with Node's native test runner (`node:test`).

## Development Workflow

1. Clone the repository:
   ```bash
   git clone https://github.com/nymrel/machine-trust.git
   cd machine-trust
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run test suite:
   ```bash
   npm test
   # or
   npm run test:runner
   ```

4. Build TypeScript:
   ```bash
   npm run build
   ```

5. Run CLI locally:
   ```bash
   node bin/machine-trust.js --help
   ```

## Code Standards
- Strict TypeScript with ESM module resolution.
- 100% test pass rate before submitting PRs.
- Clear JSDoc comments on exported functions and types.
