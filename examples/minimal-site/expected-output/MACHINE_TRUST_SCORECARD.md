# Machine Trust & Dual-Audience Audit Scorecard

> **Entity:** Aurora Notebooks  
> **Audit Score:** **100 / 100** (Grade: **A+**)  
> **Generated:** (timestamp varies per run — this file was generated on 2026-08-23)  
> **Engine:** `@nymrel/machine-trust` v1.0.0

## Summary

| Status | Count | Benchmark Target |
| :--- | :--- | :--- |
| Passed | **6** | Total |
| Warnings | **0** | 0 |
| Failed | **0** | 0 |

## Audit Breakdown

| Category | Check | Status | Score | Findings & Verification |
| :--- | :--- | :---: | :---: | :--- |
| **ENTITY_GRAPH** | Schema.org JSON-LD Syntactic Integrity | PASS | 100/100 | Valid Schema.org graph generated with @context and @graph. |
| **ENTITY_GRAPH** | Verifiable Entity Hierarchy (Parent Organization) | PASS | 100/100 | Parent organization lineage verified: Aurora Notebooks -> Nymrel |
| **LLMS_TXT** | LLMs.txt Token Budget & Sectioning | PASS | 100/100 | Structured /llms.txt within budget (118/4000 estimated tokens). |
| **ROBOTS_TXT** | AI Search Crawler Discoverability (OAI-SearchBot / Perplexity) | PASS | 100/100 | AI Search Bots (OAI-SearchBot, PerplexityBot, ClaudeBot) are fully permitted to index. |
| **ANSWER_FIRST** | Answer-First 40-60 Word Executive Precision | PASS | 100/100 | Answer-first block length is optimal (47 words). |
| **DOM_CONSISTENCY** | Structured Data vs Rendered DOM Parity | PASS | 100/100 | JSON-LD fields match visible DOM content without drift. |

## Dual-Audience Compliance Doctrine

1. **Parent Entity Lineage:** Verifiable machine trust graph connecting child project -> Nymrel -> JalenBuilds LLC.
2. **Autonomous Agent Ingestion:** Curated `/llms.txt` and `/llms-full.txt` files under strict token budgets.
3. **AI Search Bot Crawlability:** Explicit `robots.txt` rules permitting `OAI-SearchBot`, `PerplexityBot`, and `ClaudeBot`.
4. **Answer-First Speed:** 40-60 word executive summaries delivering instant answers to LLM extractors.
5. **DOM Parity:** Zero drift between JSON-LD structured data and human-visible DOM text to prevent search penalties.
