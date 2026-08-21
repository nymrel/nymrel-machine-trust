import { test, describe } from 'node:test';
import assert from 'node:assert';
import { generateJsonLd, validateJsonLdStructure } from '../dist/generators/jsonLd.js';

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
