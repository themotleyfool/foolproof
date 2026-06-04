import { Router } from 'express';
import type { LookupRequest, LookupResponse } from '../../src/types/index.js';
import * as claude from '../services/claude.js';
import * as kb from '../services/knowledge-base.js';
import * as slack from '../services/slack.js';

const router = Router();

router.post('/', async (req, res) => {
  const { slackUrl } = req.body as LookupRequest;

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
    const status = message.includes('Invalid Slack URL') ? 400 : 502;
    res.status(status).json({ error: message });
  }
});

export default router;
