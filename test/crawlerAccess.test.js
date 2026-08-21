import { test, describe } from 'node:test';
import assert from 'node:assert';
import { auditCrawlerAccess, isPathAllowed } from '../dist/validators/crawlerAccess.js';
import { generateRobotsTxt, parseRobotsTxt } from '../dist/generators/robotsTxt.js';

describe('AI Crawler Access & Eligibility Validator', () => {
  const standardRobots = generateRobotsTxt({
    sitemapUrl: 'https://nymrel.com/sitemap.xml',
    host: 'nymrel.com',
    posture: 'allow_ai_search_disallow_training',
  });

  test('permits OAI-SearchBot and PerplexityBot on / and /llms.txt', () => {
    const parsed = parseRobotsTxt(standardRobots);
    const oaiCheck = isPathAllowed(parsed, 'OAI-SearchBot', '/');
    const perplexityCheck = isPathAllowed(parsed, 'PerplexityBot', '/llms.txt');

    assert.strictEqual(oaiCheck.allowed, true);
    assert.strictEqual(perplexityCheck.allowed, true);
  });

  test('blocks GPTBot and CCBot on model scraper paths', () => {
    const parsed = parseRobotsTxt(standardRobots);
    const gptCheck = isPathAllowed(parsed, 'GPTBot', '/');
    const ccCheck = isPathAllowed(parsed, 'CCBot', '/');

    assert.strictEqual(gptCheck.allowed, false);
    assert.strictEqual(ccCheck.allowed, false);
  });

  test('completes crawler audit with high eligibility score', () => {
    const audit = auditCrawlerAccess(standardRobots);
    assert.strictEqual(audit.overallEligible, true);
    assert.ok(audit.score >= 90);
    assert.strictEqual(audit.declaredSitemap, true);
  });

  test('flags restrictive robots.txt that blocks OAI-SearchBot', () => {
    const restrictiveRobots = `
      User-agent: *
      Disallow: /
    `;
    const audit = auditCrawlerAccess(restrictiveRobots);
    assert.strictEqual(audit.overallEligible, false);
    assert.ok(audit.score < 50);
  });
});
