import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  extractTextFromHtml,
  normalizeText,
  extractPrices,
  verifyDomConsistency,
} from '../dist/validators/domConsistency.js';

describe('DOM Consistency & Parity Validator', () => {
  const jsonLdGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'Nymrel',
        url: 'https://nymrel.com',
      },
      {
        '@type': 'Product',
        name: 'Autonomous Agent Kit',
        description: 'High-performance Dual-Audience agent orchestration toolkit.',
        offers: {
          '@type': 'Offer',
          price: '49.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    ],
  };

  test('extracts clean text from HTML, removing script and style tags', () => {
    const html = `
      <html>
        <head>
          <style>body { color: red; }</style>
          <script>console.log("ignore");</script>
        </head>
        <body>
          <h1>Autonomous Agent Kit</h1>
          <p>Price: $49.00 USD</p>
        </body>
      </html>
    `;

    const text = extractTextFromHtml(html);
    assert.ok(!text.includes('console.log'));
    assert.ok(!text.includes('color: red'));
    assert.ok(text.includes('Autonomous Agent Kit'));
    assert.ok(text.includes('$49.00 USD'));
  });

  test('passes validation when DOM matches JSON-LD pricing and entity names', () => {
    const validHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <header>
            <span>Nymrel</span>
            <h1>Autonomous Agent Kit</h1>
          </header>
          <main>
            <p>High-performance Dual-Audience agent orchestration toolkit.</p>
            <div class="pricing">
              <span class="price">$49.00</span>
              <span class="stock">In Stock</span>
            </div>
          </main>
        </body>
      </html>
    `;

    const result = verifyDomConsistency(jsonLdGraph, validHtml);
    assert.strictEqual(result.consistent, true);
    assert.ok(result.score >= 90);
    assert.ok(!result.checks.some((c) => c.status === 'FAIL'));
  });

  test('fails validation when DOM price conflicts with JSON-LD offer', () => {
    const mismatchedHtml = `
      <!DOCTYPE html>
      <html>
        <body>
          <header>
            <span>Nymrel</span>
            <h1>Autonomous Agent Kit</h1>
          </header>
          <main>
            <p>High-performance Dual-Audience agent orchestration toolkit.</p>
            <div class="pricing">
              <span class="price">$99.00</span> <!-- Mismatched price -->
            </div>
          </main>
        </body>
      </html>
    `;

    const result = verifyDomConsistency(jsonLdGraph, mismatchedHtml);
    assert.strictEqual(result.consistent, false);
    const priceCheck = result.checks.find((c) => c.field.includes('Offer Price'));
    assert.ok(priceCheck);
    assert.strictEqual(priceCheck.status, 'FAIL');
  });
});
