import { Router } from 'express';
import * as kb from '../services/knowledge-base.js';

const router = Router();

/**
 * GET /api/knowledge
 * Returns the list of channel names that have a knowledge base on disk.
 * @returns {{ channels: string[] }} - Array of channel name strings.
 */
router.get('/', (_req, res) => {
  res.json({ channels: kb.listChannels() });
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
  const { tag, q } = req.query as Record<string, string | undefined>;
  const knowledgeBase = kb.load(channel);
  const entries = kb.filterEntries(knowledgeBase, { tag, query: q });
  res.json({ entries, total: entries.length });
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
  const removed = kb.removeEntry(channel, decodeURIComponent(id));
  if (!removed) {
    res.status(404).json({ error: 'Entry not found' });
    return;
  }
  res.json({ success: true });
});

export default router;
