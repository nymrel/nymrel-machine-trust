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
