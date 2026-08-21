import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateLlmsTxt,
  generateLlmsFullTxt,
  estimateTokens,
  parseLlmsTxt,
} from '../dist/generators/llmsTxt.js';

describe('LLMs.txt & LLMs-Full.txt Generator', () => {
  const sampleLlmsConfig = {
    title: 'Nymrel Machine Trust Suite',
    summary: 'Autonomous AI search discoverability and verifiable entity graph generator.',
    sections: [
      {
        title: 'Core Tools',
        description: 'Primary utilities for machine trust generation.',
        links: [
          {
            title: 'JSON-LD Engine',
            url: 'https://nymrel.com/docs/jsonld',
            description: 'Generates Schema.org graphs with verified parent hierarchy.',
          },
          {
            title: 'Robots.txt Engine',
            url: 'https://nymrel.com/docs/robots',
            description: 'Configures OAI-SearchBot and PerplexityBot crawler policies.',
          },
        ],
      },
    ],
    optionalLinks: [
      {
        title: 'Parent Entity',
        url: 'https://nymrel.com',
        description: 'JalenBuilds LLC venture studio overview.',
      },
    ],
    tokenBudget: 1000,
  };

  test('generates valid markdown structure for /llms.txt', () => {
    const text = generateLlmsTxt(sampleLlmsConfig);
    assert.ok(text.startsWith('# Nymrel Machine Trust Suite'));
    assert.ok(text.includes('> Autonomous AI search discoverability'));
    assert.ok(text.includes('## Core Tools'));
    assert.ok(text.includes('- [JSON-LD Engine](https://nymrel.com/docs/jsonld): Generates Schema.org graphs'));
    assert.ok(text.includes('## Optional'));
  });

  test('generates extended /llms-full.txt', () => {
    const fullText = generateLlmsFullTxt(sampleLlmsConfig);
    assert.ok(fullText.includes('# Nymrel Machine Trust Suite'));
    assert.ok(fullText.includes('## Comprehensive Documentation & Machine Index'));
    assert.ok(fullText.includes('#### Core Tools'));
  });

  test('estimates tokens with reasonable heuristic', () => {
    const text = generateLlmsTxt(sampleLlmsConfig);
    const tokens = estimateTokens(text);
    assert.ok(tokens > 10, 'Tokens should be positive non-trivial number');
    assert.ok(tokens < 1000, 'Tokens should be well within 1000 token budget');
  });

  test('parses llms.txt back into structured sections', () => {
    const text = generateLlmsTxt(sampleLlmsConfig);
    const parsed = parseLlmsTxt(text);
    assert.strictEqual(parsed.title, 'Nymrel Machine Trust Suite');
    assert.strictEqual(parsed.sections.length, 2); // Core Tools + Optional
    assert.strictEqual(parsed.sections[0].title, 'Core Tools');
    assert.strictEqual(parsed.sections[0].links[0].title, 'JSON-LD Engine');
  });
});
