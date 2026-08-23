import { MachineTrustConfig, MachineTrustAuditOptions, MachineTrustAuditScorecard, CheckItem } from '../types.js';
import { generateJsonLd, validateJsonLdStructure, validateNymrelLineage } from '../generators/jsonLd.js';
import { generateLlmsTxt, estimateTokens } from '../generators/llmsTxt.js';
import { generateRobotsTxt } from '../generators/robotsTxt.js';
import { validateWordCount } from '../generators/answerFirst.js';
import { auditCrawlerAccess } from '../validators/crawlerAccess.js';
import { verifyDomConsistency } from '../validators/domConsistency.js';
import { MachineTrustConfigError } from '../errors.js';

/**
 * Resolves the timestamp recorded on an audit scorecard.
 *
 * Precedence: explicit option > MACHINE_TRUST_FIXED_TIMESTAMP env var >
 * current time (the backward-compatible default). A provided value must parse
 * as an ISO-8601 date; it is normalized to UTC ISO format so identical inputs
 * produce byte-identical output.
 */
export function resolveAuditTimestamp(options?: MachineTrustAuditOptions): string {
  const raw = options?.fixedTimestamp ?? process.env.MACHINE_TRUST_FIXED_TIMESTAMP;

  if (raw === undefined) {
    return new Date().toISOString();
  }

  const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;
  if (
    typeof raw !== 'string' ||
    !isoDateTime.test(raw) ||
    Number.isNaN(Date.parse(raw))
  ) {
    throw new MachineTrustConfigError(
      'INVALID_FIXED_TIMESTAMP',
      `Fixed timestamp must be a parseable ISO-8601 date string (received ${JSON.stringify(raw)})`
    );
  }

  return new Date(raw).toISOString();
}

/**
 * Executes a full Machine Trust audit across all 5 dimensions
 */
