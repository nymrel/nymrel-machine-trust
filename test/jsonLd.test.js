import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  generateJsonLd,
  validateJsonLdStructure,
  validateNymrelLineage,
  createDefaultParentHierarchy,
  NYMREL_ORGANIZATION_ID,
  CANONICAL_NYMREL_ORG_NAME,
  CANONICAL_LEGAL_NAME,
} from '../dist/generators/jsonLd.js';

const codesOf = (result) => result.issues.map((issue) => issue.code);

describe('JSON-LD & Schema.org Graph Generator', () => {
  const sampleConfig = {
    entity: {
      name: 'Nymrel',
      legalName: 'JalenBuilds LLC',
      url: 'https://nymrel.com/',
      description: 'Nymrel builds and runs products, services, websites, software, and apps.',
    },
    product: {
      name: 'Machine Trust Core',
      description: 'A library and CLI for inspecting machine-readable web evidence.',
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
        features: ['Schema.org validation', 'crawler policy checks', 'rendered-copy parity'],
      },
    },
    faqs: [
      {
        question: 'What does Machine Trust inspect?',
        answer: 'It checks structured data, crawler rules, machine indexes, and rendered-copy parity.',
      },
    ],
    breadcrumbs: [
      { name: 'Home', item: 'https://nymrel.com' },
      { name: 'Machine Trust', item: 'https://nymrel.com/machine-trust' },
    ],
  };

  test('generates a valid graph without inventing a corporate parent', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    assert.strictEqual(jsonLd['@context'], 'https://schema.org');
    assert.ok(Array.isArray(jsonLd['@graph']));
    assert.strictEqual(jsonLd['@graph'].length, 5);

    const org = jsonLd['@graph'].find((item) => item['@type'] === 'Organization');
    assert.strictEqual(org.name, 'Nymrel');
    assert.strictEqual(org.legalName, 'JalenBuilds LLC');
    assert.strictEqual(org.parentOrganization, undefined);
    assert.deepStrictEqual(validateNymrelLineage(jsonLd).issues, []);
  });

  test('correctly configures SoftwareApplication, FAQPage, and BreadcrumbList', () => {
    const jsonLd = generateJsonLd(sampleConfig);
    const sw = jsonLd['@graph'].find((item) => item['@type'] === 'SoftwareApplication');
    const faq = jsonLd['@graph'].find((item) => item['@type'] === 'FAQPage');
    const breadcrumbs = jsonLd['@graph'].find((item) => item['@type'] === 'BreadcrumbList');

    assert.ok(sw.featureList.includes('Schema.org validation'));
    assert.strictEqual(sw.offers[0].price, '0.00');
    assert.strictEqual(faq.mainEntity[0].name, 'What does Machine Trust inspect?');
    assert.strictEqual(breadcrumbs.itemListElement.length, 2);
  });

  test('validates structure successfully with zero errors', () => {
    const validation = validateJsonLdStructure(generateJsonLd(sampleConfig));
    assert.strictEqual(validation.valid, true);
    assert.deepStrictEqual(validation.errors, []);
  });

  test('keeps an explicitly configured non-Nymrel parent relationship', () => {
    const graph = generateJsonLd({
      entity: {
        name: 'Example Subsidiary',
        url: 'https://subsidiary.example',
        description: 'A fictional subsidiary used to verify explicit relationships.',
        parentOrganization: {
          name: 'Example Holdings',
          legalName: 'Example Holdings LLC',
          url: 'https://holdings.example',
        },
      },
    });
    const org = graph['@graph'].find((item) => item['@type'] === 'Organization');
    assert.strictEqual(org.parentOrganization.name, 'Example Holdings');
    assert.strictEqual(org.parentOrganization.legalName, 'Example Holdings LLC');
  });

  test('retains the deprecated hierarchy helper without a false subsidiary chain', () => {
    const canonical = createDefaultParentHierarchy();
    assert.strictEqual(canonical.name, CANONICAL_NYMREL_ORG_NAME);
    assert.strictEqual(canonical.legalName, CANONICAL_LEGAL_NAME);
    assert.strictEqual(canonical.parentOrganization, undefined);
  });
});

