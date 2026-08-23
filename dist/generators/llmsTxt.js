"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateTokens = estimateTokens;
exports.generateLlmsTxt = generateLlmsTxt;
exports.generateLlmsFullTxt = generateLlmsFullTxt;
exports.parseLlmsTxt = parseLlmsTxt;
/**
 * Estimates token count using standard GPT/LLM heuristic (~4 characters per token or 0.75 words)
 */
function estimateTokens(text) {
    if (!text)
        return 0;
    // A blend of character length and word count for accurate markdown token estimation
    const charTokens = Math.ceil(text.length / 4);
    const wordCount = text.trim().split(/\s+/).length;
    const wordTokens = Math.ceil(wordCount * 1.3);
    return Math.max(charTokens, wordTokens);
}
/**
 * Generates standard /llms.txt markdown string
 */
function generateLlmsTxt(config) {
    const lines = [];
    // Title (H1)
    lines.push(`# ${config.title}`);
    lines.push('');
    // Summary / Blockquote
    if (config.summary) {
        const summaryLines = config.summary
            .trim()
            .split('\n')
            .map((line) => `> ${line}`);
        lines.push(summaryLines.join('\n'));
        lines.push('');
    }
    // Sections
    for (const section of config.sections) {
        lines.push(`## ${section.title}`);
        if (section.description) {
            lines.push('');
            lines.push(section.description);
        }
        lines.push('');
        for (const link of section.links) {
            if (link.description) {
                lines.push(`- [${link.title}](${link.url}): ${link.description}`);
            }
            else {
                lines.push(`- [${link.title}](${link.url})`);
            }
        }
        lines.push('');
    }
    // Optional Links Section
    if (config.optionalLinks && config.optionalLinks.length > 0) {
        lines.push('## Optional');
        lines.push('');
        for (const link of config.optionalLinks) {
            if (link.description) {
                lines.push(`- [${link.title}](${link.url}): ${link.description}`);
            }
            else {
                lines.push(`- [${link.title}](${link.url})`);
            }
        }
        lines.push('');
    }
    let output = lines.join('\n').trim() + '\n';
    // Check token budget
    if (config.tokenBudget && config.tokenBudget > 0) {
        const currentTokens = estimateTokens(output);
        if (currentTokens > config.tokenBudget) {
            // Annotate or handle budget constraint
            console.warn(`[MachineTrust:llms.txt] Generated tokens (${currentTokens}) exceed tokenBudget (${config.tokenBudget})`);
        }
    }
    return output;
}
/**
 * Generates /llms-full.txt including extended technical documentation or inlined context
 */
function generateLlmsFullTxt(config) {
    const baseLlms = generateLlmsTxt(config);
    const lines = [baseLlms, '---', '', '## Comprehensive Documentation & Machine Index', ''];
    if (config.fullContent) {
        lines.push(config.fullContent.trim());
        lines.push('');
    }
    else {
        lines.push('### Architecture & Core Interfaces');
        lines.push('');
        lines.push('This full index is optimized for autonomous ingestion and deep context retrieval by frontier reasoning models.');
        lines.push('');
        for (const section of config.sections) {
            lines.push(`#### ${section.title}`);
            for (const link of section.links) {
                lines.push(`- **${link.title}** (${link.url})`);
                if (link.description) {
                    lines.push(`  Description: ${link.description}`);
                }
            }
            lines.push('');
        }
    }
    return lines.join('\n').trim() + '\n';
}
/**
 * Parses an existing llms.txt file into structured data
 */
function parseLlmsTxt(content) {
    const lines = content.split('\n');
    let title = '';
    const summaryLines = [];
    const sections = [];
    let currentSection = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line)
            continue;
        if (line.startsWith('# ') && !title) {
            title = line.substring(2).trim();
            continue;
        }
        if (line.startsWith('>')) {
            summaryLines.push(line.replace(/^>\s*/, '').trim());
            continue;
        }
        if (line.startsWith('## ')) {
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                title: line.substring(3).trim(),
                links: [],
            };
            continue;
        }
        if (line.startsWith('- [')) {
            const match = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)(?::\s*(.*))?$/);
            if (match && currentSection) {
                currentSection.links.push({
                    title: match[1].trim(),
                    url: match[2].trim(),
                    description: match[3]?.trim(),
                });
            }
            continue;
        }
        // Paragraph in section (description)
        if (currentSection && currentSection.links.length === 0 && !line.startsWith('-')) {
            currentSection.description = currentSection.description
                ? `${currentSection.description} ${line}`
                : line;
        }
    }
    if (currentSection) {
        sections.push(currentSection);
    }
    return {
        title,
        summary: summaryLines.join(' '),
        sections,
        tokenCount: estimateTokens(content),
    };
}
//# sourceMappingURL=llmsTxt.js.map