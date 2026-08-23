# Halcyon Coffee Roasters specimen

Evidence class: **synthetic fixture only**

Halcyon Coffee Roasters, Dawn Blend, all contact details, and every .example
URL in this directory are fictional. This specimen demonstrates the shape of a
reproducible Machine Trust audit packet; it is not a customer result or a live
site claim.

## What the packet proves

- identical inputs plus the fixed fixture timestamp generate byte-identical
  outputs;
- the generic organization receives no invented corporate parent;
- input and output hashes bind the evidence packet;
- the deliberately short answer-first summary is retained as a nonfatal
  warning, while the audit exits successfully with zero failures.

## Reproduce

From the repository root:

    npm run build
    node specimens/halcyon-coffee/generate.mjs

Run the generator twice and compare the output directory. The committed
[output/provenance.json](./output/provenance.json) names every hashed input and
generated file.

## Limits

This packet contains no live crawler, indexing, ranking, citation, traffic,
customer, revenue, legal, or production evidence. It does not demonstrate a
search-engine or AI-provider outcome. Commercial scope remains on request at
contact@nymrel.com; no price or payment flow is present here.
