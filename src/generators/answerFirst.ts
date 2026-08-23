import { AnswerFirstConfig } from '../types.js';

/**
 * Accurately counts words in a text string
 */
export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates word count against 40-60 word executive answer standard
 */
export function validateWordCount(
  text: string,
  range: [number, number] = [40, 60]
): {
  valid: boolean;
  count: number;
  message: string;
} {
  const count = countWords(text);
  const [min, max] = range;

  if (count < min) {
    return {
      valid: false,
      count,
      message: `Answer-first text is too brief (${count} words). Recommended range: ${min}-${max} words for optimal AI crawler retrieval.`,
    };
  }

  if (count > max) {
    return {
      valid: false,
      count,
      message: `Answer-first text is too lengthy (${count} words). Recommended range: ${min}-${max} words to prevent AI context overflow and ensure snippet dominance.`,
    };
  }

  return {
    valid: true,
    count,
    message: `Answer-first block length is optimal (${count} words).`,
  };
}

/**
 * Generates an accessible, SEO-optimized Answer-First HTML block
 */
export function generateAnswerFirstHtml(config: AnswerFirstConfig): string {
  const { summary, keyTakeaways = [], entityName } = config;

  let takeawaysHtml = '';
  if (keyTakeaways.length > 0) {
    const listItems = keyTakeaways.map((item) => `      <li>${escapeHtml(item)}</li>`).join('\n');
    takeawaysHtml = `\n    <ul class="mt-takeaways">\n${listItems}\n    </ul>`;
  }

  const badgeHtml = entityName
    ? `\n    <div class="mt-badge" data-trust-entity="${escapeHtml(entityName)}">Machine-readable summary for ${escapeHtml(entityName)}</div>`
    : '';

  return `<aside class="machine-trust-answer-first" data-machine-trust="answer-first" role="region" aria-label="Executive Summary">
  <div class="mt-answer-container">
    <div class="mt-answer-header">
      <span class="mt-pill">Quick Summary</span>
    </div>
    <p class="mt-answer-text">${escapeHtml(summary)}</p>${takeawaysHtml}${badgeHtml}
  </div>
</aside>`;
}

/**
 * Injects Answer-First HTML block into existing HTML document string
 */
export function injectAnswerFirstBlock(html: string, config: AnswerFirstConfig): string {
  const block = generateAnswerFirstHtml(config);

  // 1. If explicit placeholder exists
  if (html.includes('<!-- MACHINE_TRUST_ANSWER_FIRST -->')) {
    return html.replace('<!-- MACHINE_TRUST_ANSWER_FIRST -->', block);
  }

  // 2. If targetSelector / class / id placeholder
  if (config.targetSelector) {
    const selectorTag = `<div id="${config.targetSelector.replace('#', '')}">`;
    if (html.includes(selectorTag)) {
      return html.replace(selectorTag, `${selectorTag}\n${block}`);
    }
  }

  // 3. Inject after closing </h1> tag
  const h1Match = html.match(/<\/h1>/i);
  if (h1Match && h1Match.index !== undefined) {
    const insertPos = h1Match.index + 5;
    return html.slice(0, insertPos) + '\n' + block + '\n' + html.slice(insertPos);
  }

  // 4. Inject after opening <main> or <body> tag
  const mainMatch = html.match(/<main[^>]*>/i);
  if (mainMatch && mainMatch.index !== undefined) {
    const insertPos = mainMatch.index + mainMatch[0].length;
    return html.slice(0, insertPos) + '\n' + block + '\n' + html.slice(insertPos);
  }

  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch && bodyMatch.index !== undefined) {
    const insertPos = bodyMatch.index + bodyMatch[0].length;
    return html.slice(0, insertPos) + '\n' + block + '\n' + html.slice(insertPos);
  }

  // Fallback: prepend
  return block + '\n' + html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
