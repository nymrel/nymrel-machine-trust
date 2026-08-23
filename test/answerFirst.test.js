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
    'Nymrel Machine Trust is a TypeScript library that generates structured data, machine indexes, and declared crawler policies, then reports observable differences between configured facts and supplied rendered pages. Its checks provide reproducible local evidence and explicit limitations without promising indexing, rankings, traffic, citations, customer outcomes, or revenue.';

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
      keyTakeaways: ['Explicit Schema.org graph', 'Supplied DOM parity check'],
    });

    assert.ok(html.includes('<aside class="machine-trust-answer-first"'));
    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label="Executive Summary"'));
    assert.ok(html.includes('Machine-readable summary for Nymrel'));
    assert.ok(html.includes('Explicit Schema.org graph'));
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
