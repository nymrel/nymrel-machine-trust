import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateJsonLd,
  validateJsonLdStructure,
  validateNymrelLineage,
  CANONICAL_INTERMEDIATE_ORG_NAME,
  CANONICAL_ROOT_ORG_NAME,
} from '../dist/generators/jsonLd.js';

describe('JSON-LD & Schema.org Graph Generator', () => {
  const sampleConfig = {
    entity: {
      name: 'Nymrel Platform',
      legalName: 'Nymrel Platform (a JalenBuilds LLC company)',
      url: 'https://nymrel.com',
      description: 'Autonomous machine trust and web infrastructure.',
      parentOrganization: {
        name: 'Nymrel',
        url: 'https://nymrel.com',
        parentOrganization: {
          name: 'JalenBuilds LLC',
          legalName: 'JalenBuilds LLC',
          url: 'https://nymrel.com',
        },
      },
    },
    product: {
      name: 'Machine Trust Core',
      description: 'Dual-Audience Machine Trust library for AI search discoverability.',
      brand: 'Nymrel',
      url: 'https://nymrel.com/machine-trust',
      offers: [
        {
          price: '0.00',
          priceCurrency: 'USD',
          availability: 'InStock',
        },
      ],
      softwareApplication: {
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Cross-platform',
        features: ['Schema.org validation', 'AI Search Crawler posture', 'Answer-First SSR'],
      },
    },
    faqs: [
      {
        question: 'What is Dual-Audience machine trust?',
        answer: 'Dual-Audience design optimizes web applications for both human visitors and autonomous AI search crawlers.',
      },
    ],
    breadcrumbs: [
      { name: 'Home', item: 'https://nymrel.com' },
      { name: 'Machine Trust', item: 'https://nymrel.com/machine-trust' },
    ],
  };

  test('generates valid Schema.org @graph context', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    assert.strictEqual(jsonLd['@context'], 'https://schema.org');
    assert.ok(Array.isArray(jsonLd['@graph']));
    assert.strictEqual(jsonLd['@graph'].length, 5); // Org, WebSite, SoftwareApplication, FAQPage, BreadcrumbList
  });

  test('correctly forms Nymrel -> JalenBuilds LLC parentOrganization hierarchy', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    const org = jsonLd['@graph'].find((i) => i['@type'] === 'Organization');
    assert.ok(org, 'Organization entity exists');
    assert.strictEqual(org.name, 'Nymrel Platform');
    assert.ok(org.parentOrganization, 'parentOrganization exists');
    assert.strictEqual(org.parentOrganization.name, 'Nymrel');
    assert.strictEqual(org.parentOrganization.parentOrganization.name, 'JalenBuilds LLC');
  });

  test('correctly configures SoftwareApplication with features and offers', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    const sw = jsonLd['@graph'].find((i) => i['@type'] === 'SoftwareApplication');
    assert.ok(sw, 'SoftwareApplication entity exists');
    assert.strictEqual(sw.name, 'Machine Trust Core');
    assert.strictEqual(sw.operatingSystem, 'Cross-platform');
    assert.ok(sw.featureList.includes('Schema.org validation'));
    assert.strictEqual(sw.offers[0].price, '0.00');
    assert.strictEqual(sw.offers[0].priceCurrency, 'USD');
  });

  test('correctly formats FAQPage and BreadcrumbList', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    const faq = jsonLd['@graph'].find((i) => i['@type'] === 'FAQPage');
    assert.ok(faq, 'FAQPage exists');
    assert.strictEqual(faq.mainEntity[0].name, 'What is Dual-Audience machine trust?');

    const breadcrumbs = jsonLd['@graph'].find((i) => i['@type'] === 'BreadcrumbList');
    assert.ok(breadcrumbs, 'BreadcrumbList exists');
    assert.strictEqual(breadcrumbs.itemListElement.length, 2);
    assert.strictEqual(breadcrumbs.itemListElement[0].position, 1);
  });

  test('validates structure successfully with zero errors', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    const validation = validateJsonLdStructure(jsonLd);
    assert.strictEqual(validation.valid, true);
    assert.strictEqual(validation.errors.length, 0);
  });
});

