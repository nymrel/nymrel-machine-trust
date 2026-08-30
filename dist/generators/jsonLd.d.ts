import type { MachineTrustConfig, OrganizationConfig, ParentOrganizationConfig } from '../types.js';
/**
 * Canonical @id of the Nymrel organization node, used for attribution by
 * reference. Nymrel is the studio brand; its legal entity is expressed via
 * `legalName` — never as a minted subsidiary chain inside someone else's graph.
 */
export declare const NYMREL_ORGANIZATION_ID = "https://nymrel.com/#organization";
/**
 * Canonical names for verifiable machine trust: 'Nymrel' is the studio brand
 * carried by `name`, and 'JalenBuilds LLC' is its operating legal entity,
 * carried by `legalName`. The pair describes ONE organization node — never a
 * two-node subsidiary chain.
 */
export declare const CANONICAL_NYMREL_ORG_NAME = "Nymrel";
export declare const CANONICAL_LEGAL_NAME = "JalenBuilds LLC";
/**
 * Canonical single-node description of the Nymrel organization:
 * `legalName` carries the operating legal entity (JalenBuilds LLC). Nymrel is
 * not modeled as a subsidiary with a separate parent node — there is no such
 * parent, and asserting one would be false.
 *
 * Opt-in utility for graphs that legitimately describe Nymrel inline (e.g.
 * nymrel.com itself). Built/partner properties must not embed this node; they
 * attribute via `entity.nymrelAttribution`, which emits a bare `@id` creator
 * reference instead.
 */
export declare function createCanonicalNymrelOrganization(): ParentOrganizationConfig;
/**
 * Deprecated alias for {@link createCanonicalNymrelOrganization}. The name
 * suggested a default hierarchy that was never applied implicitly and whose
 * nested subsidiary-chain shape misrepresented the legal structure. Retained
 * only for backward compatibility; new code should use the canonical helper.
 *
 * The generator NEVER applies any hierarchy implicitly: when a config omits
 * `entity.parentOrganization`, the generated graph asserts no corporate
 * parent at all.
 *
 * @deprecated Use {@link createCanonicalNymrelOrganization}.
 */
export declare function createDefaultParentHierarchy(): ParentOrganizationConfig;
/**
 * Deterministically validates caller-supplied explicit relationships.
 * Fails closed on malformed nodes, cycles, and contradictory Nymrel claims;
 * absence of relationships is valid and produces no lineage output.
 */
export declare function validateExplicitEntityRelationships(entity: OrganizationConfig): void;
/**
 * Builds Schema.org JSON-LD @graph matching Dual-Audience machine trust specifications
 */
export declare function generateJsonLd(config: MachineTrustConfig): Record<string, any>;
/** Serializes JSON-LD for an HTML script-data context without raw markup tokens. */
export declare function serializeJsonLdForHtml(data: unknown, options?: {
    minify?: boolean;
}): string;
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
/** A single structured finding from canonical-relationship validation */
export interface LineageIssue {
    /** Stable machine-readable code, safe to gate on in CI */
    code: string;
    severity: 'error' | 'warning';
    message: string;
}
/** Deterministic result of canonical relationship validation */
export interface LineageValidationResult {
    /** True when the graph's Nymrel relationship (if any) is expressed truthfully */
    valid: boolean;
    errors: string[];
    warnings: string[];
    issues: LineageIssue[];
}
/**
 * Opt-in validator: checks how a JSON-LD graph relates to the canonical Nymrel
 * organization, per the truthful relationship model. Read-only — it never
 * rewrites the graph or asserts anything about deployments.
 *
 * Canonical model:
 * - The Nymrel organization is ONE node (`name: 'Nymrel'`,
 *   `legalName: 'JalenBuilds LLC'`, canonical `@id`
 *   {@link NYMREL_ORGANIZATION_ID}). It has no corporate parent; expressing
 *   JalenBuilds LLC as a separate parentOrganization node asserts a false
 *   subsidiary chain.
 * - Built/partner properties attribute via a bare creator reference,
 *   `{ "@id": "https://nymrel.com/#organization" }` — the canonical node is
 *   never rebuilt inline alongside the reference.
 * - Generic sites with no Nymrel relationship are VALID with zero findings;
 *   absence of attribution is truthful, not an error.
 *
 * Accepts either a full `{ @context, @graph }` document or a bare Organization
 * node. When multiple top-level Organization entities exist, the primary one is
 * selected deterministically (`@id` ending in '#organization', else first in
 * graph order). Names are matched exactly (whitespace-trimmed,
 * case-sensitive) against the canonical constants.
 *
 * Findings are stable, machine-readable issues suitable for CI gates. Generic
 * structural validation remains available via `validateJsonLdStructure`.
 */
export declare function validateNymrelLineage(jsonLd: any): LineageValidationResult;
//# sourceMappingURL=jsonLd.d.ts.map