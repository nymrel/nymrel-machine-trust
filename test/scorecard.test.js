import { test, describe } from 'node:test';
import assert from 'node:assert';
import { runMachineTrustAudit } from '../dist/reporters/scorecard.js';

const fixedTimestamp = '2026-08-23T16:00:00.000Z';

describe('Audit scorecard evidence boundaries', () => {
  test('marks rendered-copy parity not measured when HTML is absent', () => {
    const scorecard = runMachineTrustAudit(
      {
        entity: {
          name: 'Independent Example',
          url: 'https://independent.example',
          description: 'A fictional independent business.',
        },
        robotsTxt: { posture: 'allow_ai_search_disallow_training' },
      },
      undefined,
      { fixedTimestamp }
    );
    const dom = scorecard.checks.find(
      (check) => check.id === 'DOM_STRUCTURED_DATA_PARITY'
    );

    assert.strictEqual(dom.status, 'WARN');
    assert.match(dom.message, /Not measured/);
    assert.strictEqual(scorecard.timestamp, fixedTimestamp);
  });

  test('fails the integrated audit for a false canonical legal identity', () => {
    const scorecard = runMachineTrustAudit(
      {
        entity: {
          name: 'Nymrel',
          legalName: 'Incorrect Legal Entity',
          url: 'https://nymrel.com/',
          description: 'A deliberately invalid canonical identity.',
        },
        robotsTxt: { posture: 'allow_ai_search_disallow_training' },
      },
      undefined,
      { fixedTimestamp }
    );
    const relationship = scorecard.checks.find(
      (check) => check.id === 'ENTITY_RELATIONSHIP_TRUTH'
    );

    assert.strictEqual(relationship.status, 'FAIL');
    assert.match(relationship.message, /Incorrect Legal Entity/);
    assert.ok(scorecard.failCount > 0);
  });

  test('reports the configured answer-first word-count range in the check title', () => {
    const scorecard = runMachineTrustAudit(
      {
        entity: {
          name: 'Range Example',
          url: 'https://range.example',
          description: 'A fictional custom-range configuration.',
        },
        robotsTxt: { posture: 'allow_ai_search_disallow_training' },
        answerFirst: {
          summary: 'Five clear words only today.',
          wordCountRange: [5, 7],
        },
      },
      undefined,
      { fixedTimestamp }
    );
    const wordCount = scorecard.checks.find(
      (check) => check.id === 'ANSWER_FIRST_WORD_COUNT'
    );

    assert.strictEqual(wordCount.status, 'PASS');
    assert.strictEqual(wordCount.title, 'Answer-First 5-7 Word Length');
  });
});