export function runMachineTrustAudit(
  config: MachineTrustConfig,
  sampleHtml?: string,
  options?: MachineTrustAuditOptions
): MachineTrustAuditScorecard {
  const checks: CheckItem[] = [];
  const timestamp = resolveAuditTimestamp(options);

  // 1. Entity Graph Checks
  let jsonLd: Record<string, any> | undefined;
  try {
    jsonLd = generateJsonLd(config);
  } catch (err) {
    if (!(err instanceof MachineTrustConfigError)) {
      throw err;
    }
    checks.push({
      id: 'ENTITY_JSONLD_SYNTAX',
      category: 'ENTITY_GRAPH',
      title: 'Schema.org JSON-LD Syntactic Integrity',
      status: 'FAIL',
      score: 0,
      weight: 15,
      message: `Explicit entity relationship rejected (fail closed): ${err.message}`,
    });
  }

  const jsonLdValidation = jsonLd ? validateJsonLdStructure(jsonLd) : null;

  if (!jsonLdValidation) {
    // Config error already recorded above; skip dependent entity checks.
  } else if (jsonLdValidation.valid) {
    checks.push({
      id: 'ENTITY_JSONLD_SYNTAX',
      category: 'ENTITY_GRAPH',
      title: 'Schema.org JSON-LD Syntactic Integrity',
      status: 'PASS',
      score: 100,
      weight: 15,
      message: 'Valid Schema.org graph generated with @context and @graph.',
    });
  } else {
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

  // Explicit Entity Lineage check — presence is verified, absence is truthful.
  const org = jsonLd && Array.isArray(jsonLd['@graph'])
    ? (jsonLd['@graph'] as any[]).find((i) => i['@type'] === 'Organization')
    : undefined;
  const relationshipValidation = jsonLd ? validateNymrelLineage(jsonLd) : null;
  if (!jsonLd) {
    checks.push({
      id: 'ENTITY_RELATIONSHIP_TRUTH',
      category: 'ENTITY_GRAPH',
      title: 'Explicit Entity Relationship Validation',
      status: 'FAIL',
      score: 0,
      weight: 15,
      message: 'Relationship checks could not run because the explicit entity configuration was rejected.',
    });
  } else if (relationshipValidation && !relationshipValidation.valid) {
    checks.push({
      id: 'ENTITY_RELATIONSHIP_TRUTH',
      category: 'ENTITY_GRAPH',
      title: 'Explicit Entity Relationship Validation',
      status: 'FAIL',
      score: 0,
      weight: 15,
      message: relationshipValidation.errors.join('; '),
    });
  } else if (org && org.creator && org.creator['@id']) {
    checks.push({
      id: 'ENTITY_RELATIONSHIP_TRUTH',
      category: 'ENTITY_GRAPH',
      title: 'Explicit Entity Relationship Validation',
      status: 'PASS',
      score: 100,
      weight: 15,
      message: `Explicit creator reference verified: ${org.creator['@id']}`,
    });
  } else if (org && org.parentOrganization && org.parentOrganization.name) {
    checks.push({
      id: 'ENTITY_RELATIONSHIP_TRUTH',
      category: 'ENTITY_GRAPH',
      title: 'Explicit Entity Relationship Validation',
      status: 'PASS',
      score: 100,
      weight: 15,
      message: `Explicit parent organization verified: ${org.name} -> ${org.parentOrganization.name}`,
    });
  } else {
    checks.push({
      id: 'ENTITY_RELATIONSHIP_TRUTH',
      category: 'ENTITY_GRAPH',
      title: 'Explicit Entity Relationship Validation',
      status: 'PASS',
      score: 100,
      weight: 15,
      message: 'No corporate parent declared; the organization stands alone and no lineage is asserted.',
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
    } else {
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
  } else {
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
      title: 'Declared AI Search Crawler Policy',
      status: 'PASS',
      score: 100,
      weight: 20,
      message: 'Generated rules declare access for OAI-SearchBot, PerplexityBot, and ClaudeBot; actual crawling and indexing are not measured.',
    });
  } else {
    checks.push({
      id: 'ROBOTS_AI_SEARCH_ACCESS',
      category: 'ROBOTS_TXT',
      title: 'Declared AI Search Crawler Policy',
      status: 'FAIL',
      score: crawlerAudit.score,
      weight: 20,
      message: 'Generated rules restrict one or more configured discovery crawlers.',
    });
  }

  // 4. Answer-First Summary Block Checks
  if (config.answerFirst) {
    const wordCountRange = config.answerFirst.wordCountRange || [40, 60];
    const wordCountTitle = `Answer-First ${wordCountRange[0]}-${wordCountRange[1]} Word Length`;
    const wordCheck = validateWordCount(
      config.answerFirst.summary,
      wordCountRange
    );

    if (wordCheck.valid) {
      checks.push({
        id: 'ANSWER_FIRST_WORD_COUNT',
        category: 'ANSWER_FIRST',
        title: wordCountTitle,
        status: 'PASS',
        score: 100,
        weight: 15,
        message: wordCheck.message,
      });
    } else {
      checks.push({
        id: 'ANSWER_FIRST_WORD_COUNT',
        category: 'ANSWER_FIRST',
        title: wordCountTitle,
        status: 'WARN',
        score: 60,
        weight: 15,
        message: wordCheck.message,
      });
    }
  } else {
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
  if (sampleHtml && jsonLd) {
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
    } else {
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
  } else {
    checks.push({
      id: 'DOM_STRUCTURED_DATA_PARITY',
      category: 'DOM_CONSISTENCY',
      title: 'Structured Data vs Rendered DOM Parity',
      status: 'WARN',
      score: 60,
      weight: 20,
      message: 'Not measured: no sample HTML was supplied, so rendered-copy parity could not be checked.',
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
    if (c.status === 'PASS') passedCount++;
    else if (c.status === 'WARN') warnCount++;
    else if (c.status === 'FAIL') failCount++;
  }

  const overallScore = totalWeights > 0 ? Math.round(totalWeightedScore / totalWeights) : 100;

  let grade: MachineTrustAuditScorecard['grade'] = 'F';
  if (overallScore >= 95) grade = 'A+';
  else if (overallScore >= 90) grade = 'A';
  else if (overallScore >= 80) grade = 'B';
  else if (overallScore >= 70) grade = 'C';
  else if (overallScore >= 60) grade = 'D';

  return {
    overallScore,
    grade,
    passedCount,
    warnCount,
    failCount,
    timestamp,
    entityName: config.entity.name,
    checks,
  };
}

/**
 * Generates a GitHub-flavored Markdown audit scorecard
 */
export function generateMarkdownScorecard(scorecard: MachineTrustAuditScorecard): string {
  const lines: string[] = [];

  lines.push(`# Machine Trust & Dual-Audience Audit Scorecard`);
  lines.push('');
  lines.push(`> **Entity:** ${scorecard.entityName}`);
  lines.push(`> **Audit Score:** **${scorecard.overallScore} / 100** (Grade: **${scorecard.grade}**)`);
  lines.push(`> **Generated:** ${scorecard.timestamp}`);
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
    lines.push(
      `| **${c.category}** | ${c.title} | ${statusIcon} | ${c.score}/100 | ${c.message} |`
    );
  }

  lines.push('');
  lines.push(`## Dual-Audience Compliance Doctrine`);
  lines.push('');
  lines.push(`1. **Truthful Entity Graph:** Schema.org \`@graph\` built from explicit configuration only; declared relationships are validated, and no lineage is implied or invented.`);
  lines.push(`2. **Machine Index Artifacts:** Generated \`/llms.txt\` and \`/llms-full.txt\` files are checked against the configured token budget.`);
  lines.push(`3. **Declared Crawler Policy:** Generated \`robots.txt\` rules are inspected; crawler behavior and indexing are outside this audit.`);
  lines.push(`4. **Answer-First Length:** Supplied summaries are checked against the configured word-count range.`);
  lines.push(`5. **Supplied DOM Parity:** Structured data is compared with supplied rendered HTML; no result is claimed when HTML is absent.`);
  lines.push('');

  return lines.join('\n').trim() + '\n';
}
