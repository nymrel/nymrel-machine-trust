import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateRobotsTxt, parseRobotsTxt } from '../dist/generators/robotsTxt.js';

describe('Robots.txt Generator & AI Search Rules', () => {
  test('generates default AI Search Discovery rules', () => {
    const robotsTxt = generateRobotsTxt({
      sitemapUrl: 'https://nymrel.com/sitemap.xml',
      host: 'nymrel.com',
      posture: 'allow_ai_search_disallow_training',
    });

    assert.ok(robotsTxt.includes('Host: nymrel.com'));
    assert.ok(robotsTxt.includes('Sitemap: https://nymrel.com/sitemap.xml'));

    // Search bots allowed
    assert.ok(robotsTxt.includes('User-agent: OAI-SearchBot'));
    assert.ok(robotsTxt.includes('User-agent: PerplexityBot'));
    assert.ok(robotsTxt.includes('User-agent: ClaudeBot'));
    assert.ok(robotsTxt.includes('User-agent: Googlebot'));

    // Training bots disallowed
    assert.ok(robotsTxt.includes('User-agent: GPTBot\nDisallow: /'));
    assert.ok(robotsTxt.includes('User-agent: Google-Extended\nDisallow: /'));
    assert.ok(robotsTxt.includes('User-agent: CCBot\nDisallow: /'));
  });

  test('parses generated robots.txt properly', () => {
    const robotsTxt = generateRobotsTxt({
      sitemapUrl: 'https://nymrel.com/sitemap.xml',
      host: 'nymrel.com',
      posture: 'allow_ai_search_disallow_training',
    });

    const parsed = parseRobotsTxt(robotsTxt);
    assert.strictEqual(parsed.host, 'nymrel.com');
    assert.strictEqual(parsed.sitemaps[0], 'https://nymrel.com/sitemap.xml');
    assert.ok(parsed.rules['OAI-SearchBot']);
    assert.ok(parsed.rules['OAI-SearchBot'].allow.includes('/'));
    assert.ok(parsed.rules['GPTBot'].disallow.includes('/'));
  });
});
