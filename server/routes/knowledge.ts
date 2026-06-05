import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as claude from '../services/claude.js';
import * as kb from '../services/knowledge-base.js';
import * as slack from '../services/slack.js';

const router = Router();
const refreshLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Too many requests' } });

/** Rejects channel names with characters outside [a-zA-Z0-9_-] (mirrors kbPath validation). */
function isValidChannelName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

/**
 * GET /api/knowledge
 * Returns the list of channel names that have a knowledge base on disk.
 * @returns {{ channels: string[] }} - Array of channel name strings.
 */
router.get('/', (_req, res) => {
  res.json({ channels: kb.listChannels() });
});

/**
 * GET /api/knowledge/stats
 * Returns aggregated counts across all knowledge bases.
 * @returns {{ channelsCount: number, entriesCount: number }}
 */
router.get('/stats', (_req, res) => {
  const channels = kb.listChannels();
  const entriesCount = channels.reduce((sum, ch) => sum + kb.load(ch).entries.length, 0);
  res.json({ channelsCount: channels.length, entriesCount });
});

/**
 * GET /api/knowledge/:channel
 * Returns knowledge base entries for a channel, optionally filtered by tag and/or text query.
 * @param channel - The channel name (path parameter).
 * @query tag - Optional exact tag to filter by.
 * @query q - Optional text search applied to problem and solution fields.
 * @returns {{ entries: KnowledgeEntry[], total: number }}
 */
router.get('/:channel', (req, res) => {
  const { channel } = req.params;
  if (!isValidChannelName(channel)) {
    res.status(400).json({ error: 'Invalid channel name' });
    return;
  }
  const { tag, q } = req.query as Record<string, string | undefined>;
  const knowledgeBase = kb.load(channel);
  const entries = kb.filterEntries(knowledgeBase, { tag, query: q });
  res.json({ entries, total: entries.length });
});

/**
 * PATCH /api/knowledge/:channel/:id
 * Updates a single entry's problem and/or solution text and marks it as verified.
 * @param channel - The channel name (path parameter).
 * @param id - The URL-encoded entry ID to update (path parameter).
 * @body {{ problem?: string, solution: string, verifiedBy: string }}
 * @returns {{ success: true }} on success, 400 if inputs are missing, or 404 if the entry was not found.
 */
router.patch('/:channel/:id', (req, res) => {
  const { channel, id } = req.params;
  if (!isValidChannelName(channel)) {
    res.status(400).json({ error: 'Invalid channel name' });
    return;
  }
  const { problem, solution, verifiedBy } = req.body as { problem?: string; solution?: string; verifiedBy?: string };
  if (!solution?.trim() || !verifiedBy?.trim()) {
    res.status(400).json({ error: 'solution and verifiedBy are required' });
    return;
  }
  if (solution.length > 5000) {
    res.status(400).json({ error: 'solution must be 5000 characters or fewer' });
    return;
  }
  if (problem && problem.length > 2000) {
    res.status(400).json({ error: 'problem must be 2000 characters or fewer' });
    return;
  }
  if (verifiedBy.length > 200) {
    res.status(400).json({ error: 'verifiedBy must be 200 characters or fewer' });
    return;
  }
  const updated = kb.patchEntry(channel, decodeURIComponent(id), {
    problem: problem?.trim(),
    solution: solution.trim(),
    verification: { verifiedBy: verifiedBy.trim(), verifiedAt: new Date().toISOString() },
  });
  if (!updated) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ success: true });
});

/**
 * DELETE /api/knowledge/:channel/:id
 * Removes a single entry from a channel's knowledge base by its ID.
 * @param channel - The channel name (path parameter).
 * @param id - The URL-encoded entry ID to remove (path parameter).
 * @returns {{ success: true }} on success, or 404 if the entry was not found.
 */
router.delete('/:channel/:id', (req, res) => {
  const { channel, id } = req.params;
  if (!isValidChannelName(channel)) {
    res.status(400).json({ error: 'Invalid channel name' });
    return;
  }
  const removed = kb.removeEntry(channel, decodeURIComponent(id));
  if (!removed) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ success: true });
});

/**
 * POST /api/knowledge/:channel/:id/refresh
 * Re-fetches the original Slack thread, re-extracts knowledge via LLM, and updates the entry
 * in place. Clears any prior verification stamp since the content may have changed.
 * @param channel - The channel name (path parameter).
 * @param id - The URL-encoded entry ID to refresh (path parameter).
 * @returns {{ entry: KnowledgeEntry }} - The updated entry on success.
 */
router.post('/:channel/:id/refresh', refreshLimiter, async (req, res) => {
  const { channel, id } = req.params;
  if (!isValidChannelName(channel)) {
    res.status(400).json({ error: 'Invalid channel name' });
    return;
  }
  const decodedId = decodeURIComponent(id);
  const knowledgeBase = kb.load(channel);
  const entry = knowledgeBase.entries.find(e => e.id === decodedId);
  if (!entry) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  try {
    const thread = await slack.fetchThread(entry.channelId, entry.threadTs);
    const extracted = await claude.extractKnowledge(thread);
    if (!extracted) {
      res.status(422).json({ error: 'Thread no longer contains a clear problem/solution pair' });
      return;
    }
    const updated = kb.updateEntry(channel, decodedId, {
      problem: extracted.problem,
      solution: extracted.solution,
      rawMessages: extracted.rawMessages,
      tags: extracted.tags,
      confidence: extracted.confidence,
    });
    if (!updated) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }
    res.json({ entry: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[knowledge/refresh] error:', message);
    res.status(502).json({ error: 'Failed to refresh entry. Please try again.' });
  }
});

export default router;
