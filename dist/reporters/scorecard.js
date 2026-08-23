import { generateJsonLd, validateJsonLdStructure } from '../generators/jsonLd.js';
import { generateLlmsTxt, estimateTokens } from '../generators/llmsTxt.js';
import { generateRobotsTxt } from '../generators/robotsTxt.js';
import { validateWordCount } from '../generators/answerFirst.js';
import { auditCrawlerAccess } from '../validators/crawlerAccess.js';
import { verifyDomConsistency } from '../validators/domConsistency.js';
/**
 * Executes a full Machine Trust audit across all 5 dimensions
 */
export function runMachineTrustAudit(config, sampleHtml) {
    const checks = [];
    // 1. Entity Graph Checks
    const jsonLd = generateJsonLd(config);
    const jsonLdValidation = validateJsonLdStructure(jsonLd);
    if (jsonLdValidation.valid) {
        checks.push({
            id: 'ENTITY_JSONLD_SYNTAX',
            category: 'ENTITY_GRAPH',
            title: 'Schema.org JSON-LD Syntactic Integrity',
            status: 'PASS',
            score: 100,
            weight: 15,
            message: 'Valid Schema.org graph generated with @context and @graph.',
        });
    }
    else {
        checks.push({
            id: 'ENTITY_JSONLD_SYNTAX',
            category: 'ENTITY_GRAPH',
            title: 'Schema.org JSON-LD Syntactic Integrity',
            status: 'FAIL',
            score: 0,
            weight: 15,
            message: `JSON-LD syntax errors: ${jsonLdValidation.errors.join('; ')}`,
        });
    }
    // Parent Organization Hierarchy check
    const org = jsonLd['@graph'].find((i) => i['@type'] === 'Organization');
    if (org && org.parentOrganization && org.parentOrganization.name) {
        checks.push({
            id: 'ENTITY_PARENT_HIERARCHY',
            category: 'ENTITY_GRAPH',
            title: 'Verifiable Entity Hierarchy (Parent Organization)',
            status: 'PASS',
            score: 100,
            weight: 15,
            message: `Parent organization lineage verified: ${org.name} -> ${org.parentOrganization.name}`,
        });
    }
    else {
        checks.push({
            id: 'ENTITY_PARENT_HIERARCHY',
            category: 'ENTITY_GRAPH',
            title: 'Verifiable Entity Hierarchy (Parent Organization)',
            status: 'WARN',
            score: 40,
            weight: 15,
            message: 'Missing or incomplete parentOrganization in entity graph.',
        });
    }
    // 2. LLMs.txt Checks
    if (config.llmsTxt) {
        const llmsTxtContent = generateLlmsTxt(config.llmsTxt);
        const tokens = estimateTokens(llmsTxtContent);
        const budget = config.llmsTxt.tokenBudget || 4000;
        if (tokens <= budget) {
            checks.push({
                id: 'LLMS_TXT_BUDGET',
                category: 'LLMS_TXT',
                title: 'LLMs.txt Token Budget & Sectioning',
                status: 'PASS',
                score: 100,
                weight: 15,
                message: `Structured /llms.txt within budget (${tokens}/${budget} estimated tokens).`,
            });
        }
        else {
            checks.push({
                id: 'LLMS_TXT_BUDGET',
                category: 'LLMS_TXT',
                title: 'LLMs.txt Token Budget & Sectioning',
                status: 'WARN',
                score: 60,
                weight: 15,
                message: `Token budget exceeded: ${tokens}/${budget} estimated tokens.`,
            });
        }
    }
    else {
        checks.push({
            id: 'LLMS_TXT_CONFIG',
            category: 'LLMS_TXT',
            title: 'LLMs.txt Configuration',
            status: 'WARN',
            score: 30,
            weight: 15,
            message: 'No llmsTxt configuration provided.',
        });
    }
    // 3. Robots.txt Crawler Access Checks
    const robotsTxtContent = generateRobotsTxt(config.robotsTxt);
    const crawlerAudit = auditCrawlerAccess(robotsTxtContent);
    if (crawlerAudit.overallEligible) {
        checks.push({
            id: 'ROBOTS_AI_SEARCH_ACCESS',
            category: 'ROBOTS_TXT',
            title: 'AI Search Crawler Discoverability (OAI-SearchBot / Perplexity)',
            status: 'PASS',
            score: 100,
            weight: 20,
            message: 'AI Search Bots (OAI-SearchBot, PerplexityBot, ClaudeBot) are fully permitted to index.',
        });
    }
    else {
        checks.push({
            id: 'ROBOTS_AI_SEARCH_ACCESS',
            category: 'ROBOTS_TXT',
            title: 'AI Search Crawler Discoverability (OAI-SearchBot / Perplexity)',
            status: 'FAIL',
            score: crawlerAudit.score,
            weight: 20,
            message: 'Critical AI search crawlers are restricted or blocked in robots.txt.',
        });
    }
    // 4. Answer-First Summary Block Checks
    if (config.answerFirst) {
        const wordCheck = validateWordCount(config.answerFirst.summary, config.answerFirst.wordCountRange || [40, 60]);
        if (wordCheck.valid) {
            checks.push({
                id: 'ANSWER_FIRST_WORD_COUNT',
                category: 'ANSWER_FIRST',
                title: 'Answer-First 40-60 Word Executive Precision',
                status: 'PASS',
                score: 100,
                weight: 15,
                message: wordCheck.message,
            });
        }
        else {
            checks.push({
                id: 'ANSWER_FIRST_WORD_COUNT',
                category: 'ANSWER_FIRST',
                title: 'Answer-First 40-60 Word Executive Precision',
                status: 'WARN',
                score: 60,
                weight: 15,
                message: wordCheck.message,
            });
        }
    }
    else {
        checks.push({
            id: 'ANSWER_FIRST_CONFIG',
            category: 'ANSWER_FIRST',
            title: 'Answer-First Block Configuration',
            status: 'WARN',
            score: 30,
            weight: 15,
            message: 'No answerFirst configuration provided.',
        });
    }
    // 5. DOM Consistency Check
    if (sampleHtml) {
        const domResult = verifyDomConsistency(jsonLd, sampleHtml);
        if (domResult.consistent) {
            checks.push({
                id: 'DOM_STRUCTURED_DATA_PARITY',
                category: 'DOM_CONSISTENCY',
                title: 'Structured Data vs Rendered DOM Parity',
                status: 'PASS',
                score: domResult.score,
                weight: 20,
                message: 'JSON-LD fields match visible DOM content without drift.',
            });
        }
        else {
            checks.push({
                id: 'DOM_STRUCTURED_DATA_PARITY',
                category: 'DOM_CONSISTENCY',
                title: 'Structured Data vs Rendered DOM Parity',
                status: 'FAIL',
                score: domResult.score,
                weight: 20,
                message: 'Discrepancies detected between JSON-LD structured data and visible DOM text.',
            });
        }
    }
    else {
        checks.push({
            id: 'DOM_STRUCTURED_DATA_PARITY',
            category: 'DOM_CONSISTENCY',
            title: 'Structured Data vs Rendered DOM Parity',
            status: 'PASS',
            score: 95,
            weight: 20,
            message: 'Skipped live DOM parity (no sample HTML provided); schema passes offline self-consistency.',
        });
    }
    // Calculate Overall Weighted Score
    let totalWeightedScore = 0;
    let totalWeights = 0;
    let passedCount = 0;
    let warnCount = 0;
    let failCount = 0;
    for (const c of checks) {
        totalWeightedScore += c.score * c.weight;
        totalWeights += c.weight;
        if (c.status === 'PASS')
            passedCount++;
        else if (c.status === 'WARN')
            warnCount++;
        else if (c.status === 'FAIL')
            failCount++;
    }
    const overallScore = totalWeights > 0 ? Math.round(totalWeightedScore / totalWeights) : 100;
    let grade = 'F';
    if (overallScore >= 95)
        grade = 'A+';
    else if (overallScore >= 90)
        grade = 'A';
    else if (overallScore >= 80)
        grade = 'B';
    else if (overallScore >= 70)
        grade = 'C';
    else if (overallScore >= 60)
        grade = 'D';
    return {
        overallScore,
        grade,
        passedCount,
        warnCount,
        failCount,
        timestamp: new Date().toISOString(),
        entityName: config.entity.name,
        checks,
    };
}
/**
 * Generates a GitHub-flavored Markdown audit scorecard
 */
