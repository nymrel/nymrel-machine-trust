/**
 * Strips HTML tags and normalizes whitespace
 */
export function extractTextFromHtml(html) {
    // Remove script and style tags and their contents
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
    // Replace HTML tags with spaces
    clean = clean.replace(/<[^>]+>/g, ' ');
    // Decode basic HTML entities
    clean = clean
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&nbsp;/g, ' ');
    // Collapse whitespace
    return clean.replace(/\s+/g, ' ').trim();
}
/**
 * Normalizes text for comparison (lowercase, trimmed, collapsed whitespace, punctuation simplified)
 */
export function normalizeText(text) {
    if (!text)
        return '';
    return text
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/[^\p{L}\p{N}\s$€£¥._-]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
/**
 * Extracts prices from text (e.g., "$49", "49.00", "USD 49", "0.00", "Free")
 */
export function extractPrices(text) {
    const matches = text.match(/(?:\$|€|£|USD\s*|EUR\s*|GBP\s*)?\b\d+(?:\.\d{2})?\b|\bfree\b/gi) || [];
    return matches.map((m) => m.toLowerCase().trim());
}
const DESCRIPTION_STOP_WORDS = new Set([
    'and', 'are', 'for', 'from', 'into', 'that', 'the', 'this', 'with', 'your',
]);
function significantTerms(text) {
    const terms = normalizeText(text)
        .split(/\s+/)
        .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
        .filter((term) => term.length >= 3 && !DESCRIPTION_STOP_WORDS.has(term));
    return new Set(terms);
}
/**
 * Verifies that structured data in JSON-LD matches rendered visible DOM text
 */
export function verifyDomConsistency(jsonLd, html) {
    const visibleText = extractTextFromHtml(html);
    const normalizedDom = normalizeText(visibleText);
    const checks = [];
    let passedScore = 0;
    let totalWeight = 0;
    const graph = Array.isArray(jsonLd['@graph']) ? jsonLd['@graph'] : [jsonLd];
    // 1. Check Organization Name
    const org = graph.find((item) => item['@type'] === 'Organization');
    if (org && org.name) {
        totalWeight += 20;
        const normalizedName = normalizeText(org.name);
        const found = normalizedDom.includes(normalizedName);
        if (found) {
            passedScore += 20;
            checks.push({
                field: 'Organization Name',
                jsonLdValue: org.name,
                domValue: `Found in DOM text`,
                status: 'PASS',
                message: `Organization name "${org.name}" is present in visible DOM.`,
            });
        }
        else {
            checks.push({
                field: 'Organization Name',
                jsonLdValue: org.name,
                domValue: `Not found`,
                status: 'FAIL',
                message: `Organization name "${org.name}" in JSON-LD was not found in visible DOM text.`,
            });
        }
    }
    // 2. Check Product / SoftwareApplication Name
    const prod = graph.find((item) => item['@type'] === 'Product' || item['@type'] === 'SoftwareApplication');
    if (prod && prod.name) {
        totalWeight += 25;
        const normalizedProdName = normalizeText(prod.name);
        const found = normalizedDom.includes(normalizedProdName);
        if (found) {
            passedScore += 25;
            checks.push({
                field: 'Product / Software Name',
                jsonLdValue: prod.name,
                domValue: `Found in DOM text`,
                status: 'PASS',
                message: `Product name "${prod.name}" matches visible DOM content.`,
            });
        }
        else {
            checks.push({
                field: 'Product / Software Name',
                jsonLdValue: prod.name,
                domValue: `Not found`,
                status: 'FAIL',
                message: `Product name "${prod.name}" in JSON-LD was not found in visible DOM text.`,
            });
        }
    }
    // 3. Check Pricing & Offers
    if (prod && prod.offers) {
        const offers = Array.isArray(prod.offers) ? prod.offers : [prod.offers];
        for (let i = 0; i < offers.length; i++) {
            const offer = offers[i];
            if (offer.price !== undefined) {
                totalWeight += 25;
                const priceStr = String(offer.price);
                const priceNum = parseFloat(priceStr);
                const currency = (offer.priceCurrency || 'USD').toUpperCase();
                // Check various formats: "$49", "49", "49.00", "Free"
                const isFree = priceNum === 0 || priceStr.toLowerCase() === 'free';
                const priceVariations = isFree
                    ? ['free', '$0', '0', '0.00']
                    : [
                        priceStr,
                        priceNum.toFixed(2),
                        `$${priceStr}`,
                        `$${priceNum.toFixed(2)}`,
                        `${currency} ${priceStr}`,
                        `${priceStr} ${currency}`,
                    ];
                const match = priceVariations.some((variant) => normalizedDom.includes(normalizeText(variant)));
                if (match) {
                    passedScore += 25;
                    checks.push({
                        field: `Offer Price [${i}]`,
                        jsonLdValue: `${currency} ${priceStr}`,
                        domValue: `Matching price text verified`,
                        status: 'PASS',
                        message: `Offer price ${currency} ${priceStr} matches visible DOM pricing.`,
                    });
                }
                else {
                    checks.push({
                        field: `Offer Price [${i}]`,
                        jsonLdValue: `${currency} ${priceStr}`,
                        domValue: `Visible prices: ${extractPrices(visibleText).slice(0, 5).join(', ') || 'none'}`,
                        status: 'FAIL',
                        message: `Offer price "${currency} ${priceStr}" in JSON-LD is missing or mismatched from visible DOM.`,
                    });
                }
            }
        }
    }
    // 4. Check Description Substring / Key Entities
    if (prod && prod.description) {
        totalWeight += 15;
        const descriptionTerms = significantTerms(prod.description);
        const domTerms = significantTerms(visibleText);
        const matchingTerms = [...descriptionTerms].filter((term) => domTerms.has(term));
        const overlap = descriptionTerms.size > 0
            ? matchingTerms.length / descriptionTerms.size
            : 0;
        const minimumMatches = Math.min(3, descriptionTerms.size);
        const hasMeaningfulOverlap = descriptionTerms.size > 0 &&
            matchingTerms.length >= minimumMatches &&
            overlap >= 0.6;
        if (hasMeaningfulOverlap) {
            passedScore += 15;
            checks.push({
                field: 'Description Consistency',
                jsonLdValue: `${prod.description.slice(0, 60)}...`,
                domValue: `${matchingTerms.length}/${descriptionTerms.size} significant terms found`,
                status: 'PASS',
                message: `Product description has ${Math.round(overlap * 100)}% significant-term overlap with visible DOM text.`,
            });
        }
        else {
            checks.push({
                field: 'Description Consistency',
                jsonLdValue: `${prod.description.slice(0, 60)}...`,
                domValue: `${matchingTerms.length}/${descriptionTerms.size} significant terms found`,
                status: 'WARN',
                message: 'Product description has insufficient direct overlap with visible DOM text.',
            });
        }
    }
    // 5. Check FAQ consistency if present
    const faqPage = graph.find((item) => item['@type'] === 'FAQPage');
    if (faqPage && Array.isArray(faqPage.mainEntity) && faqPage.mainEntity.length > 0) {
        totalWeight += 15;
        let matchingFaqs = 0;
        for (const faq of faqPage.mainEntity) {
            const q = normalizeText(faq.name || '');
            if (q && normalizedDom.includes(q.slice(0, 30))) {
                matchingFaqs++;
            }
        }
        if (matchingFaqs > 0) {
            passedScore += 15;
            checks.push({
                field: 'FAQ Consistency',
                jsonLdValue: `${faqPage.mainEntity.length} questions in JSON-LD`,
                domValue: `${matchingFaqs} questions found in DOM`,
                status: 'PASS',
                message: `FAQ questions in structured data are visible in DOM text.`,
            });
        }
        else {
            checks.push({
                field: 'FAQ Consistency',
                jsonLdValue: `${faqPage.mainEntity.length} questions in JSON-LD`,
                domValue: `0 matching questions`,
                status: 'WARN',
                message: `FAQ structured data is present but questions were not detected in visible DOM text.`,
            });
        }
    }
    const score = totalWeight > 0 ? Math.round((passedScore / totalWeight) * 100) : 100;
    const consistent = !checks.some((c) => c.status === 'FAIL');
    return {
        consistent,
        score,
        checks,
    };
}
//# sourceMappingURL=domConsistency.js.map