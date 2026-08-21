/**
 * Types for @nymrel/machine-trust
 * Dual-Audience Machine Trust & AI Search Discoverability Engine
 */
export interface ParentOrganizationConfig {
    name: string;
    legalName?: string;
    url: string;
    logo?: string;
    description?: string;
    parentOrganization?: ParentOrganizationConfig;
}
export interface OrganizationConfig {
    name: string;
    legalName?: string;
    url: string;
    logo?: string;
    description: string;
    email?: string;
    telephone?: string;
    sameAs?: string[];
    foundingDate?: string;
    parentOrganization?: ParentOrganizationConfig;
}
export interface OfferConfig {
    price: number | string;
    priceCurrency: string;
    availability?: 'InStock' | 'PreOrder' | 'OutOfStock' | 'OnlineOnly' | string;
    url?: string;
    priceValidUntil?: string;
    itemCondition?: string;
}
export interface SoftwareApplicationConfig {
    applicationCategory?: string;
    operatingSystem?: string;
    features?: string[];
    requirements?: string;
    version?: string;
    downloadUrl?: string;
}
export interface ProductConfig {
    name: string;
    description: string;
    brand?: string;
    url?: string;
    image?: string;
    sku?: string;
    category?: string;
    offers?: OfferConfig | OfferConfig[];
    aggregateRating?: {
        ratingValue: number;
        reviewCount: number;
        bestRating?: number;
        worstRating?: number;
    };
    softwareApplication?: SoftwareApplicationConfig;
}
export interface FAQItem {
    question: string;
    answer: string;
}
export interface BreadcrumbItem {
    name: string;
    item: string;
}
export interface LlmsLink {
    title: string;
    url: string;
    description?: string;
}
export interface LlmsSection {
    title: string;
    description?: string;
    links: LlmsLink[];
}
export interface LlmsTxtConfig {
    title: string;
    summary: string;
    sections: LlmsSection[];
    optionalLinks?: LlmsLink[];
    fullContent?: string;
    tokenBudget?: number;
}
export interface BotRule {
    botName: string;
    allow?: string[];
    disallow?: string[];
    crawlDelay?: number;
}
export type BotPosture = 'allow_ai_search_disallow_training' | 'allow_all' | 'restrict_training_only' | 'deny_all';
export interface RobotsTxtConfig {
    sitemapUrl?: string;
    host?: string;
    defaultDisallow?: string[];
    defaultAllow?: string[];
    botRules?: BotRule[];
    posture?: BotPosture;
}
export interface AnswerFirstConfig {
    summary: string;
    keyTakeaways?: string[];
    targetSelector?: string;
    wordCountRange?: [number, number];
    entityName?: string;
    canonicalUrl?: string;
}
export interface MachineTrustConfig {
    entity: OrganizationConfig;
    product?: ProductConfig;
    faqs?: FAQItem[];
    breadcrumbs?: BreadcrumbItem[];
    llmsTxt?: LlmsTxtConfig;
    robotsTxt?: RobotsTxtConfig;
    answerFirst?: AnswerFirstConfig;
}
export interface CheckItem {
    id: string;
    category: 'ENTITY_GRAPH' | 'LLMS_TXT' | 'ROBOTS_TXT' | 'ANSWER_FIRST' | 'DOM_CONSISTENCY';
    title: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    score: number;
    weight: number;
    message: string;
    details?: Record<string, any>;
}
export interface MachineTrustAuditScorecard {
    overallScore: number;
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
    passedCount: number;
    warnCount: number;
    failCount: number;
    timestamp: string;
    entityName: string;
    checks: CheckItem[];
}
export interface DomConsistencyCheckResult {
    consistent: boolean;
    score: number;
    checks: Array<{
        field: string;
        jsonLdValue: any;
        domValue: string;
        status: 'PASS' | 'WARN' | 'FAIL';
        message: string;
    }>;
}
export interface CrawlerAccessResult {
    botName: string;
    path: string;
    allowed: boolean;
    reason: string;
}
export interface CrawlerAuditResult {
    overallEligible: boolean;
    score: number;
    results: CrawlerAccessResult[];
    declaredSitemap: boolean;
    declaredLlmsTxt: boolean;
}
