# @nymrel/machine-trust

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%E2%89%A518-green)](https://nodejs.org)

Your site has two audiences: the people who visit it and the automated systems that read it. `@nymrel/machine-trust` generates an inspectable machine-readable layer—Schema.org JSON-LD, `/llms.txt` indexes, and declared crawler rules—then reports observable inconsistencies between that configuration and supplied rendered HTML. It does not promise indexing, rankings, citations, recommendations, traffic, or revenue.

---

## 60-second quickstart

```bash
# 1. From this checkout
npm install
npm run build

# 2. Create a starter config, then generate the machine-readable assets
node ./bin/machine-trust.js init
node ./bin/machine-trust.js generate --outDir ./public

# 3. Audit your built page against its structured data
node ./bin/machine-trust.js audit --config ./machine-trust.config.json --html ./dist/index.html
```

The audit prints a scorecard in your terminal and writes
`MACHINE_TRUST_SCORECARD.md` next to your config. Exit code is `0` when every
check passes and `1` otherwise, so it drops straight into CI.

A minimal developer example lives in [`examples/minimal-site`](./examples/minimal-site).
The buyer-readable, deterministic specimen is
[`specimens/halcyon-coffee`](./specimens/halcyon-coffee), with productized audit
scope in [`docs/productized-audit.md`](./docs/productized-audit.md).

---

## What it checks

| Check | What it verifies | Weight |
| :--- | :--- | :---: |
| **JSON-LD entity graph** | Valid Schema.org `@graph` with only explicit relationships; no corporate parent is invented | 30 pts |
| **llms.txt** | Structured `/llms.txt` and `/llms-full.txt` machine indexes within their token budget | 15 pts |
| **AI crawler policy** | `robots.txt` declares the configured posture for named crawlers; actual crawler behavior is outside the audit | 20 pts |
| **Answer-first summary** | A 40–60 word executive summary block that answers the core question up front | 15 pts |
| **DOM parity** | Supplied prices, names, and descriptions are checked against supplied rendered text | 20 pts |

Total: 100 points, graded A+ through F. Not covered yet: canonical URL and
Open Graph tag validation.

---

## Installation status

This repository is usable from a local checkout. This README does not assert
that an npm registry release exists; publication requires a separate release
receipt.

Requires Node.js >= 18.

## CLI

```
machine-trust init [path]        Generate a starter machine-trust.config.json
machine-trust generate           Write jsonld.json, llms.txt, llms-full.txt,
  [-o dir]                         robots.txt, and the answer-first snippet
machine-trust validate           Print the scorecard without writing a report
  [-c file] [--html file]
  machine-trust audit              Validate and write MACHINE_TRUST_SCORECARD.md
  [-c file] [--html file]         (--report overrides the output path)
  [--report file]
  [--fixed-timestamp ISO]          Produce a reproducible scorecard timestamp
```

## Programmatic API

### Schema.org JSON-LD generation

```typescript
import { generateJsonLd, generateJsonLdScriptTag } from '@nymrel/machine-trust';

const jsonLdGraph = generateJsonLd(config);            // raw @graph object
const scriptTag = generateJsonLdScriptTag(config, { minify: true }); // SSR-ready <script> string
```

When `entity.parentOrganization` is omitted, no corporate lineage is asserted.
Legitimate caller-supplied parent relationships are kept explicit. A built or
partner property may opt into Nymrel attribution with
`entity.nymrelAttribution: true`; this emits only
`creator: { "@id": "https://nymrel.com/#organization" }`. Nymrel itself is one
Organization node with `name: "Nymrel"` and `legalName: "JalenBuilds LLC"`, not
a subsidiary chain. `validateNymrelLineage(graph)` returns deterministic,
machine-readable findings for those rules.

### /llms.txt generation

```typescript
import { generateLlmsTxt, generateLlmsFullTxt, parseLlmsTxt } from '@nymrel/machine-trust';

const llmsTxt = generateLlmsTxt({
  title: 'Acme Documentation',
  summary: 'What this site does, in one paragraph.',
  sections: [
    {
      title: 'Products',
      links: [
        { title: 'Widget Pro', url: 'https://acme.example/widget', description: 'Price, stock, specs.' }
      ]
    }
  ],
  tokenBudget: 3000
});
```

### robots.txt policies

```typescript
import { generateRobotsTxt, parseRobotsTxt, auditCrawlerAccess } from '@nymrel/machine-trust';

const robotsTxt = generateRobotsTxt({
  sitemapUrl: 'https://acme.example/sitemap.xml',
  host: 'acme.example',
  posture: 'allow_ai_search_disallow_training' // also: allow_all | restrict_training_only | deny_all
});
```

### Answer-first summary block

```typescript
import { generateAnswerFirstHtml, injectAnswerFirstBlock } from '@nymrel/machine-trust';

const html = injectAnswerFirstBlock(rawHtml, {
  summary: 'A 40-60 word answer to the core question your page resolves.',
  entityName: 'Acme'
});
```

Injection order: explicit `<!-- MACHINE_TRUST_ANSWER_FIRST -->` placeholder,
then `targetSelector`, then after `</h1>`, then after `<main>`/`<body>`.

### DOM drift validation

```typescript
import { verifyDomConsistency } from '@nymrel/machine-trust';

const result = verifyDomConsistency(jsonLdGraph, renderedHtml);
// result.consistent, result.score (0-100), result.checks[]
```

### Full audit

```typescript
import { runMachineTrustAudit, formatCliReport, generateMarkdownScorecard } from '@nymrel/machine-trust';

const scorecard = runMachineTrustAudit(config, renderedHtml, {
  fixedTimestamp: '2026-08-23T16:00:00.000Z'
});
console.log(formatCliReport(scorecard));
fs.writeFileSync('MACHINE_TRUST_SCORECARD.md', generateMarkdownScorecard(scorecard));
```

## Framework integration

### Next.js (App Router)

```tsx
import { generateJsonLd } from '@nymrel/machine-trust';
import { machineTrustConfig } from '@/config/machine-trust';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = generateJsonLd(machineTrustConfig);

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
```

### Astro

```astro
---
import { generateJsonLd } from '@nymrel/machine-trust';
import { siteConfig } from '../site.config';

const jsonLd = generateJsonLd(siteConfig);
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
  </head>
  <body>
    <slot />
  </body>
</html>
```

## Productized audit

The on-request audit turns a public site and operator-supplied configuration
into a reproducible evidence packet: generated assets, a scorecard, exact
input/output hashes, findings, and explicit limitations. It is an inspection
service, not a ranking or traffic promise. See
[`docs/productized-audit.md`](./docs/productized-audit.md) and the fictional
[`Halcyon Coffee specimen`](./specimens/halcyon-coffee/README.md).

## Development

```bash
npm install       # development dependencies are declared in package.json
npm run build     # tsc -> dist/
npm test          # node:test suite via test/runner.js
npm run lint      # tsc --noEmit
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for principles and workflow.

## Governance & License

- **Maintained by:** Nymrel
- **Contact:** `contact@nymrel.com`
- **License:** MIT (see [LICENSE](./LICENSE))
