import { parseRobotsTxt, KNOWN_AI_BOTS } from '../generators/robotsTxt.js';
import type { CrawlerAuditResult, CrawlerAccessResult } from '../types.js';

/**
 * Checks if a specific path is allowed for a given bot in parsed robots.txt rules
 */
export function isPathAllowed(
  parsed: ReturnType<typeof parseRobotsTxt>,
  botName: string,
  path: string
): { allowed: boolean; reason: string } {
  // Find rule matching the exact bot name (case-insensitive) or wildcard '*'
  const botKey = Object.keys(parsed.rules).find(
    (k) => k.toLowerCase() === botName.toLowerCase()
  );

  const rule = botKey ? parsed.rules[botKey] : parsed.rules['*'];

  if (!rule) {
    // If no rule matches, standard default is allowed
    return { allowed: true, reason: `No restrictive rule found for ${botName} (default allow)` };
  }

  // Check explicit disallow
  for (const disallowPath of rule.disallow) {
    if (disallowPath === '') continue; // Empty disallow means allow all
    if (disallowPath === '/' || path.startsWith(disallowPath)) {
      // Check if there is a more specific allow
      const overridingAllow = rule.allow.some(
        (allowPath) => allowPath !== '' && path.startsWith(allowPath) && allowPath.length >= disallowPath.length
      );
      if (!overridingAllow) {
        return {
          allowed: false,
          reason: `Blocked by rule "Disallow: ${disallowPath}" for ${botKey || '*'}`,
        };
      }
    }
  }

  // If allow rule exists or no disallow matched
  return { allowed: true, reason: `Permitted by ${botKey || '*'} rules` };
}

/**
 * Performs a comprehensive AI crawler access audit against robots.txt
 */
export function auditCrawlerAccess(robotsTxtContent: string): CrawlerAuditResult {
  const parsed = parseRobotsTxt(robotsTxtContent);
  const results: CrawlerAccessResult[] = [];

  const targetBots = [
    'OAI-SearchBot',
    'PerplexityBot',
    'ClaudeBot',
    'Googlebot',
    'Bingbot',
    'GPTBot',
    'Google-Extended',
  ];

  const testPaths = ['/', '/llms.txt'];

  let searchBotFailures = 0;

  for (const bot of targetBots) {
    for (const testPath of testPaths) {
      const access = isPathAllowed(parsed, bot, testPath);
      const isSearchBot = KNOWN_AI_BOTS.SEARCH.includes(bot);

      if (isSearchBot && !access.allowed) {
        searchBotFailures++;
      }

      results.push({
        botName: bot,
        path: testPath,
        allowed: access.allowed,
        reason: access.reason,
      });
    }
  }

  const declaredSitemap = parsed.sitemaps.length > 0;
  const declaredLlmsTxt = Object.values(parsed.rules).some(
    (r) => r.allow.includes('/llms.txt') || r.allow.includes('/')
  );

  // Score computation: Max 100
  let score = 100;
  if (searchBotFailures > 0) {
    score -= searchBotFailures * 20;
  }
  if (!declaredSitemap) {
    score -= 10;
  }
  if (score < 0) score = 0;

  const overallEligible = searchBotFailures === 0;

  return {
    overallEligible,
    score,
    results,
    declaredSitemap,
    declaredLlmsTxt,
  };
}
