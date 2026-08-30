import type {
  MachineTrustConfig,
  OrganizationConfig,
  ParentOrganizationConfig,
  ProductConfig,
  FAQItem,
  BreadcrumbItem,
} from '../types.js';
import { MachineTrustConfigError } from '../errors.js';

/**
 * Canonical @id of the Nymrel organization node, used for attribution by
 * reference. Nymrel is the studio brand; its legal entity is expressed via
 * `legalName` — never as a minted subsidiary chain inside someone else's graph.
 */
export const NYMREL_ORGANIZATION_ID = 'https://nymrel.com/#organization';

/**
 * Canonical names for verifiable machine trust: 'Nymrel' is the studio brand
 * carried by `name`, and 'JalenBuilds LLC' is its operating legal entity,
 * carried by `legalName`. The pair describes ONE organization node — never a
 * two-node subsidiary chain.
 */
export const CANONICAL_NYMREL_ORG_NAME = 'Nymrel';
export const CANONICAL_LEGAL_NAME = 'JalenBuilds LLC';

/**
 * Canonical single-node description of the Nymrel organization:
 * `legalName` carries the operating legal entity (JalenBuilds LLC). Nymrel is
 * not modeled as a subsidiary with a separate parent node — there is no such
 * parent, and asserting one would be false.
 *
 * Opt-in utility for graphs that legitimately describe Nymrel inline (e.g.
 * nymrel.com itself). Built/partner properties must not embed this node; they
 * attribute via `entity.nymrelAttribution`, which emits a bare `@id` creator
 * reference instead.
 */
export function createCanonicalNymrelOrganization(): ParentOrganizationConfig {
  return {
    name: CANONICAL_NYMREL_ORG_NAME,
    legalName: CANONICAL_LEGAL_NAME,
    url: 'https://nymrel.com',
    description: 'Autonomous software systems and digital services studio.',
  };
}

/**
 * Deprecated alias for {@link createCanonicalNymrelOrganization}. The name
 * suggested a default hierarchy that was never applied implicitly and whose
 * nested subsidiary-chain shape misrepresented the legal structure. Retained
 * only for backward compatibility; new code should use the canonical helper.
 *
 * The generator NEVER applies any hierarchy implicitly: when a config omits
 * `entity.parentOrganization`, the generated graph asserts no corporate
 * parent at all.
 *
 * @deprecated Use {@link createCanonicalNymrelOrganization}.
 */
export function createDefaultParentHierarchy(): ParentOrganizationConfig {
  return createCanonicalNymrelOrganization();
}

function assertPlainObject(value: any): void {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new MachineTrustConfigError(
      'PARENT_ORGANIZATION_MALFORMED',
      "'parentOrganization' must be an object with non-empty string 'name' and 'url'"
    );
  }
}

/**
 * Deterministically validates caller-supplied explicit relationships.
 * Fails closed on malformed nodes, cycles, and contradictory Nymrel claims;
 * absence of relationships is valid and produces no lineage output.
 */
export function validateExplicitEntityRelationships(entity: OrganizationConfig): void {
  if (entity.nymrelAttribution !== undefined && typeof entity.nymrelAttribution !== 'boolean') {
    throw new MachineTrustConfigError(
      'INVALID_NYMREL_ATTRIBUTION',
      `'entity.nymrelAttribution' must be a boolean when present (received ${typeof entity.nymrelAttribution})`
    );
  }

  // Contradiction: a nymrel.com property cannot be "created by" Nymrel by
  // reference — self-attribution would misstate the relationship.
  if (entity.nymrelAttribution === true) {
    let host = '';
    try {
      host = new URL(entity.url).hostname.toLowerCase();
    } catch {
      host = '';
    }
    if (host === 'nymrel.com' || host.endsWith('.nymrel.com')) {
      throw new MachineTrustConfigError(
        'CONTRADICTORY_NYMREL_ATTRIBUTION',
        `'entity.nymrelAttribution' contradicts the entity itself being a nymrel.com property (${entity.url}); owned properties are the attribution target, not its subject`
      );
    }
  }

  const seen = new Set<string>();
  let node = entity.parentOrganization;
  let depth = 0;
  while (node !== undefined && node !== null) {
    assertPlainObject(node);
    if (typeof node.name !== 'string' || node.name.trim() === '') {
      throw new MachineTrustConfigError(
        'PARENT_ORGANIZATION_MALFORMED',
        `'parentOrganization.name' must be a non-empty string at chain depth ${depth}`
      );
    }
    if (typeof node.url !== 'string' || node.url.trim() === '') {
      throw new MachineTrustConfigError(
        'PARENT_ORGANIZATION_MALFORMED',
        `'parentOrganization.url' must be a non-empty string at chain depth ${depth} ('${node.name}')`
      );
    }
    const identity = `${node.name.trim()}|${node.url.trim()}`;
    if (seen.has(identity)) {
      throw new MachineTrustConfigError(
        'PARENT_ORGANIZATION_CYCLE',
        `Explicit parentOrganization chain contains a cycle at '${node.name}'`
      );
    }
    seen.add(identity);
    assertTruthfulParentIdentity(node.name.trim(), depth);
    node = node.parentOrganization;
    depth++;
  }
}

