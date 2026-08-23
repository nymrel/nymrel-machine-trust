"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_ROOT_ORG_NAME = exports.CANONICAL_INTERMEDIATE_ORG_NAME = void 0;
exports.createDefaultParentHierarchy = createDefaultParentHierarchy;
exports.generateJsonLd = generateJsonLd;
exports.generateJsonLdScriptTag = generateJsonLdScriptTag;
exports.validateJsonLdStructure = validateJsonLdStructure;
exports.validateNymrelLineage = validateNymrelLineage;
/**
 * Creates canonical Nymrel -> JalenBuilds LLC parent organization hierarchy
 */
function createDefaultParentHierarchy() {
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
function generateJsonLd(config) {
    const graph = [];
    const entity = config.entity;
    // 1. Organization Entity
    const parentOrg = entity.parentOrganization || createDefaultParentHierarchy();
    const buildParentOrgJson = (parent) => {
        const obj = {
            '@type': 'Organization',
            name: parent.name,
            url: parent.url,
        };
        if (parent.legalName)
            obj.legalName = parent.legalName;
        if (parent.logo)
            obj.logo = parent.logo;
        if (parent.description)
            obj.description = parent.description;
        if (parent.parentOrganization) {
            obj.parentOrganization = buildParentOrgJson(parent.parentOrganization);
        }
        return obj;
    };
    const organizationEntity = {
        '@type': 'Organization',
        '@id': `${entity.url}#organization`,
        name: entity.name,
        url: entity.url,
        description: entity.description,
    };
    if (entity.legalName)
        organizationEntity.legalName = entity.legalName;
    if (entity.logo)
        organizationEntity.logo = entity.logo;
    if (entity.email)
        organizationEntity.email = entity.email;
    if (entity.telephone)
        organizationEntity.telephone = entity.telephone;
    if (entity.sameAs && entity.sameAs.length > 0)
        organizationEntity.sameAs = entity.sameAs;
    if (entity.foundingDate)
        organizationEntity.foundingDate = entity.foundingDate;
    if (parentOrg)
        organizationEntity.parentOrganization = buildParentOrgJson(parentOrg);
    graph.push(organizationEntity);
    // 2. WebSite Entity
    const websiteEntity = {
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
        const productEntity = {
            '@type': productType,
            '@id': `${prod.url || entity.url}#${isSoftware ? 'software' : 'product'}`,
            name: prod.name,
            description: prod.description,
            brand: {
                '@type': 'Brand',
                name: prod.brand || entity.name,
            },
        };
        if (prod.url)
            productEntity.url = prod.url;
        if (prod.image)
            productEntity.image = prod.image;
        if (prod.sku)
            productEntity.sku = prod.sku;
        if (prod.category)
            productEntity.category = prod.category;
        if (isSoftware && prod.softwareApplication) {
            const sw = prod.softwareApplication;
            if (sw.applicationCategory)
                productEntity.applicationCategory = sw.applicationCategory;
            if (sw.operatingSystem)
                productEntity.operatingSystem = sw.operatingSystem;
            if (sw.version)
                productEntity.softwareVersion = sw.version;
            if (sw.downloadUrl)
                productEntity.downloadUrl = sw.downloadUrl;
            if (sw.requirements)
                productEntity.requirements = sw.requirements;
            if (sw.features && sw.features.length > 0) {
                productEntity.featureList = sw.features.join(', ');
            }
        }
        if (prod.offers) {
            const formatOffer = (offer) => {
                const offerObj = {
                    '@type': 'Offer',
                    price: String(offer.price),
                    priceCurrency: offer.priceCurrency,
                    availability: offer.availability
                        ? (offer.availability.startsWith('http') ? offer.availability : `https://schema.org/${offer.availability}`)
                        : 'https://schema.org/InStock',
                };
                if (offer.url)
                    offerObj.url = offer.url;
                if (offer.priceValidUntil)
                    offerObj.priceValidUntil = offer.priceValidUntil;
                if (offer.itemCondition)
                    offerObj.itemCondition = offer.itemCondition;
                return offerObj;
            };
            if (Array.isArray(prod.offers)) {
                productEntity.offers = prod.offers.map(formatOffer);
            }
            else {
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
        const faqEntity = {
            '@type': 'FAQPage',
            '@id': `${entity.url}#faq`,
            mainEntity: config.faqs.map((faq) => ({
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
        const breadcrumbEntity = {
            '@type': 'BreadcrumbList',
            '@id': `${entity.url}#breadcrumbs`,
            itemListElement: config.breadcrumbs.map((bc, index) => ({
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
function generateJsonLdScriptTag(config, options = {}) {
    const data = generateJsonLd(config);
    const jsonString = options.minify ? JSON.stringify(data) : JSON.stringify(data, null, 2);
    return `<script type="application/ld+json">\n${jsonString}\n</script>`;
}
/**
 * Validates JSON-LD graph structure according to Dual-Audience standards
 */
function validateJsonLdStructure(jsonLd) {
    const errors = [];
    const warnings = [];
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
    const org = graph.find((item) => item['@type'] === 'Organization');
    if (!org) {
        errors.push("Missing 'Organization' entity in @graph");
    }
    else {
        if (!org.name)
            errors.push("Organization missing 'name'");
        if (!org.url)
            errors.push("Organization missing 'url'");
        if (!org.parentOrganization) {
            warnings.push("Organization missing 'parentOrganization' for verifiable machine trust lineage");
        }
        else {
            const parent = org.parentOrganization;
            if (!parent.name)
                warnings.push("parentOrganization missing 'name'");
        }
    }
    // Check for WebSite
    const website = graph.find((item) => item['@type'] === 'WebSite');
    if (!website) {
        warnings.push("Missing 'WebSite' entity linking to publisher");
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
/**
 * Canonical Nymrel lineage names for verifiable machine trust:
 * the studio brand (intermediate) and the legal parent company (root).
 */
exports.CANONICAL_INTERMEDIATE_ORG_NAME = 'Nymrel';
exports.CANONICAL_ROOT_ORG_NAME = 'JalenBuilds LLC';
function finalizeLineageResult(issues) {
    return {
        valid: !issues.some((issue) => issue.severity === 'error'),
        errors: issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
        warnings: issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
        issues,
    };
}
function isOrgNodeObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}
function trimmedOrgName(node) {
    return typeof node?.name === 'string' ? node.name.trim() : undefined;
}
/**
 * Opt-in validator: checks that an existing JSON-LD graph carries the canonical
 * Nymrel -> JalenBuilds LLC parentOrganization lineage. Read-only — it never
 * rewrites the graph or asserts anything about deployments.
 *
 * Accepts either a full `{ @context, @graph }` document or a bare Organization
 * node. When multiple top-level Organization entities exist, the primary one is
 * selected deterministically (`@id` ending in '#organization', else first in
 * graph order). Names are matched exactly (whitespace-trimmed,
 * case-sensitive) against the canonical constants.
 *
 * Missing or incorrect intermediate ('Nymrel') and root ('JalenBuilds LLC')
 * organization nodes are errors; nesting beyond the canonical root is a
 * non-blocking warning. Generic structural validation remains available via
 * `validateJsonLdStructure`.
 */
function validateNymrelLineage(jsonLd) {
    const issues = [];
    const add = (code, severity, message) => {
        issues.push({ code, severity, message });
    };
    if (!isOrgNodeObject(jsonLd)) {
        add('LINEAGE_UNVERIFIABLE', 'error', 'Input must be a JSON-LD object');
        return finalizeLineageResult(issues);
    }
    let org;
    if (Array.isArray(jsonLd['@graph'])) {
        const orgs = jsonLd['@graph'].filter((item) => isOrgNodeObject(item) && item['@type'] === 'Organization');
        org =
            orgs.find((item) => typeof item['@id'] === 'string' && item['@id'].endsWith('#organization')) || orgs[0];
        if (!org) {
            add('MISSING_ORGANIZATION', 'error', "No 'Organization' entity found in @graph");
            return finalizeLineageResult(issues);
        }
    }
    else if (jsonLd['@type'] === 'Organization') {
        org = jsonLd;
    }
    else {
        add('LINEAGE_UNVERIFIABLE', 'error', 'Input must be a JSON-LD document with an @graph array, or a bare Organization node');
        return finalizeLineageResult(issues);
    }
    // Intermediate node: Nymrel
    const intermediate = org.parentOrganization;
    if (intermediate === undefined || intermediate === null) {
        add('MISSING_PARENT_ORGANIZATION', 'error', `Organization is missing 'parentOrganization' (expected intermediate '${exports.CANONICAL_INTERMEDIATE_ORG_NAME}')`);
        return finalizeLineageResult(issues);
    }
    if (!isOrgNodeObject(intermediate)) {
        add('MALFORMED_PARENT_NODE', 'error', "'parentOrganization' must be an Organization object");
        return finalizeLineageResult(issues);
    }
    const intermediateName = trimmedOrgName(intermediate);
    if (intermediateName !== exports.CANONICAL_INTERMEDIATE_ORG_NAME) {
        add('INCORRECT_INTERMEDIATE_NAME', 'error', `Intermediate parentOrganization name ${JSON.stringify(intermediate.name)} does not match canonical '${exports.CANONICAL_INTERMEDIATE_ORG_NAME}'`);
    }
    // Root node: JalenBuilds LLC
    const root = intermediate.parentOrganization;
    if (root === undefined || root === null) {
        add('MISSING_ROOT_ORGANIZATION', 'error', `Intermediate '${exports.CANONICAL_INTERMEDIATE_ORG_NAME}' is missing its own 'parentOrganization' (expected root '${exports.CANONICAL_ROOT_ORG_NAME}')`);
        return finalizeLineageResult(issues);
    }
    if (!isOrgNodeObject(root)) {
        add('MALFORMED_PARENT_NODE', 'error', "parentOrganization.parentOrganization must be an Organization object");
        return finalizeLineageResult(issues);
    }
    const rootName = trimmedOrgName(root);
    if (rootName !== exports.CANONICAL_ROOT_ORG_NAME) {
        add('INCORRECT_ROOT_NAME', 'error', `Root parentOrganization name ${JSON.stringify(root.name)} does not match canonical '${exports.CANONICAL_ROOT_ORG_NAME}'`);
    }
    if (root.parentOrganization !== undefined && root.parentOrganization !== null) {
        add('UNEXPECTED_DEEPER_NESTING', 'warning', `Canonical lineage ends at '${exports.CANONICAL_ROOT_ORG_NAME}'; deeper parentOrganization nesting found`);
    }
    return finalizeLineageResult(issues);
}
//# sourceMappingURL=jsonLd.js.map