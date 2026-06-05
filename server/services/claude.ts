import OpenAI from 'openai';
import type { KnowledgeBase, KnowledgeEntry, SlackThread } from '../../src/types/index.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://litellm.fool.com/',
  timeout: 30_000,
});

/**
 * Escapes XML special characters in user-provided text before interpolating into prompt templates.
 * Prevents structural XML injection (e.g. </parent><system>...) from altering prompt shape.
 * @param text - Raw user-provided string.
 * @returns The string with &, <, and > replaced by their XML entities.
 */
function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const MODEL = process.env.LLM_MODEL ?? 'anthropic/claude-sonnet-4-6';

const EXTRACT_SYSTEM_PROMPT = `You are analyzing Slack thread data to extract a problem/solution pair for a knowledge base.

Determine whether the thread contains a clear problem AND a resolution or solution.
If it's casual chat, an announcement, or an unresolved question, respond with exactly: NOT_APPLICABLE

Otherwise respond with this JSON (no markdown fences):
{
  "problem": "concise problem description (1-3 sentences)",
  "solution": "concise solution description (1-5 sentences, include commands/steps if present)",
  "tags": ["tag1", "tag2"],
  "confidence": "high" | "medium" | "low"
}

Tags: lowercase, 1-3 words, technical domain (e.g. "docker", "oauth", "db-migrations").
Confidence: high = solution confirmed resolved; medium = likely helped; low = speculative.
Privacy: do not include real names, email addresses, or internal user identifiers in the problem or solution. Refer to people by role only (e.g. "a user", "the admin", "a contractor").`;

/**
 * Analyzes a Slack thread and extracts a problem/solution pair for the knowledge base.
 * Returns null if the thread does not contain a clear problem and resolution
 * (e.g. casual chat, announcements, or unresolved questions).
 * @param thread - The Slack thread to analyze, including the parent message and all replies.
 * @returns An extracted entry (without id or scannedAt), or null if not applicable.
 */
export async function extractKnowledge(
  thread: SlackThread
): Promise<Omit<KnowledgeEntry, 'id' | 'scannedAt'> | null> {
  const repliesText = thread.replies.map(r => `<reply user="${escapeXml(r.user)}">${escapeXml(r.text)}</reply>`).join('\n') || '(none)';

  // Thread data is placed in the user message so it cannot override the system prompt instructions
  const userContent = `<thread channel="${escapeXml(thread.channelName)}">
<parent user="${escapeXml(thread.parentMessage.user)}">${escapeXml(thread.parentMessage.text)}</parent>
<replies>
${repliesText}
</replies>
</thread>`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const content = response.choices[0].message.content?.trim() ?? '';
  if (content === 'NOT_APPLICABLE') return null;

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    // Validate shape before writing to disk
    if (
      typeof parsed.problem !== 'string' || !parsed.problem ||
      typeof parsed.solution !== 'string' || !parsed.solution ||
      !Array.isArray(parsed.tags) ||
      !['high', 'medium', 'low'].includes(parsed.confidence as string)
    ) {
      return null;
    }
    return {
      channelId: thread.channelId,
      channelName: thread.channelName,
      threadTs: thread.parentMessage.ts,
      problem: String(parsed.problem).slice(0, 2000),
      solution: String(parsed.solution).slice(0, 5000),
      rawMessages: [thread.parentMessage, ...thread.replies],
      tags: (parsed.tags as unknown[]).filter(t => typeof t === 'string').map(t => String(t).slice(0, 50)).slice(0, 10),
      confidence: parsed.confidence as 'high' | 'medium' | 'low',
    };
  } catch {
    return null;
  }
}

const SUGGEST_SYSTEM_PROMPT = `You are a technical support assistant with access to a knowledge base.

Instructions:
1. Identify the 0-5 most relevant KB entries. Output their IDs in "relatedEntryIds".
2. Write a "suggestedSolution" — actionable, under 300 words. Use KB context if relevant; answer from the thread alone if no KB entries match.

Respond with JSON (no markdown fences):
{
  "suggestedSolution": "...",
  "relatedEntryIds": ["id1", "id2"]
}`;

/**
 * Suggests a solution for a Slack thread by querying the knowledge base for similar past issues.
 * @param thread - The current Slack thread to generate a suggestion for.
 * @param kb - The knowledge base to search for related entries.
 * @returns An object with the suggested solution text and any related knowledge base entries.
 */
export async function suggestSolution(
  thread: SlackThread,
  kb: KnowledgeBase
): Promise<{ suggestedSolution: string; relatedEntries: KnowledgeEntry[] }> {
  const repliesText =
    thread.replies.length > 0
      ? thread.replies.map(r => `<reply user="${escapeXml(r.user)}">${escapeXml(r.text)}</reply>`).join('\n')
      : '(no replies yet)';

  const entriesText =
    kb.entries
      .slice(0, 50)
      .map(
        (e, i) =>
          `[${i + 1}] ID: ${e.id}\nProblem: ${e.problem}\nSolution: ${e.solution}\nTags: ${e.tags.join(', ')}`
      )
      .join('\n\n') || '(empty)';

  // Thread and KB data are in the user message to prevent overriding system instructions
  const userContent = `<thread channel="${escapeXml(thread.channelName)}">
<parent user="${escapeXml(thread.parentMessage.user)}">${escapeXml(thread.parentMessage.text)}</parent>
<replies>
${repliesText}
</replies>
</thread>

<knowledge_base entries="${kb.entries.length}">
${entriesText}
</knowledge_base>`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: SUGGEST_SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  });

  const content = response.choices[0].message.content?.trim() ?? '{}';
  let parsed: { suggestedSolution?: string; relatedEntryIds?: string[] };
  try {
    parsed = JSON.parse(content) as { suggestedSolution?: string; relatedEntryIds?: string[] };
  } catch {
    console.error('[claude] suggestSolution: non-JSON response from LLM');
    return { suggestedSolution: 'Unable to generate a suggestion at this time.', relatedEntries: [] };
  }

  const suggestedSolution = typeof parsed.suggestedSolution === 'string'
    ? parsed.suggestedSolution.slice(0, 3000)
    : 'Unable to generate a suggestion at this time.';
  const relatedEntries = Array.isArray(parsed.relatedEntryIds)
    ? kb.entries.filter(e => (parsed.relatedEntryIds as string[]).includes(e.id))
    : [];
  return { suggestedSolution, relatedEntries };
}
