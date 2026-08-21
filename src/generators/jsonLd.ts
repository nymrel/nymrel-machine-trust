import {
  MachineTrustConfig,
  OrganizationConfig,
  ParentOrganizationConfig,
  ProductConfig,
  FAQItem,
  BreadcrumbItem,
} from '../types.js';

/**
 * Creates canonical Nymrel -> JalenBuilds LLC parent organization hierarchy
 */
export function createDefaultParentHierarchy(): ParentOrganizationConfig {
  return {
    name: 'Nymrel',
    legalName: 'Nymrel (a JalenBuilds LLC company)',
    url: 'https://nymrel.com',
    description: 'Autonomous software systems and digital services umbrella.',
    parentOrganization: {
      name: 'JalenBuilds LLC',
      legalName: 'JalenBuilds LLC',
      url: 'https://nymrel.com',
      description: 'Parent holding company and technical venture studio.',
    },
  };
}

/**
 * Builds Schema.org JSON-LD @graph matching Dual-Audience machine trust specifications
 */
export function generateJsonLd(config: MachineTrustConfig): Record<string, any> {
  const graph: any[] = [];
  const entity = config.entity;

  // 1. Organization Entity
  const parentOrg = entity.parentOrganization || createDefaultParentHierarchy();

  const buildParentOrgJson = (parent: ParentOrganizationConfig): any => {
    const obj: any = {
      '@type': 'Organization',
      name: parent.name,
      url: parent.url,
    };
    if (parent.legalName) obj.legalName = parent.legalName;
    if (parent.logo) obj.logo = parent.logo;
    if (parent.description) obj.description = parent.description;
    if (parent.parentOrganization) {
      obj.parentOrganization = buildParentOrgJson(parent.parentOrganization);
    }
    return obj;
  };

  const organizationEntity: any = {
    '@type': 'Organization',
    '@id': `${entity.url}#organization`,
    name: entity.name,
    url: entity.url,
    description: entity.description,
  };

  if (entity.legalName) organizationEntity.legalName = entity.legalName;
  if (entity.logo) organizationEntity.logo = entity.logo;
  if (entity.email) organizationEntity.email = entity.email;
  if (entity.telephone) organizationEntity.telephone = entity.telephone;
  if (entity.sameAs && entity.sameAs.length > 0) organizationEntity.sameAs = entity.sameAs;
  if (entity.foundingDate) organizationEntity.foundingDate = entity.foundingDate;
  if (parentOrg) organizationEntity.parentOrganization = buildParentOrgJson(parentOrg);

  graph.push(organizationEntity);

  // 2. WebSite Entity
  const websiteEntity: any = {
    '@type': 'WebSite',
    '@id': `${entity.url}#website`,
    url: entity.url,
    name: entity.name,
    description: entity.description,
    publisher: {
      '@id': `${entity.url}#organization`,
    },
  };
  graph.push(websiteEntity);

  // 3. Product / SoftwareApplication Entity
  if (config.product) {
    const prod = config.product;
    const isSoftware = !!prod.softwareApplication;
    const productType = isSoftware ? 'SoftwareApplication' : 'Product';

    const productEntity: any = {
      '@type': productType,
      '@id': `${prod.url || entity.url}#${isSoftware ? 'software' : 'product'}`,
      name: prod.name,
      description: prod.description,
      brand: {
        '@type': 'Brand',
        name: prod.brand || entity.name,
      },
    };

    if (prod.url) productEntity.url = prod.url;
    if (prod.image) productEntity.image = prod.image;
    if (prod.sku) productEntity.sku = prod.sku;
    if (prod.category) productEntity.category = prod.category;

    if (isSoftware && prod.softwareApplication) {
      const sw = prod.softwareApplication;
      if (sw.applicationCategory) productEntity.applicationCategory = sw.applicationCategory;
      if (sw.operatingSystem) productEntity.operatingSystem = sw.operatingSystem;
      if (sw.version) productEntity.softwareVersion = sw.version;
      if (sw.downloadUrl) productEntity.downloadUrl = sw.downloadUrl;
      if (sw.requirements) productEntity.requirements = sw.requirements;
      if (sw.features && sw.features.length > 0) {
        productEntity.featureList = sw.features.join(', ');
      }
    }

    if (prod.offers) {
      const formatOffer = (offer: any) => {
        const offerObj: any = {
          '@type': 'Offer',
          price: String(offer.price),
          priceCurrency: offer.priceCurrency,
          availability: offer.availability
            ? (offer.availability.startsWith('http') ? offer.availability : `https://schema.org/${offer.availability}`)
            : 'https://schema.org/InStock',
        };
        if (offer.url) offerObj.url = offer.url;
        if (offer.priceValidUntil) offerObj.priceValidUntil = offer.priceValidUntil;
        if (offer.itemCondition) offerObj.itemCondition = offer.itemCondition;
        return offerObj;
      };

      if (Array.isArray(prod.offers)) {
        productEntity.offers = prod.offers.map(formatOffer);
      } else {
        productEntity.offers = formatOffer(prod.offers);
      }
    }

    if (prod.aggregateRating) {
      productEntity.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: prod.aggregateRating.ratingValue,
        reviewCount: prod.aggregateRating.reviewCount,
        bestRating: prod.aggregateRating.bestRating || 5,
        worstRating: prod.aggregateRating.worstRating || 1,
      };
    }

    graph.push(productEntity);
  }

  // 4. FAQPage Entity
  if (config.faqs && config.faqs.length > 0) {
    const faqEntity: any = {
      '@type': 'FAQPage',
      '@id': `${entity.url}#faq`,
      mainEntity: config.faqs.map((faq: FAQItem) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
    graph.push(faqEntity);
  }

  // 5. BreadcrumbList Entity
  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    const breadcrumbEntity: any = {
      '@type': 'BreadcrumbList',
      '@id': `${entity.url}#breadcrumbs`,
      itemListElement: config.breadcrumbs.map((bc: BreadcrumbItem, index: number) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: bc.name,
        item: bc.item,
      })),
    };
    graph.push(breadcrumbEntity);
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  };
}