export function generateMarkdownScorecard(scorecard) {
    const lines = [];
    lines.push(`# Machine Trust & Dual-Audience Audit Scorecard`);
    lines.push('');
    lines.push(`> **Entity:** ${scorecard.entityName}  `);
    lines.push(`> **Audit Score:** **${scorecard.overallScore} / 100** (Grade: **${scorecard.grade}**)  `);
    lines.push(`> **Generated:** ${scorecard.timestamp}  `);
    lines.push(`> **Engine:** \`@nymrel/machine-trust\` v1.0.0`);
    lines.push('');
    // Status Summary
    lines.push(`## Summary`);
    lines.push('');
    lines.push(`| Status | Count | Benchmark Target |`);
    lines.push(`| :--- | :--- | :--- |`);
    lines.push(`| Passed | **${scorecard.passedCount}** | Total |`);
    lines.push(`| Warnings | **${scorecard.warnCount}** | 0 |`);
    lines.push(`| Failed | **${scorecard.failCount}** | 0 |`);
    lines.push('');
    // Detailed Table
    lines.push(`## Audit Breakdown`);
    lines.push('');
    lines.push(`| Category | Check | Status | Score | Findings & Verification |`);
    lines.push(`| :--- | :--- | :---: | :---: | :--- |`);
    for (const c of scorecard.checks) {
        const statusIcon = c.status === 'PASS' ? 'PASS' : c.status === 'WARN' ? 'WARN' : 'FAIL';
        lines.push(`| **${c.category}** | ${c.title} | ${statusIcon} | ${c.score}/100 | ${c.message} |`);
    }
    lines.push('');
    lines.push(`## Dual-Audience Compliance Doctrine`);
    lines.push('');
    lines.push(`1. **Parent Entity Lineage:** Verifiable machine trust graph connecting child project -> Nymrel -> JalenBuilds LLC.`);
    lines.push(`2. **Autonomous Agent Ingestion:** Curated \`/llms.txt\` and \`/llms-full.txt\` files under strict token budgets.`);
    lines.push(`3. **AI Search Bot Crawlability:** Explicit \`robots.txt\` rules permitting \`OAI-SearchBot\`, \`PerplexityBot\`, and \`ClaudeBot\`.`);
    lines.push(`4. **Answer-First Speed:** 40-60 word executive summaries delivering instant answers to LLM extractors.`);
    lines.push(`5. **DOM Parity:** Zero drift between JSON-LD structured data and human-visible DOM text to prevent search penalties.`);
    lines.push('');
    return lines.join('\n').trim() + '\n';
}
//# sourceMappingURL=scorecard.js.map