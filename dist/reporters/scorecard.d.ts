import { MachineTrustConfig, MachineTrustAuditOptions, MachineTrustAuditScorecard } from '../types.js';
/**
 * Resolves the timestamp recorded on an audit scorecard.
 *
 * Precedence: explicit option > MACHINE_TRUST_FIXED_TIMESTAMP env var >
 * current time (the backward-compatible default). A provided value must parse
 * as an ISO-8601 date; it is normalized to UTC ISO format so identical inputs
 * produce byte-identical output.
 */
export declare function resolveAuditTimestamp(options?: MachineTrustAuditOptions): string;
/**
 * Executes a full Machine Trust audit across all 5 dimensions
 */
export declare function runMachineTrustAudit(config: MachineTrustConfig, sampleHtml?: string, options?: MachineTrustAuditOptions): MachineTrustAuditScorecard;
/**
 * Generates a GitHub-flavored Markdown audit scorecard
 */
export declare function generateMarkdownScorecard(scorecard: MachineTrustAuditScorecard): string;
//# sourceMappingURL=scorecard.d.ts.map