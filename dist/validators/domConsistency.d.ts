import { DomConsistencyCheckResult } from '../types.js';
/**
 * Strips HTML tags and normalizes whitespace
 */
export declare function extractTextFromHtml(html: string): string;
/**
 * Normalizes text for comparison (lowercase, trimmed, collapsed whitespace, punctuation simplified)
 */
export declare function normalizeText(text: string): string;
/**
 * Extracts prices from text (e.g., "$49", "49.00", "USD 49", "0.00", "Free")
 */
export declare function extractPrices(text: string): string[];
/**
 * Verifies that structured data in JSON-LD matches rendered visible DOM text
 */
export declare function verifyDomConsistency(jsonLd: any, html: string): DomConsistencyCheckResult;
//# sourceMappingURL=domConsistency.d.ts.map