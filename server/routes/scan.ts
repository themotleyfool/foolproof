import { Router } from 'express';
import type { ScanRequest, ScanResponse } from '../../src/types/index.js';
import * as claude from '../services/claude.js';
import * as kb from '../services/knowledge-base.js';
import * as slack from '../services/slack.js';

const router = Router();

const activeScans = new Set<string>();

/**
 * Writes a single SSE event to the response.
 * @param res - The Express response object.
 * @param eventType - The SSE event name (e.g. "progress", "done", "error").
 * @param data - The payload to JSON-encode as the event data.
 */
function emit(res: import('express').Response, eventType: string, data: object): void {
  res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/scan
 * Scans a Slack channel for threaded conversations and extracts problem/solution pairs
 * into the knowledge base. Responds with a Server-Sent Events stream so the client can
 * display live progress. Emits `progress` events as work proceeds, then a final `done`
 * or `error` event.
 * @body {ScanRequest} - `channelId` (required), `startDate` and `endDate` (optional ISO date strings).
 * @streams progress { phase: ScanPhase, processed?: number, total?: number }
 * @streams done {ScanResponse}
 * @streams error { error: string }
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

  if (activeScans.has(channelId)) {
    res.status(409).json({ error: 'A scan is already in progress for this channel' });
    return;
  }

  // Switch to SSE mode — headers must be set before any write
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  activeScans.add(channelId);
  const start = Date.now();

  const oldest = startDate ? String(new Date(startDate).getTime() / 1000) : undefined;
  // Add one day to endDate so the end of that day is included (Slack's `latest` is exclusive)
  const latest = endDate
    ? String((new Date(endDate).getTime() + 86_400_000) / 1000)
    : undefined;

  try {
    emit(res, 'progress', { phase: 'resolving' });
    const channelName = await slack.getChannelName(channelId);
    await slack.joinChannelIfNeeded(channelId);

    emit(res, 'progress', { phase: 'fetching' });
    const messages = await slack.fetchAllMessages(channelId, oldest, latest);
    const threaded = messages.filter(m => (m.reply_count ?? 0) > 0);

    const existingKb = kb.load(channelName);
    const existingIds = new Set(existingKb.entries.map(e => e.id));
    const toProcess = threaded.filter(m => !existingIds.has(`${channelId}-${m.ts}`));

    let entriesSkipped = threaded.length - toProcess.length;
    const newEntries = [];
    let processed = 0;

    emit(res, 'progress', { phase: 'analyzing', processed: 0, total: toProcess.length });

    for (const msg of toProcess) {
      const id = `${channelId}-${msg.ts}`;
      try {
        const thread = await slack.fetchThread(channelId, msg.ts);
        const extracted = await claude.extractKnowledge(thread);
        if (!extracted) {
          entriesSkipped++;
        } else {
          newEntries.push({ ...extracted, id, scannedAt: new Date().toISOString() });
        }
      } catch {
        entriesSkipped++;
      }
      processed++;
      emit(res, 'progress', { phase: 'analyzing', processed, total: toProcess.length });
    }

    emit(res, 'progress', { phase: 'saving' });
    const entriesAdded = kb.addEntries(channelName, newEntries);

    const response: ScanResponse = {
      channelId,
      channelName,
      threadsScanned: threaded.length,
      entriesAdded,
      entriesSkipped,
      durationMs: Date.now() - start,
    };
    emit(res, 'done', response);
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[scan] error:', message);
    emit(res, 'error', {
      error: message.includes('not found') ? 'Channel not found' : 'Scan failed. Please try again.',
    });
    res.end();
  } finally {
    activeScans.delete(channelId);
  }
});

export default router;
