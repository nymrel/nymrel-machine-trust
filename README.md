# @nymrel/machine-trust

> **Dual-Audience Machine Trust & AI Search Discoverability Engine for Modern Web Applications**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Dual-Audience](https://img.shields.io/badge/Machine%20Trust-Verified-emerald)](https://nymrel.com)

`@nymrel/machine-trust` is an enterprise TypeScript library and CLI engine that equips modern web applications with verifiable **Dual-Audience Machine Trust** and AI search discoverability. It automates Schema.org JSON-LD entity graphs, standard `/llms.txt` and `/llms-full.txt` machine indexes, AI crawler policies (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`), and sub-second Answer-First executive summaries with zero DOM drift.

---

## The Dual-Audience Doctrine

Modern web applications must cater to two distinct audiences simultaneously:
1. **Human Visitors:** Visually stunning UX, rapid render times, high conversion design, and accessibility.
2. **Autonomous AI Agents & Search Engines:** Cryptographically verifiable machine trust, transparent entity hierarchy (`parentOrganization: Nymrel -> JalenBuilds LLC`), token-budgeted `/llms.txt` indexes, and zero discrepancy between rendered DOM and structured schema.

```
                    ┌────────────────────────┐
                    │    JalenBuilds LLC     │  (Parent Legal Entity)
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   Nymrel Umbrella      │  (Operating Umbrella)
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
┌───────────────────────────┐               ┌───────────────────────────┐
│     Human Audience        │               │   Autonomous AI Agents    │
│  - Warm Aesthetics        │               │  - Schema.org Graph       │
│  - Sub-second SSR         │               │  - /llms.txt Machine Index│
│  - Responsive Flow        │               │  - OAI-SearchBot Access   │
│  - Visible Pricing Copy   │               │  - DOM Parity Validation  │
└───────────────────────────┘               └───────────────────────────┘
```

---

## Key Features

- 🏛️ **Verifiable Schema.org JSON-LD Graph Generator:** Automatically crafts connected entity graphs for `Organization`, `WebSite`, `Product`, `Offer`, `SoftwareApplication`, `FAQPage`, and `BreadcrumbList` with canonical `parentOrganization` lineage.
- 🤖 **Standard `/llms.txt` & `/llms-full.txt` Engine:** Generates token-budgeted machine indexes allowing frontier models to ingest your architecture without context overflow.
- 🛡️ **Explicit AI Search Bot `robots.txt` Policies:** Pre-configured postures enabling discovery crawlers (`OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Googlebot`) while cleanly blocking aggressive model scrapers if desired.
- ⚡ **40-60 Word Answer-First Block Injector:** Injects executive summary snippets into HTML/SSR to satisfy instant question-answering heuristics of AI search engines.
- 🔍 **DOM Structured Data Consistency Validator:** Audits your rendered HTML to ensure prices, entity names, descriptions, and stock statuses in JSON-LD match visible DOM text, preventing search mismatch penalties.
- 📊 **100-Point Machine Trust Scorecard & CLI:** Terminal reporter and Markdown auditor evaluating overall machine trust readiness.

---

## Installation

```bash
# Using npm
npm install @nymrel/machine-trust

# Using pnpm
pnpm add @nymrel/machine-trust

# Using yarn
yarn add @nymrel/machine-trust
```

---

## CLI Usage

`@nymrel/machine-trust` includes a powerful standalone CLI:

```bash
# 1. Initialize a starter configuration
npx machine-trust init

# 2. Generate all assets (jsonld.json, llms.txt, robots.txt, answer-first block)
npx machine-trust generate --outDir ./public

# 3. Validate existing build artifacts and DOM parity
npx machine-trust validate --config ./machine-trust.config.json --html ./dist/index.html

# 4. Run a full 100-point audit and generate MACHINE_TRUST_SCORECARD.md
npx machine-trust audit --config ./machine-trust.config.json --html ./dist/index.html --report ./MACHINE_TRUST_SCORECARD.md
```

---

## Programmatic API Reference

### 1. Schema.org JSON-LD Generation

```typescript
import { generateJsonLd, generateJsonLdScriptTag } from '@nymrel/machine-trust';

const config = {
  entity: {
    name: 'Nymrel Service',
    legalName: 'Nymrel Service (a JalenBuilds LLC company)',
    url: 'https://service.nymrel.com',
    description: 'Autonomous cloud workflow engine.',
    email: 'contact@nymrel.com',
    parentOrganization: {
      name: 'Nymrel',
      legalName: 'Nymrel (a JalenBuilds LLC company)',
      url: 'https://nymrel.com',
      parentOrganization: {
        name: 'JalenBuilds LLC',
        legalName: 'JalenBuilds LLC',
        url: 'https://nymrel.com'
      }
    }
  },
  product: {
    name: 'Workflow Pro',
    description: 'High-throughput automation runner.',
    offers: {
      price: '29.00',
      priceCurrency: 'USD',
      availability: 'InStock'
    }
  }
};

// Returns raw Schema.org @graph object
const jsonLdGraph = generateJsonLd(config);

// Returns <script type="application/ld+json">...</script> string for SSR
const scriptTag = generateJsonLdScriptTag(config, { minify: true });
```

### 2. `/llms.txt` & `/llms-full.txt` Generation

```typescript
import { generateLlmsTxt, generateLlmsFullTxt } from '@nymrel/machine-trust';

const llmsTxt = generateLlmsTxt({
  title: 'Nymrel Service Documentation',
  summary: 'Autonomous cloud workflow engine with verified machine trust.',
  sections: [
    {
      title: 'API Endpoints',
      links: [
        {
          title: 'Purchasing Interface',
          url: 'https://service.nymrel.com/api/buy',
          description: 'Autonomous agent checkout endpoint.'
        }
      ]
    }
  ],
  tokenBudget: 3000
});
```

### 3. AI Search `robots.txt` Generation

```typescript
import { generateRobotsTxt } from '@nymrel/machine-trust';

const robotsTxt = generateRobotsTxt({
  sitemapUrl: 'https://service.nymrel.com/sitemap.xml',
  host: 'service.nymrel.com',
  posture: 'allow_ai_search_disallow_training' // Permits OAI-SearchBot & Perplexity, restricts scrapers
});
```

### 4. Answer-First SSR Summary Block

```typescript
import { generateAnswerFirstHtml, injectAnswerFirstBlock } from '@nymrel/machine-trust';

const htmlSnippet = generateAnswerFirstHtml({
  summary: 'Nymrel Service provides real-time autonomous cloud orchestration with verified parent entity lineage to JalenBuilds LLC, enabling AI agents to query APIs and transact automatically.',
  entityName: 'Nymrel',
  keyTakeaways: [
    'Sub-50ms execution latency',
    'Verifiable Schema.org entity hierarchy',
    'OpenAI OAI-SearchBot indexing enabled'
  ]
});

// Or inject directly into SSR HTML stream
const fullHtml = injectAnswerFirstBlock(rawHtml, {
  summary: 'Nymrel Service provides real-time autonomous cloud orchestration...',
  entityName: 'Nymrel'
});
```

### 5. DOM Structured Data Consistency Validation

```typescript
import { verifyDomConsistency } from '@nymrel/machine-trust';

const validation = verifyDomConsistency(jsonLdGraph, renderedHtml);

if (!validation.consistent) {
  console.error('DOM Mismatch detected:', validation.checks);
} else {
  console.log(`DOM Parity Score: ${validation.score}/100`);
}
```

---

## Framework Integration Recipes

### Next.js (App Router `app/layout.tsx`)

```tsx
import { generateJsonLdScriptTag, generateAnswerFirstHtml } from '@nymrel/machine-trust';
import { machineTrustConfig } from '@/config/machine-trust';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLdScript = generateJsonLdScriptTag(machineTrustConfig);

  return (
    <html lang="en">
      <head>
        <div dangerouslySetInnerHTML={{ __html: jsonLdScript }} />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

### Astro (`src/layouts/Layout.astro`)

```astro
---
import { generateJsonLd, generateAnswerFirstHtml } from '@nymrel/machine-trust';
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

---

## 100-Point Machine Trust Scorecard Benchmark

When running `machine-trust audit`, your site is scored against the Nymrel 100-point benchmark:

| Category | Target Criteria | Weight |
| :--- | :--- | :---: |
| **Entity Graph** | Valid Schema.org `@graph` + nested `parentOrganization` (Nymrel -> JalenBuilds LLC) | 30 pts |
| **LLMs.txt** | Categorized `/llms.txt` + `/llms-full.txt` under strict token budget | 15 pts |
| **Robots.txt** | Explicit `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot` discovery permissions | 20 pts |
| **Answer-First** | 40-60 word executive summary block answering core user intent | 15 pts |
| **DOM Parity** | 100% price, entity, description, and currency consistency with visible HTML | 20 pts |

---

## Governance & License

- **Entity Owner:** Nymrel / JalenBuilds LLC
- **Contact:** `contact@nymrel.com`
- **License:** MIT (see [LICENSE](./LICENSE))
