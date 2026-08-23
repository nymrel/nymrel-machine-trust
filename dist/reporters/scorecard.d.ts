import { MachineTrustConfig, MachineTrustAuditScorecard } from '../types.js';
/**
 * Executes a full Machine Trust audit across all 5 dimensions
 */
export declare function runMachineTrustAudit(config: MachineTrustConfig, sampleHtml?: string): MachineTrustAuditScorecard;
/**
 * Generates a GitHub-flavored Markdown audit scorecard
 */
export declare function generateMarkdownScorecard(scorecard: MachineTrustAuditScorecard): string;
//# sourceMappingURL=scorecard.d.ts.map