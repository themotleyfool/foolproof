import { Router } from 'express';
import type { LookupRequest, LookupResponse } from '../../src/types/index.js';
import * as claude from '../services/claude.js';
import * as kb from '../services/knowledge-base.js';
import * as slack from '../services/slack.js';

const router = Router();

/**
 * POST /api/lookup
 * Fetches a Slack thread by permalink and returns an AI-suggested solution
 * based on the channel's knowledge base.
 * @body {LookupRequest} - `slackUrl` — a Slack message permalink.
 * @returns {LookupResponse} - The fetched thread, suggested solution, and related KB entries.
 */
router.post('/', async (req, res) => {
  const { slackUrl } = req.body as LookupRequest;

  if (typeof slackUrl !== 'string' || !slackUrl.trim()) {
    res.status(400).json({ error: 'slackUrl is required' });
    return;
  }

  try {
    const { channelId, threadTs } = slack.parseThreadUrl(slackUrl);
    const thread = await slack.fetchThread(channelId, threadTs);
    const knowledgeBase = kb.load(thread.channelName);
    const { suggestedSolution, relatedEntries } = await claude.suggestSolution(
      thread,
      knowledgeBase
    );

    const response: LookupResponse = { thread, suggestedSolution, relatedEntries };
    res.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[lookup] error:', message);
    if (message === 'Invalid Slack URL') {
      res.status(400).json({ error: 'Invalid Slack URL' });
    } else {
      res.status(502).json({ error: 'Lookup failed. Please try again.' });
    }
  }
});

export default router;
