import type { KnowledgeEntry } from '../../src/types/index.js';

/**
 * Masks an email address by keeping the first three characters of the local part.
 * @param email - A valid email address (e.g. "kkosoy@foolcontractors.com").
 * @returns Masked email (e.g. "kko***@foolcontractors.com").
 */
function maskEmail(email: string): string {
  const at = email.indexOf('@');
  if (at < 0) return '***';
  return email.slice(0, Math.min(3, at)) + '***' + email.slice(at);
}

/**
 * Replaces all email addresses in a block of text with their masked equivalents.
 * @param text - Free-form text that may contain email addresses.
 * @returns The same text with emails masked.
 */
function maskEmailsInText(text: string): string {
  return text.replace(
    /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
    match => maskEmail(match),
  );
}

/**
 * Returns a copy of a KnowledgeEntry with PII masked in the AI-generated fields only.
 * Raw Slack message data is left untouched. Email addresses in the problem and solution
 * summaries are masked; full names are suppressed at the prompt level.
 * @param entry - The original KnowledgeEntry.
 * @returns A new KnowledgeEntry with PII masked in problem and solution.
 */
export function maskEntry(entry: KnowledgeEntry): KnowledgeEntry {
  return {
    ...entry,
    problem: maskEmailsInText(entry.problem),
    solution: maskEmailsInText(entry.solution),
  };
}
