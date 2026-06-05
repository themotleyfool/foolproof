import type { KnowledgeEntry, SlackMessage } from '../../src/types/index.js';

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
 * Returns a copy of a SlackMessage with email addresses in the message text masked.
 * The author fields (user ID and userName) are left untouched.
 * @param msg - The original SlackMessage.
 * @returns A new SlackMessage with emails in the text field masked.
 */
export function maskMessage(msg: SlackMessage): SlackMessage {
  return { ...msg, text: maskEmailsInText(msg.text) };
}

/**
 * Returns a copy of a KnowledgeEntry with PII masked across all text fields:
 * email addresses in raw message text, and in the AI-generated problem and solution summaries.
 * Author fields (user IDs, usernames) are left untouched.
 * @param entry - The original KnowledgeEntry.
 * @returns A new KnowledgeEntry with PII masked.
 */
export function maskEntry(entry: KnowledgeEntry): KnowledgeEntry {
  return {
    ...entry,
    rawMessages: entry.rawMessages.map(maskMessage),
    problem: maskEmailsInText(entry.problem),
    solution: maskEmailsInText(entry.solution),
  };
}
