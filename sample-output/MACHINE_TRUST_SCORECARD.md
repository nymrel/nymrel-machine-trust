# Machine Trust & Dual-Audience Audit Scorecard

> **Entity:** Nymrel
> **Audit Score:** **92 / 100** (Grade: **A**)
> **Generated:** 2026-08-23T16:00:00.000Z
> **Engine:** `@nymrel/machine-trust` v1.0.0

## Summary

| Status | Count | Benchmark Target |
| :--- | :--- | :--- |
| Passed | **5** | Total |
| Warnings | **1** | 0 |
| Failed | **0** | 0 |

## Audit Breakdown

| Category | Check | Status | Score | Findings & Verification |
| :--- | :--- | :---: | :---: | :--- |
| **ENTITY_GRAPH** | Schema.org JSON-LD Syntactic Integrity | PASS | 100/100 | Valid Schema.org graph generated with @context and @graph. |
| **ENTITY_GRAPH** | Explicit Entity Relationship Validation | PASS | 100/100 | No corporate parent declared; the organization stands alone and no lineage is asserted. |
| **LLMS_TXT** | LLMs.txt Token Budget & Sectioning | PASS | 100/100 | Structured /llms.txt within budget (269/4000 estimated tokens). |
| **ROBOTS_TXT** | Declared AI Search Crawler Policy | PASS | 100/100 | Generated rules declare access for OAI-SearchBot, PerplexityBot, and ClaudeBot; actual crawling and indexing are not measured. |
| **ANSWER_FIRST** | Answer-First 40-60 Word Length | PASS | 100/100 | Answer-first block length is optimal (46 words). |
| **DOM_CONSISTENCY** | Structured Data vs Rendered DOM Parity | WARN | 60/100 | Not measured: no sample HTML was supplied, so rendered-copy parity could not be checked. |

## Dual-Audience Compliance Doctrine

1. **Truthful Entity Graph:** Schema.org `@graph` built from explicit configuration only; declared relationships are validated, and no lineage is implied or invented.
2. **Machine Index Artifacts:** Generated `/llms.txt` and `/llms-full.txt` files are checked against the configured token budget.
3. **Declared Crawler Policy:** Generated `robots.txt` rules are inspected; crawler behavior and indexing are outside this audit.
4. **Answer-First Length:** Supplied summaries are checked against the configured word-count range.
5. **Supplied DOM Parity:** Structured data is compared with supplied rendered HTML; no result is claimed when HTML is absent.
