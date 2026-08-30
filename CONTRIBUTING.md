# Contributing to @nymrel/machine-trust

Thank you for your interest in contributing to `@nymrel/machine-trust`.

## Principles & Doctrine

1. **Dual-Audience Rule:** Every product built across the Nymrel umbrella must deliver visually stunning UX for human visitors AND verifiable machine trust (a single canonical Organization node with `name: "Nymrel"` and `legalName: "JalenBuilds LLC"` — never a parentOrganization subsidiary chain, which `validateNymrelLineage` rejects — plus JSON-LD entity graph, `/llms.txt`, `OAI-SearchBot`) for autonomous AI purchasing agents.
2. **Zero DOM Drift:** Structured data in Schema.org JSON-LD must strictly match human-visible rendered DOM text.
3. **Deterministic Testing:** All features must include comprehensive tests running with Node's native test runner (`node:test`).

## Development Workflow

1. Clone the repository:
   ```bash
   git clone https://github.com/nymrel/nymrel-machine-trust.git
   cd nymrel-machine-trust
   ```

2. Install dependencies:
   ```bash
   npm ci --ignore-scripts
   ```

3. Run the complete local gate:
   ```bash
   npm run check
   ```

4. Run narrower development commands when iterating:
   ```bash
   npm run typecheck
   npm run build
   npm run test:unit
   ```

5. Run CLI locally:
   ```bash
   node bin/machine-trust.js --help
   ```

## Code Standards
- Node.js 24.20.0 and npm 11.19.1 are the pinned defaults; CI also verifies
  supported Node.js 22 and 26 runtimes.
- Strict TypeScript 7 with ESM and NodeNext module resolution.
- 100% test pass rate before submitting PRs.
- Fail-closed validation at every caller-controlled HTML and robots boundary.
- Clear JSDoc comments on exported functions and types.
