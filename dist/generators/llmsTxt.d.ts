import type { LlmsTxtConfig } from '../types.js';
/**
 * Estimates token count using standard GPT/LLM heuristic (~4 characters per token or 0.75 words)
 */
export declare function estimateTokens(text: string): number;
/**
 * Generates standard /llms.txt markdown string
 */
export declare function generateLlmsTxt(config: LlmsTxtConfig): string;
/**
 * Generates /llms-full.txt including extended technical documentation or inlined context
 */
export declare function generateLlmsFullTxt(config: LlmsTxtConfig): string;
export interface ParsedLlmsTxt {
    title: string;
    summary: string;
    sections: Array<{
        title: string;
        description?: string;
        links: Array<{
            title: string;
            url: string;
            description?: string;
        }>;
    }>;
    tokenCount: number;
}
/**
 * Parses an existing llms.txt file into structured data
 */
export declare function parseLlmsTxt(content: string): ParsedLlmsTxt;
//# sourceMappingURL=llmsTxt.d.ts.map