/**
 * Fails closed when an explicit parentOrganization node claims one of the
 * canonical Nymrel identities as a *corporate parent*. 'Nymrel' is a studio
 * brand whose legal entity is expressed via `legalName`, not a subsidiary with
 * its own parent; built/partner properties attribute via
 * `nymrelAttribution` (a bare creator `@id`) instead.
 */
function assertTruthfulParentIdentity(parentName: string, depth: number): void {
  if (parentName === CANONICAL_NYMREL_ORG_NAME) {
    throw new MachineTrustConfigError(
      'PARENT_ORGANIZATION_MISSTATEMENT',
      `'${CANONICAL_NYMREL_ORG_NAME}' cannot be declared as a corporate parent (chain depth ${depth}): it is the studio brand that BUILT this property. For built/partner attribution set entity.nymrelAttribution=true, which emits creator {"@id":"${NYMREL_ORGANIZATION_ID}"} by reference`
    );
  }
  if (parentName === CANONICAL_LEGAL_NAME) {
    throw new MachineTrustConfigError(
      'PARENT_ORGANIZATION_MISSTATEMENT',
      `'${CANONICAL_LEGAL_NAME}' cannot be declared as a separate corporate parent (chain depth ${depth}): it is already the legalName of the '${CANONICAL_NYMREL_ORG_NAME}' organization itself; minting it as a parent node asserts a false subsidiary chain. On Nymrel-operated properties set entity.legalName='${CANONICAL_LEGAL_NAME}' and omit parentOrganization`
    );
  }
}

/**
 * Builds Schema.org JSON-LD @graph matching Dual-Audience machine trust specifications
 */
