# Example: minimal product site

A complete worked example: a one-page shop for a fictional notebook brand
("Aurora Notebooks") with its `machine-trust.config.json`, a rendered
`index.html`, and the exact output the CLI produces from them.

## Run it yourself

From the repository root (build once if you haven't: `npm run build`):

```bash
# 1. Generate the machine-trust assets (jsonld.json, llms.txt, llms-full.txt, robots.txt, answer-first snippet)
node bin/machine-trust.js generate -c examples/minimal-site/machine-trust.config.json -o examples/minimal-site/expected-output

# 2. Audit the config against the rendered page and write the scorecard
node bin/machine-trust.js audit -c examples/minimal-site/machine-trust.config.json --html examples/minimal-site/index.html --report examples/minimal-site/expected-output/MACHINE_TRUST_SCORECARD.md
```

The audit exits `0` and scores this fixture **100/100 (Grade A+)** — 6 checks
passed, 0 warnings, 0 failed. Every file in [`expected-output/`](./expected-output)
is committed real CLI output, so you can diff your own run against it. The only
line that will differ is the scorecard's `Generated:` timestamp.

## What each file shows

| File | What it demonstrates |
| :--- | :--- |
| `machine-trust.config.json` | The single source of truth: entity, product + offer, llms.txt sections, robots posture, answer-first summary. |
| `index.html` | A plain rendered page whose visible text (name, price, description) matches the structured data — that's what DOM parity validates. |
| `expected-output/jsonld.json` | The generated Schema.org `@graph`: Organization, WebSite, Product with Offer. |
| `expected-output/llms.txt` / `llms-full.txt` | Token-budgeted machine indexes built from the `llmsTxt` config section. |
| `expected-output/robots.txt` | The `allow_ai_search_disallow_training` posture: AI search crawlers permitted, training scrapers disallowed. |
| `expected-output/answer-first-snippet.html` | The 47-word executive summary block ready to inject into SSR output. |
| `expected-output/MACHINE_TRUST_SCORECARD.md` | The full 100-point audit report. |

## Note on default lineage

The generator injects a canonical `parentOrganization` chain
(`Nymrel` → `JalenBuilds LLC`) when your `entity` does not define one — you can
see it in `expected-output/jsonld.json`. To declare your own parent entity,
set `entity.parentOrganization` in your config and that value is used instead.