/**
 * Formats JSON-LD graph into an HTML <script type="application/ld+json"> tag
 */
export function generateJsonLdScriptTag(
  config: MachineTrustConfig,
  options: { minify?: boolean } = {}
): string {
  const data = generateJsonLd(config);
  const jsonString = options.minify ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  return `<script type="application/ld+json">\n${jsonString}\n</script>`;
}

/**
 * Validates JSON-LD graph structure according to Dual-Audience standards
 */
export function validateJsonLdStructure(jsonLd: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!jsonLd || typeof jsonLd !== 'object') {
    return { valid: false, errors: ['JSON-LD must be an object'], warnings: [] };
  }

  if (jsonLd['@context'] !== 'https://schema.org' && jsonLd['@context'] !== 'http://schema.org') {
    errors.push("Missing or invalid @context. Must be 'https://schema.org'");
  }

  const graph = jsonLd['@graph'];
  if (!Array.isArray(graph) || graph.length === 0) {
    errors.push('Missing or empty @graph array');
    return { valid: false, errors, warnings };
  }

  // Check for Organization
  const org = graph.find((item: any) => item['@type'] === 'Organization');
  if (!org) {
    errors.push("Missing 'Organization' entity in @graph");
  } else {
    if (!org.name) errors.push("Organization missing 'name'");
    if (!org.url) errors.push("Organization missing 'url'");
    if (!org.parentOrganization) {
      warnings.push("Organization missing 'parentOrganization' for verifiable machine trust lineage");
    } else {
      const parent = org.parentOrganization;
      if (!parent.name) warnings.push("parentOrganization missing 'name'");
    }
  }

  // Check for WebSite
  const website = graph.find((item: any) => item['@type'] === 'WebSite');
  if (!website) {
    warnings.push("Missing 'WebSite' entity linking to publisher");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
