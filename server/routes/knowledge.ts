import { Router } from 'express';
import * as kb from '../services/knowledge-base.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ channels: kb.listChannels() });
});

router.get('/:channel', (req, res) => {
  const { channel } = req.params;
  const { tag, q } = req.query as Record<string, string | undefined>;
  const knowledgeBase = kb.load(channel);
  const entries = kb.filterEntries(knowledgeBase, { tag, query: q });
  res.json({ entries, total: entries.length });
});

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
