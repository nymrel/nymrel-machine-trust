import { RobotsTxtConfig, BotRule, BotPosture } from '../types.js';
export declare const KNOWN_AI_BOTS: {
    SEARCH: string[];
    TRAINING: string[];
};
/**
 * Builds standard bot rules based on posture
 */
export declare function getRulesForPosture(posture?: BotPosture): BotRule[];
/**
 * Generates formatted robots.txt string
 */
export declare function generateRobotsTxt(config?: RobotsTxtConfig): string;
export interface ParsedRobotsTxt {
    host?: string;
    sitemaps: string[];
    rules: Record<string, {
        allow: string[];
        disallow: string[];
        crawlDelay?: number;
    }>;
}
/**
 * Parses existing robots.txt into structured rule matrix
 */
export declare function parseRobotsTxt(content: string): ParsedRobotsTxt;
//# sourceMappingURL=robotsTxt.d.ts.map