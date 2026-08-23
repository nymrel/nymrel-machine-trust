import { AnswerFirstConfig } from '../types.js';
/**
 * Accurately counts words in a text string
 */
export declare function countWords(text: string): number;
/**
 * Validates word count against 40-60 word executive answer standard
 */
export declare function validateWordCount(text: string, range?: [number, number]): {
    valid: boolean;
    count: number;
    message: string;
};
/**
 * Generates an accessible, SEO-optimized Answer-First HTML block
 */
export declare function generateAnswerFirstHtml(config: AnswerFirstConfig): string;
/**
 * Injects Answer-First HTML block into existing HTML document string
 */
export declare function injectAnswerFirstBlock(html: string, config: AnswerFirstConfig): string;
//# sourceMappingURL=answerFirst.d.ts.map