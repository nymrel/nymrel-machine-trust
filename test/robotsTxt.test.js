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

  test('rejects control-character directive injection', () => {
    for (const config of [
      { host: 'example.com\nUser-agent: *' },
      { sitemapUrl: 'https://example.com/sitemap.xml\rDisallow: /' },
      { botRules: [{ botName: 'SafeBot\nDisallow: /', allow: ['/'] }] },
      { botRules: [{ botName: 'SafeBot', disallow: ['/safe\nAllow: /'] }] },
      { defaultAllow: ['/safe\u0085Disallow: /'] },
      { defaultDisallow: ['/safe\u2028Allow: /'] },
    ]) {
      assert.throws(
        () => generateRobotsTxt(config),
        (error) => error?.code === 'INVALID_ROBOTS_DIRECTIVE'
      );
    }
  });

  test('fails closed on invalid crawler delays while preserving zero', () => {
    assert.throws(
      () => generateRobotsTxt({ botRules: [{ botName: 'SafeBot', crawlDelay: -1 }] }),
      (error) => error?.code === 'INVALID_ROBOTS_DIRECTIVE'
    );
    assert.throws(
      () => generateRobotsTxt({ botRules: [{ botName: 'SafeBot', crawlDelay: Number.NaN }] }),
      (error) => error?.code === 'INVALID_ROBOTS_DIRECTIVE'
    );
    assert.ok(generateRobotsTxt({ botRules: [{ botName: 'SafeBot', crawlDelay: 0 }] })
      .includes('Crawl-delay: 0'));
  });
});