describe('Truthful Nymrel relationship validation', () => {
  const graphWithOrg = (org, extra = []) => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://example.example/#organization',
        name: 'Example Property',
        url: 'https://example.example',
        ...org,
      },
      ...extra,
    ],
  });

  test('treats absence of a Nymrel relationship as truthful', () => {
    const graph = generateJsonLd({
      entity: {
        name: 'Independent Example',
        url: 'https://independent.example',
        description: 'A fictional independent business.',
      },
    });
    const org = graph['@graph'].find((item) => item['@type'] === 'Organization');
    assert.strictEqual(org.parentOrganization, undefined);
    assert.strictEqual(org.creator, undefined);
    assert.deepStrictEqual(validateNymrelLineage(graph).issues, []);
  });

  test('emits the canonical creator reference only when explicitly requested', () => {
    const graph = generateJsonLd({
      entity: {
        name: 'Partner Example',
        url: 'https://partner.example',
        description: 'A fictional property that explicitly credits its creator.',
        nymrelAttribution: true,
      },
    });
    const org = graph['@graph'].find((item) => item['@type'] === 'Organization');
    assert.deepStrictEqual(org.creator, { '@id': NYMREL_ORGANIZATION_ID });
    assert.strictEqual(org.parentOrganization, undefined);
    assert.deepStrictEqual(validateNymrelLineage(graph).issues, []);
  });

  test('accepts the canonical single-node Nymrel identity', () => {
    const result = validateNymrelLineage(
      graphWithOrg({
        '@id': NYMREL_ORGANIZATION_ID,
        name: CANONICAL_NYMREL_ORG_NAME,
        legalName: CANONICAL_LEGAL_NAME,
        url: 'https://nymrel.com',
      })
    );
    assert.strictEqual(result.valid, true);
    assert.deepStrictEqual(result.issues, []);
  });

  test('rejects the retired Nymrel to JalenBuilds LLC parent chain', () => {
    assert.throws(
      () =>
        generateJsonLd({
          entity: {
            name: 'Partner Example',
            url: 'https://partner.example',
            description: 'A fictional partner property.',
            parentOrganization: {
              name: 'Nymrel',
              url: 'https://nymrel.com',
              parentOrganization: {
                name: 'JalenBuilds LLC',
                url: 'https://nymrel.com',
              },
            },
          },
        }),
      (error) => error?.code === 'PARENT_ORGANIZATION_MISSTATEMENT'
    );

    const result = validateNymrelLineage(
      graphWithOrg({
        parentOrganization: {
          '@type': 'Organization',
          name: 'Nymrel',
          url: 'https://nymrel.com',
          parentOrganization: {
            '@type': 'Organization',
            name: 'JalenBuilds LLC',
            url: 'https://nymrel.com',
          },
        },
      })
    );
    assert.strictEqual(result.valid, false);
    assert.deepStrictEqual(codesOf(result), ['PARENT_MISSTATEMENT', 'PARENT_MISSTATEMENT']);
  });

  test('fails closed on malformed, cyclic, or self-contradictory explicit input', () => {
    const base = {
      name: 'Malformed Example',
      url: 'https://malformed.example',
      description: 'A fictional malformed configuration.',
    };

    assert.throws(
      () => generateJsonLd({ entity: { ...base, parentOrganization: { name: '', url: '' } } }),
      (error) => error?.code === 'PARENT_ORGANIZATION_MALFORMED'
    );

    const cyclic = { name: 'Example Holdings', url: 'https://holdings.example' };
    cyclic.parentOrganization = cyclic;
    assert.throws(
      () => generateJsonLd({ entity: { ...base, parentOrganization: cyclic } }),
      (error) => error?.code === 'PARENT_ORGANIZATION_CYCLE'
    );

    assert.throws(
      () =>
        generateJsonLd({
          entity: {
            ...base,
            url: 'https://nymrel.com',
            nymrelAttribution: true,
          },
        }),
      (error) => error?.code === 'CONTRADICTORY_NYMREL_ATTRIBUTION'
    );
  });

  test('rejects rebuilt, altered, or falsely parented canonical relationships', () => {
    const malformedCreator = validateNymrelLineage(
      graphWithOrg({
        creator: {
          '@type': 'Organization',
          '@id': NYMREL_ORGANIZATION_ID,
          name: 'Nymrel',
        },
      })
    );
    assert.deepStrictEqual(codesOf(malformedCreator), ['MALFORMED_CREATOR_REFERENCE']);

    const rebuilt = validateNymrelLineage(
      graphWithOrg(
        { creator: { '@id': NYMREL_ORGANIZATION_ID } },
        [{
          '@type': 'Organization',
          '@id': NYMREL_ORGANIZATION_ID,
          name: 'Nymrel',
          legalName: 'JalenBuilds LLC',
          url: 'https://nymrel.com',
        }]
      )
    );
    assert.deepStrictEqual(codesOf(rebuilt), ['CANONICAL_NODE_REBUILT']);

    const selfWithParent = validateNymrelLineage(
      graphWithOrg({
        '@id': NYMREL_ORGANIZATION_ID,
        name: 'Nymrel',
        legalName: 'JalenBuilds LLC',
        parentOrganization: { name: 'JalenBuilds LLC' },
      })
    );
    assert.ok(codesOf(selfWithParent).includes('FALSE_SUBSIDIARY_CHAIN'));
  });

  test('reports unverifiable input deterministically', () => {
    const first = validateNymrelLineage(null);
    const second = validateNymrelLineage(null);
    assert.deepStrictEqual(first, second);
    assert.deepStrictEqual(codesOf(first), ['LINEAGE_UNVERIFIABLE']);

    const noOrg = validateNymrelLineage({ '@context': 'https://schema.org', '@graph': [] });
    assert.deepStrictEqual(codesOf(noOrg), ['MISSING_ORGANIZATION']);
  });
});
