import { Router } from 'express';
import type { ScanRequest, ScanResponse } from '../../src/types/index.js';
import * as claude from '../services/claude.js';
import * as kb from '../services/knowledge-base.js';
import * as slack from '../services/slack.js';

const router = Router();

/**
 * POST /api/scan
 * Scans a Slack channel for threaded conversations and extracts problem/solution pairs
 * into the knowledge base. Skips threads already present in the knowledge base.
 * @body {ScanRequest} - `channelId` (required), `startDate` and `endDate` (optional ISO date strings).
 * @returns {ScanResponse} - Summary of threads scanned, entries added, and entries skipped.
 */
router.post('/', async (req, res) => {
  const { channelId, startDate, endDate } = req.body as ScanRequest;

  if (typeof channelId !== 'string' || !/^[A-Z0-9]{1,32}$/i.test(channelId)) {
    res.status(400).json({ error: 'channelId must be a non-empty alphanumeric string' });
    return;
  }

  const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (startDate !== undefined && (typeof startDate !== 'string' || !ISO_DATE_RE.test(startDate) || isNaN(new Date(startDate).getTime()))) {
    res.status(400).json({ error: 'startDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }
  if (endDate !== undefined && (typeof endDate !== 'string' || !ISO_DATE_RE.test(endDate) || isNaN(new Date(endDate).getTime()))) {
    res.status(400).json({ error: 'endDate must be a valid ISO date (YYYY-MM-DD)' });
    return;
  }

  const start = Date.now();

  const oldest = startDate ? String(new Date(startDate).getTime() / 1000) : undefined;
  // Add one day to endDate so the end of that day is included (Slack's `latest` is exclusive)
  const latest = endDate
    ? String((new Date(endDate).getTime() + 86_400_000) / 1000)
    : undefined;

  try {
    const channelName = await slack.getChannelName(channelId);
    await slack.joinChannelIfNeeded(channelId);
    const messages = await slack.fetchAllMessages(channelId, oldest, latest);
    const threaded = messages.filter(m => (m.reply_count ?? 0) > 0);

    const existingKb = kb.load(channelName);
    const existingIds = new Set(existingKb.entries.map(e => e.id));

    let entriesSkipped = 0;
    const newEntries = [];

    for (const msg of threaded) {
      const id = `${channelId}-${msg.ts}`;
      if (existingIds.has(id)) {
        entriesSkipped++;
        continue;
      }

      try {
        const thread = await slack.fetchThread(channelId, msg.ts);
        const extracted = await claude.extractKnowledge(thread);
        if (!extracted) {
          entriesSkipped++;
          continue;
        }
        newEntries.push({ ...extracted, id, scannedAt: new Date().toISOString() });
      } catch {
        entriesSkipped++;
      }
    }

    const entriesAdded = kb.addEntries(channelName, newEntries);

    const response: ScanResponse = {
      channelId,
      channelName,
      threadsScanned: threaded.length,
      entriesAdded,
      entriesSkipped,
      durationMs: Date.now() - start,
    };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[scan] error:', message);
    if (message.includes('not found')) {
      res.status(404).json({ error: 'Channel not found' });
    } else {
      res.status(502).json({ error: 'Scan failed. Please try again.' });
    }
  }
});

export default router;
