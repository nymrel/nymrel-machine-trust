import { MachineTrustConfig, ParentOrganizationConfig } from '../types.js';
/**
 * Creates canonical Nymrel -> JalenBuilds LLC parent organization hierarchy
 */
export declare function createDefaultParentHierarchy(): ParentOrganizationConfig;
/**
 * Builds Schema.org JSON-LD @graph matching Dual-Audience machine trust specifications
 */
export declare function generateJsonLd(config: MachineTrustConfig): Record<string, any>;
/**
 * Formats JSON-LD graph into an HTML <script type="application/ld+json"> tag
 */
export declare function generateJsonLdScriptTag(config: MachineTrustConfig, options?: {
    minify?: boolean;
}): string;
/**
 * Validates JSON-LD graph structure according to Dual-Audience standards
 */
export declare function validateJsonLdStructure(jsonLd: any): {
    valid: boolean;
    errors: string[];
    warnings: string[];
};
/**
 * Canonical Nymrel lineage names for verifiable machine trust:
 * the studio brand (intermediate) and the legal parent company (root).
 */
export declare const CANONICAL_INTERMEDIATE_ORG_NAME = "Nymrel";
export declare const CANONICAL_ROOT_ORG_NAME = "JalenBuilds LLC";
/** A single structured finding from lineage validation */
export interface LineageIssue {
    /** Stable machine-readable code, safe to gate on in CI */
    code: string;
    severity: 'error' | 'warning';
    message: string;
}
/** Deterministic result of canonical lineage validation */
export interface LineageValidationResult {
    /** True only when the canonical Nymrel -> JalenBuilds LLC chain is intact */
    valid: boolean;
    errors: string[];
    warnings: string[];
    issues: LineageIssue[];
}
/**
 * Opt-in validator: checks that an existing JSON-LD graph carries the canonical
 * Nymrel -> JalenBuilds LLC parentOrganization lineage. Read-only — it never
 * rewrites the graph or asserts anything about deployments.
 *
 * Accepts either a full `{ @context, @graph }` document or a bare Organization
 * node. When multiple top-level Organization entities exist, the primary one is
 * selected deterministically (`@id` ending in '#organization', else first in
 * graph order). Names are matched exactly (whitespace-trimmed,
 * case-sensitive) against the canonical constants.
 *
 * Missing or incorrect intermediate ('Nymrel') and root ('JalenBuilds LLC')
 * organization nodes are errors; nesting beyond the canonical root is a
 * non-blocking warning. Generic structural validation remains available via
 * `validateJsonLdStructure`.
 */
export declare function validateNymrelLineage(jsonLd: any): LineageValidationResult;
//# sourceMappingURL=jsonLd.d.ts.map