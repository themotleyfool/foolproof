import OpenAI from 'openai';
import type { KnowledgeBase, KnowledgeEntry, SlackThread } from '../../src/types/index.js';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://litellm.fool.com/',
});
const MODEL = process.env.LLM_MODEL ?? 'anthropic/claude-sonnet-4-6';

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
  const repliesText = thread.replies.map(r => `  ${r.text}`).join('\n') || '  (none)';

  const prompt = `You are analyzing a Slack thread to extract a problem/solution pair for a knowledge base.

Channel: #${thread.channelName}

Parent message:
  ${thread.parentMessage.text}

Replies:
${repliesText}

Determine whether this thread contains a clear problem AND a resolution or solution.
If it's casual chat, an announcement, or an unresolved question, respond with exactly: NOT_APPLICABLE

Otherwise respond with this JSON (no markdown fences):
{
  "problem": "concise problem description (1-3 sentences)",
  "solution": "concise solution description (1-5 sentences, include commands/steps if present)",
  "tags": ["tag1", "tag2"],
  "confidence": "high" | "medium" | "low"
}

Tags: lowercase, 1-3 words, technical domain (e.g. "docker", "oauth", "db-migrations").
Confidence: high = solution confirmed resolved; medium = likely helped; low = speculative.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0].message.content?.trim() ?? '';
  if (content === 'NOT_APPLICABLE') return null;

  try {
    const parsed = JSON.parse(content) as {
      problem: string;
      solution: string;
      tags: string[];
      confidence: 'high' | 'medium' | 'low';
    };
    return {
      channelId: thread.channelId,
      channelName: thread.channelName,
      threadTs: thread.parentMessage.ts,
      problem: parsed.problem,
      solution: parsed.solution,
      rawMessages: [thread.parentMessage, ...thread.replies],
      tags: parsed.tags,
      confidence: parsed.confidence,
    };
  } catch {
    return null;
  }
}

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
      ? thread.replies.map(r => `  ${r.text}`).join('\n')
      : '(no replies yet)';

  const entriesText =
    kb.entries
      .slice(0, 50)
      .map(
        (e, i) =>
          `[${i + 1}] ID: ${e.id}\nProblem: ${e.problem}\nSolution: ${e.solution}\nTags: ${e.tags.join(', ')}`
      )
      .join('\n\n') || '(empty)';

  const prompt = `You are a technical support assistant with access to a knowledge base.

## Current Thread
Channel: #${thread.channelName}
${thread.parentMessage.text}
${repliesText}

## Knowledge Base (${kb.entries.length} entries)
${entriesText}

Instructions:
1. Identify the 0-5 most relevant KB entries. Output their IDs in "relatedEntryIds".
2. Write a "suggestedSolution" — actionable, under 300 words. Use KB context if relevant; answer from the thread alone if no KB entries match.

Respond with JSON (no markdown fences):
{
  "suggestedSolution": "...",
  "relatedEntryIds": ["id1", "id2"]
}`;

  const response = await client.chat.completions.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.choices[0].message.content?.trim() ?? '{}';
  const parsed = JSON.parse(content) as {
    suggestedSolution: string;
    relatedEntryIds: string[];
  };

  const relatedEntries = kb.entries.filter(e => parsed.relatedEntryIds?.includes(e.id));
  return { suggestedSolution: parsed.suggestedSolution, relatedEntries };
}