describe('Canonical Nymrel lineage validation', () => {
  const canonicalConfig = {
    entity: {
      name: 'Example App',
      url: 'https://example.com',
      description: 'Example application used for lineage validation.',
      parentOrganization: {
        name: 'Nymrel',
        url: 'https://nymrel.com',
        parentOrganization: {
          name: 'JalenBuilds LLC',
          url: 'https://nymrel.com',
        },
      },
    },
  };

  const canonicalChain = {
    name: 'Nymrel',
    url: 'https://nymrel.com',
    parentOrganization: {
      name: 'JalenBuilds LLC',
      legalName: 'JalenBuilds LLC',
      url: 'https://nymrel.com',
    },
  };

  const graphWithLineage = (parentOrganization) => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://example.com/#organization',
        name: 'Example App',
        url: 'https://example.com',
        ...(parentOrganization ? { parentOrganization } : {}),
      },
    ],
  });

  const codesOf = (result) => result.issues.map((issue) => issue.code);

  test('accepts a generated canonical graph with zero issues', () => {
    const result = validateNymrelLineage(generateJsonLd(canonicalConfig));
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
    assert.strictEqual(result.warnings.length, 0);
    assert.deepStrictEqual(result.issues, []);
  });

  test('accepts the default injected hierarchy when config omits parentOrganization', () => {
    const config = {
      ...canonicalConfig,
      entity: { ...canonicalConfig.entity, parentOrganization: undefined },
    };
    const result = validateNymrelLineage(generateJsonLd(config));
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('accepts a bare Organization node carrying the canonical chain', () => {
    const orgNode = {
      '@type': 'Organization',
      name: 'Example App',
      url: 'https://example.com',
      parentOrganization: JSON.parse(JSON.stringify(canonicalChain)),
    };
    const result = validateNymrelLineage(orgNode);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.issues.length, 0);
  });

  test('exposes stable machine-readable issue shape and canonical names', () => {
    const result = validateNymrelLineage(graphWithLineage({ name: 'Acme Corp' }));
    for (const issue of result.issues) {
      assert.strictEqual(typeof issue.code, 'string');
      assert.ok(issue.severity === 'error' || issue.severity === 'warning');
      assert.strictEqual(typeof issue.message, 'string');
    }
    assert.strictEqual(CANONICAL_INTERMEDIATE_ORG_NAME, 'Nymrel');
    assert.strictEqual(CANONICAL_ROOT_ORG_NAME, 'JalenBuilds LLC');
  });

  test('rejects a graph with missing lineage entirely', () => {
    const result = validateNymrelLineage(graphWithLineage(undefined));
    assert.strictEqual(result.valid, false);
    assert.ok(codesOf(result).includes('MISSING_PARENT_ORGANIZATION'));
  });

  test('rejects an incorrect intermediate organization name', () => {
    const result = validateNymrelLineage(
      graphWithLineage({
        name: 'Acme Corp',
        url: 'https://acme.example',
        parentOrganization: { name: 'JalenBuilds LLC', url: 'https://nymrel.com' },
      })
    );
    assert.strictEqual(result.valid, false);
    assert.ok(codesOf(result).includes('INCORRECT_INTERMEDIATE_NAME'));
  });

  test('rejects a missing root organization node', () => {
    const result = validateNymrelLineage(
      graphWithLineage({ name: 'Nymrel', url: 'https://nymrel.com' })
    );
    assert.strictEqual(result.valid, false);
    assert.ok(codesOf(result).includes('MISSING_ROOT_ORGANIZATION'));
  });

  test('rejects an incorrect root organization name', () => {
    const result = validateNymrelLineage(
      graphWithLineage({
        name: 'Nymrel',
        url: 'https://nymrel.com',
        parentOrganization: { name: 'JalenBuilds Inc', url: 'https://nymrel.com' },
      })
    );
    assert.strictEqual(result.valid, false);
    assert.ok(codesOf(result).includes('INCORRECT_ROOT_NAME'));
  });

  test('warns without failing on nesting beyond the canonical root', () => {
    const chain = JSON.parse(JSON.stringify(canonicalChain));
    chain.parentOrganization.parentOrganization = { name: 'Beyond Root' };
    const result = validateNymrelLineage(graphWithLineage(chain));
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.warnings.length, 1);
    assert.deepStrictEqual(codesOf(result), ['UNEXPECTED_DEEPER_NESTING']);
  });

  test('reports unverifiable input deterministically across runs', () => {
    const first = validateNymrelLineage(null);
    const second = validateNymrelLineage(null);
    assert.strictEqual(first.valid, false);
    assert.deepStrictEqual(codesOf(first), ['LINEAGE_UNVERIFIABLE']);
    assert.deepStrictEqual(first, second);

    const noOrg = validateNymrelLineage({ '@context': 'https://schema.org', '@graph': [] });
    assert.strictEqual(noOrg.valid, false);
    assert.ok(codesOf(noOrg).includes('MISSING_ORGANIZATION'));
  });
});
