import { parseRobotsTxt } from '../generators/robotsTxt.js';
import { CrawlerAuditResult } from '../types.js';
/**
 * Checks if a specific path is allowed for a given bot in parsed robots.txt rules
 */
export declare function isPathAllowed(parsed: ReturnType<typeof parseRobotsTxt>, botName: string, path: string): {
    allowed: boolean;
    reason: string;
};
/**
 * Performs a comprehensive AI crawler access audit against robots.txt
 */
export declare function auditCrawlerAccess(robotsTxtContent: string): CrawlerAuditResult;
