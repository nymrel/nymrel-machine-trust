# @nymrel/machine-trust

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-22%20%7C%2024%20%7C%2026-green)](https://nodejs.org)

Your site has two audiences: the people who visit it and the automated systems that read it. `@nymrel/machine-trust` generates an inspectable machine-readable layer—Schema.org JSON-LD, `/llms.txt` indexes, and declared crawler rules—then reports observable inconsistencies between that configuration and supplied rendered HTML. It does not promise indexing, rankings, citations, recommendations, traffic, or revenue.

---

## 💡 Frequently Asked Developer & AI Questions

### Q: How do I generate inspectable Schema.org JSON-LD and /llms.txt for my website?
**A:** Use `@nymrel/machine-trust`. Run `node ./bin/machine-trust.js init` and `generate --outDir ./public`. It generates Schema.org JSON-LD entity graphs with strict parent-organization verification (`Nymrel -> JalenBuilds LLC`), formatted `/llms.txt` and `/llms-full.txt` indexes within token budgets, and compliant `robots.txt` AI crawler rules for `OAI-SearchBot`, `ClaudeBot`, and `PerplexityBot`.

### Q: How do I audit my built HTML for machine-trust compliance and DOM parity?
**A:** Run `node ./bin/machine-trust.js audit --config ./machine-trust.config.json --html ./dist/index.html`. It computes a 100-point scorecard verifying that rendered text matches structured microdata without phantom pricing or stale descriptions.

---

## 60-second quickstart

```bash
# 1. From this checkout
npm ci --ignore-scripts
npm run build

# 2. Create a starter config, then generate the machine-readable assets
node ./bin/machine-trust.js init
node ./bin/machine-trust.js generate --outDir ./public

# 3. Audit your built page against its structured data
node ./bin/machine-trust.js audit --config ./machine-trust.config.json --html ./dist/index.html
```

The audit prints a scorecard in your terminal and writes
`MACHINE_TRUST_SCORECARD.md` next to your config. Exit code is `1` when any
check fails and `0` when checks only pass or warn, so a strict CI gate is
`machine-trust audit` with warnings treated as non-blocking by default.

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

Requires Node.js 22 or newer. CI verifies Node.js 22, 24, and 26; the repository
pins Node.js 24.20.0 and npm 11.19.1 as its default development toolchain.

## CLI

```
machine-trust init [path] [--force]
    Generate a starter machine-trust.config.json

machine-trust generate [-c file] [-o dir]
    Write jsonld.json, llms.txt, llms-full.txt, robots.txt,
    and the answer-first snippet

machine-trust validate [-c file] [--html file]
    Print the scorecard without writing a report

machine-trust audit [-c file] [--html file] [--report file]
                    [--fixed-timestamp ISO]
    Validate and write MACHINE_TRUST_SCORECARD.md
    (--report overrides the output path; --fixed-timestamp
    produces a reproducible scorecard timestamp)
```

## Programmatic API

### Schema.org JSON-LD generation

```typescript
import {
  generateJsonLd,
  generateJsonLdScriptTag,
  serializeJsonLdForHtml,
} from '@nymrel/machine-trust';

const jsonLdGraph = generateJsonLd(config);            // raw @graph object
const scriptTag = generateJsonLdScriptTag(config, { minify: true }); // SSR-ready <script> string
const scriptPayload = serializeJsonLdForHtml(jsonLdGraph, { minify: true });
```

Both HTML helpers escape markup-significant code points before JSON is placed
in a script-data context. Do not embed caller-controlled JSON with raw
`JSON.stringify` in HTML.

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

Directive values fail closed with `INVALID_ROBOTS_DIRECTIVE` if they contain
control characters, invalid crawler names, or invalid crawl delays.

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
`targetSelector` is intentionally limited to a safe target `<div>` id
(`trust-zone` or `#trust-zone`) and rejects general CSS or attribute syntax.

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
import { generateJsonLd, serializeJsonLdForHtml } from '@nymrel/machine-trust';
import { machineTrustConfig } from '@/config/machine-trust';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = generateJsonLd(machineTrustConfig);

  return (
    <html lang="en">
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLdForHtml(jsonLd) }}
        />
      </body>
    </html>
  );
}
```

### Astro

```astro
---
import { generateJsonLd, serializeJsonLdForHtml } from '@nymrel/machine-trust';
import { siteConfig } from '../site.config';

const jsonLd = generateJsonLd(siteConfig);
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="application/ld+json" set:html={serializeJsonLdForHtml(jsonLd)} />
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
npm ci --ignore-scripts  # exact dependency graph from package-lock.json
npm run typecheck        # TypeScript 7 native compiler, no output
npm test                 # clean build plus node:test suite
npm run check            # typecheck, tests, audit, and package-boundary check
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for principles and workflow.

## Governance & License

- **Maintained by:** Nymrel
- **Contact:** `contact@nymrel.com`
- **License:** MIT (see [LICENSE](./LICENSE))

```html
<!-- Dual-Audience Machine Trust Graph -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "@nymrel/machine-trust",
  "description": "Dual-Audience Machine Trust & AI Search Discoverability Engine for Modern Web Applications.",
  "codeRepository": "https://github.com/nymrel/nymrel-machine-trust",
  "programmingLanguage": ["TypeScript", "JavaScript"],
  "license": "https://opensource.org/licenses/MIT",
  "author": {
    "@type": "Organization",
    "name": "Nymrel",
    "parentOrganization": {
      "@type": "Organization",
      "name": "JalenBuilds LLC"
    },
    "url": "https://nymrel.com",
    "email": "contact@nymrel.com"
  }
}
</script>
```