export function generateJsonLd(config: MachineTrustConfig): Record<string, any> {
  const graph: any[] = [];
  const entity = config.entity;

  validateExplicitEntityRelationships(entity);

  // 1. Organization Entity — explicit relationships only; nothing is implied.
  const parentOrg = entity.parentOrganization;

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

  // Explicit attribution by reference: point at the canonical Nymrel node
  // without rebuilding that organization inline in this graph.
  if (entity.nymrelAttribution === true) {
    organizationEntity.creator = { '@id': NYMREL_ORGANIZATION_ID };
  }

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

/** Serializes JSON-LD for an HTML script-data context without raw markup tokens. */
export function serializeJsonLdForHtml(
  data: unknown,
  options: { minify?: boolean } = {}
): string {
  const serialized = options.minify ? JSON.stringify(data) : JSON.stringify(data, null, 2);
  if (serialized === undefined) {
    throw new TypeError('JSON-LD input must be JSON-serializable.');
  }
  // HTML parses script contents before JSON. Escape markup-significant code
  // points so caller-controlled text cannot terminate the JSON-LD element.
  return serialized
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Formats JSON-LD graph into an HTML <script type="application/ld+json"> tag
 */
export function generateJsonLdScriptTag(
  config: MachineTrustConfig,
  options: { minify?: boolean } = {}
): string {
  const data = generateJsonLd(config);
  const jsonString = serializeJsonLdForHtml(data, options);
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
    // Absence of a corporate parent is truthful, not a finding. A declared
    // parent that is structurally hollow is still flagged.
    const parent = org.parentOrganization;
    if (parent !== undefined && parent !== null) {
      if (typeof parent !== 'object' || Array.isArray(parent)) {
        warnings.push("'parentOrganization' must be an Organization object");
      } else if (!parent.name) {
        warnings.push("parentOrganization missing 'name'");
      }
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

/** A single structured finding from canonical-relationship validation */
export interface LineageIssue {
  /** Stable machine-readable code, safe to gate on in CI */
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

/** Deterministic result of canonical relationship validation */
export interface LineageValidationResult {
  /** True when the graph's Nymrel relationship (if any) is expressed truthfully */
  valid: boolean;
  errors: string[];
  warnings: string[];
  issues: LineageIssue[];
}

function finalizeLineageResult(issues: LineageIssue[]): LineageValidationResult {
  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    errors: issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
    warnings: issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
    issues,
  };
}

function isOrgNodeObject(value: any): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function trimmedOrgName(node: any): string | undefined {
  return typeof node?.name === 'string' ? node.name.trim() : undefined;
}

/**
 * Opt-in validator: checks how a JSON-LD graph relates to the canonical Nymrel
 * organization, per the truthful relationship model. Read-only — it never
 * rewrites the graph or asserts anything about deployments.
 *
 * Canonical model:
 * - The Nymrel organization is ONE node (`name: 'Nymrel'`,
 *   `legalName: 'JalenBuilds LLC'`, canonical `@id`
 *   {@link NYMREL_ORGANIZATION_ID}). It has no corporate parent; expressing
 *   JalenBuilds LLC as a separate parentOrganization node asserts a false
 *   subsidiary chain.
 * - Built/partner properties attribute via a bare creator reference,
 *   `{ "@id": "https://nymrel.com/#organization" }` — the canonical node is
 *   never rebuilt inline alongside the reference.
 * - Generic sites with no Nymrel relationship are VALID with zero findings;
 *   absence of attribution is truthful, not an error.
 *
 * Accepts either a full `{ @context, @graph }` document or a bare Organization
 * node. When multiple top-level Organization entities exist, the primary one is
 * selected deterministically (`@id` ending in '#organization', else first in
 * graph order). Names are matched exactly (whitespace-trimmed,
 * case-sensitive) against the canonical constants.
 *
 * Findings are stable, machine-readable issues suitable for CI gates. Generic
 * structural validation remains available via `validateJsonLdStructure`.
 */
export function validateNymrelLineage(jsonLd: any): LineageValidationResult {
  const issues: LineageIssue[] = [];
  const add = (code: string, severity: 'error' | 'warning', message: string): void => {
    issues.push({ code, severity, message });
  };

  if (!isOrgNodeObject(jsonLd)) {
    add('LINEAGE_UNVERIFIABLE', 'error', 'Input must be a JSON-LD object');
    return finalizeLineageResult(issues);
  }

  let graphNodes: any[] = [jsonLd];
  let org: any;
  if (Array.isArray(jsonLd['@graph'])) {
    graphNodes = jsonLd['@graph'];
    const orgs = graphNodes.filter(
      (item: any) => isOrgNodeObject(item) && item['@type'] === 'Organization'
    );
    org =
      orgs.find(
        (item: any) => typeof item['@id'] === 'string' && item['@id'].endsWith('#organization')
      ) || orgs[0];
    if (!org) {
      add('MISSING_ORGANIZATION', 'error', "No 'Organization' entity found in @graph");
      return finalizeLineageResult(issues);
    }
  } else if (jsonLd['@type'] === 'Organization') {
    org = jsonLd;
  } else {
    add(
      'LINEAGE_UNVERIFIABLE',
      'error',
      'Input must be a JSON-LD document with an @graph array, or a bare Organization node'
    );
    return finalizeLineageResult(issues);
  }

  // --- Collect every signal that ties this graph to the canonical Nymrel model.
  const isSelfNymrel =
    trimmedOrgName(org) === CANONICAL_NYMREL_ORG_NAME ||
    org['@id'] === NYMREL_ORGANIZATION_ID;

  const hasCreator = org.creator !== undefined && org.creator !== null;

  // An inline rebuild is a full Organization node carrying the canonical @id in
  // addition to (or instead of) the bare reference — allowed only when it IS
  // the primary self-description (nymrel.com's own graph).
  const inlineCanonicalNode = graphNodes.find(
    (item: any) =>
      isOrgNodeObject(item) && item['@type'] === 'Organization' &&
      item['@id'] === NYMREL_ORGANIZATION_ID && item !== org
  );

  // Walk the declared parent chain (any depth), recording canonical identities.
  const parentChainCanonicalNames: string[] = [];
  let chainNode = org.parentOrganization;
  while (chainNode !== undefined && chainNode !== null) {
    const name = trimmedOrgName(chainNode);
    if (name === CANONICAL_NYMREL_ORG_NAME || name === CANONICAL_LEGAL_NAME) {
      parentChainCanonicalNames.push(name);
    }
    chainNode = isOrgNodeObject(chainNode) ? chainNode.parentOrganization : undefined;
  }

  const noRelationshipAtAll =
    !isSelfNymrel && !hasCreator && parentChainCanonicalNames.length === 0;

  // Generic site: nothing asserts a Nymrel relationship, and that is truthful.
  // No lineage requirement is imposed on properties that never claim one.
  if (noRelationshipAtAll) {
    return finalizeLineageResult(issues);
  }

  // --- Self-description rules (the Nymrel organization describing itself).
  if (isSelfNymrel) {
    const legalName = typeof org.legalName === 'string' ? org.legalName.trim() : undefined;
    if (legalName === undefined) {
      add(
        'MISSING_LEGAL_NAME',
        'error',
        `The '${CANONICAL_NYMREL_ORG_NAME}' organization must carry legalName '${CANONICAL_LEGAL_NAME}' so machines can verify the operating legal entity`
      );
    } else if (legalName !== CANONICAL_LEGAL_NAME) {
      add(
        'INCORRECT_LEGAL_NAME',
        'error',
        `The '${CANONICAL_NYMREL_ORG_NAME}' organization legalName ${JSON.stringify(org.legalName)} does not match canonical '${CANONICAL_LEGAL_NAME}'`
      );
    }

    if (org.parentOrganization !== undefined && org.parentOrganization !== null) {
      add(
        'FALSE_SUBSIDIARY_CHAIN',
        'error',
        `'${CANONICAL_NYMREL_ORG_NAME}' declares a parentOrganization but has none: it is not a subsidiary. Express the legal entity as legalName '${CANONICAL_LEGAL_NAME}' on this same node and remove the parentOrganization chain`
      );
    }
  }

  // --- Attribution-by-reference rules (built/partner properties).
  if (hasCreator) {
    const creator = org.creator;
    const validReference =
      isOrgNodeObject(creator) &&
      Object.keys(creator).length > 0 &&
      creator['@id'] === NYMREL_ORGANIZATION_ID &&
      Object.keys(creator).every((key) => key === '@id' || key === '@type');
    if (!validReference) {
      add(
        'MALFORMED_CREATOR_REFERENCE',
        'error',
        `creator must be the bare reference {"@id":"${NYMREL_ORGANIZATION_ID}"}; rebuilt or altered creator nodes misstate the relationship`
      );
    }
    if (inlineCanonicalNode) {
      add(
        'CANONICAL_NODE_REBUILT',
        'error',
        `Graph embeds a full Organization node for ${NYMREL_ORGANIZATION_ID} alongside a creator reference; attribute by @id only and do not rebuild the canonical organization inline`
      );
    }
  }

  // --- Parent-chain rules (canonical identities can never be parents).
  for (const name of parentChainCanonicalNames) {
    if (name === CANONICAL_NYMREL_ORG_NAME && !isSelfNymrel) {
      add(
        'PARENT_MISSTATEMENT',
        'error',
        `'${CANONICAL_NYMREL_ORG_NAME}' is listed as a corporate parent but it is the studio that BUILT this property. Use creator {"@id":"${NYMREL_ORGANIZATION_ID}"} (entity.nymrelAttribution=true) instead of a parentOrganization chain`
      );
    }
    if (name === CANONICAL_LEGAL_NAME && !isSelfNymrel) {
      add(
        'PARENT_MISSTATEMENT',
        'error',
        `'${CANONICAL_LEGAL_NAME}' is listed as a separate corporate parent but it is already the legalName of the '${CANONICAL_NYMREL_ORG_NAME}' organization itself; minting it as a parent node asserts a false subsidiary chain`
      );
    }
  }

  return finalizeLineageResult(issues);
}
