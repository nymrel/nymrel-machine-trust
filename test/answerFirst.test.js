import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  countWords,
  validateWordCount,
  generateAnswerFirstHtml,
  injectAnswerFirstBlock,
} from '../dist/generators/answerFirst.js';

describe('Answer-First Executive Summary Block Generator', () => {
  const summary48Words =
    'Nymrel Machine Trust is an enterprise TypeScript library that guarantees Dual-Audience SEO and AI search discoverability for modern web applications by generating verifiable Schema.org entity graphs, standard llms.txt indexes, and strict robots.txt crawler policies that allow autonomous AI search bots while preventing training scrapers.';

  test('accurately counts words', () => {
    assert.strictEqual(countWords(''), 0);
    assert.strictEqual(countWords('Hello world'), 2);
    assert.strictEqual(countWords('  One   two   three  '), 3);
  });

  test('validates 40-60 word envelope', () => {
    const tooShort = validateWordCount('This is too short.');
    assert.strictEqual(tooShort.valid, false);

    const validRange = validateWordCount(summary48Words, [40, 60]);
    assert.strictEqual(validRange.valid, true);
    assert.ok(validRange.count >= 40 && validRange.count <= 60);
  });

  test('generates accessible semantic HTML with microdata and entity badge', () => {
    const html = generateAnswerFirstHtml({
      summary: summary48Words,
      entityName: 'Nymrel',
      keyTakeaways: ['Dual-Audience Schema.org Graph', 'Zero DOM drift validation'],
    });

    assert.ok(html.includes('<aside class="machine-trust-answer-first"'));
    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label="Executive Summary"'));
    assert.ok(html.includes('Verified Machine Trust by Nymrel'));
    assert.ok(html.includes('Dual-Audience Schema.org Graph'));
  });

  test('injects into HTML after H1 tag', () => {
    const inputHtml = `<!DOCTYPE html><html><body><header><h1>Nymrel Core</h1></header><main><p>Content</p></main></body></html>`;
    const injected = injectAnswerFirstBlock(inputHtml, {
      summary: summary48Words,
      entityName: 'Nymrel',
    });

    assert.ok(injected.includes('</h1>\n<aside class="machine-trust-answer-first"'));
    assert.ok(injected.includes('<main><p>Content</p></main>'));
  });

  test('injects into explicit placeholder if present', () => {
    const inputHtml = `<div><!-- MACHINE_TRUST_ANSWER_FIRST --></div>`;
    const injected = injectAnswerFirstBlock(inputHtml, {
      summary: summary48Words,
    });

    assert.ok(!injected.includes('<!-- MACHINE_TRUST_ANSWER_FIRST -->'));
    assert.ok(injected.includes('<aside class="machine-trust-answer-first"'));
  });
});
