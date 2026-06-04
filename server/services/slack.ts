import { WebClient } from '@slack/web-api';
import type { SlackMessage, SlackThread } from '../../src/types/index.js';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

const userNameCache = new Map<string, string>();

async function resolveUserName(userId: string): Promise<string> {
  if (!userId) return '';
  const cached = userNameCache.get(userId);
  if (cached !== undefined) return cached;
  try {
    const res = await client.users.info({ user: userId });
    const name = res.user?.profile?.display_name || res.user?.real_name || userId;
    userNameCache.set(userId, name);
    return name;
  } catch (err) {
    console.warn(`[slack] users.info failed for ${userId}:`, err instanceof Error ? err.message : err);
    return userId;
  }
}

export async function joinChannelIfNeeded(channelId: string): Promise<void> {
  await client.conversations.join({ channel: channelId });
}

export async function fetchAllMessages(
  channelId: string,
  oldest?: string
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
      ...(oldest !== undefined && { oldest }),
    });
    for (const msg of res.messages ?? []) {
      if (msg.ts && msg.text) {
        messages.push({
          ts: msg.ts,
          user: msg.user ?? '',
          text: msg.text,
          thread_ts: msg.thread_ts,
          reply_count: msg.reply_count,
        });
      }
    }
    cursor = res.response_metadata?.next_cursor ?? undefined;
  } while (cursor);
  return messages;
}

export async function fetchThread(channelId: string, threadTs: string): Promise<SlackThread> {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.replies({
      channel: channelId,
      ts: threadTs,
      cursor,
    });
    for (const msg of res.messages ?? []) {
      if (msg.ts && msg.text) {
        messages.push({
          ts: msg.ts,
          user: msg.user ?? '',
          text: msg.text,
          thread_ts: msg.thread_ts,
          reply_count: msg.reply_count,
        });
      }
    }
    cursor = res.response_metadata?.next_cursor ?? undefined;
  } while (cursor);

  const uniqueUserIds = [...new Set(messages.map(m => m.user).filter(Boolean))];
  await Promise.all(uniqueUserIds.map(resolveUserName));
  for (const msg of messages) {
    msg.userName = userNameCache.get(msg.user) ?? msg.user;
  }

  const [parent, ...replies] = messages;
  const channelName = await getChannelName(channelId);
  return { parentMessage: parent, replies, channelId, channelName };
}

// Parses both permalink formats:
//   https://<ws>.slack.com/archives/<channelId>/p<ts_nodot>
//   https://<ws>.slack.com/archives/<channelId>/p<ts_nodot>?thread_ts=...&cid=...
// The 'p' prefix omits the decimal: p1717000000123456 → 1717000000.123456
export function parseThreadUrl(slackUrl: string): { channelId: string; threadTs: string } {
  const match = slackUrl.match(/\/archives\/([A-Z0-9]+)\/p(\d+)/i);
  if (!match) throw new Error('Invalid Slack URL');
  const channelId = match[1];
  const rawTs = match[2];
  const threadTs = rawTs.slice(0, -6) + '.' + rawTs.slice(-6);
  return { channelId, threadTs };
}

export async function getChannelName(channelId: string): Promise<string> {
  const res = await client.conversations.info({ channel: channelId });
  return res.channel?.name ?? channelId;
}
