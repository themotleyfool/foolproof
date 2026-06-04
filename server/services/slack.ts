import { WebClient } from '@slack/web-api';
import type { SlackMessage, SlackThread } from '../../src/types/index.js';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

const userNameCache = new Map<string, string>();
const channelNameCache = new Map<string, string>();

/**
 * Resolves a Slack user ID to a display name, with in-memory caching.
 * @param userId - The Slack user ID (e.g. "U01CX34UDLK").
 * @returns The user's display name, or the raw ID if resolution fails.
 */
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

/**
 * Joins a Slack channel if the bot is not already a member. Idempotent.
 * @param channelId - The Slack channel ID to join.
 */
export async function joinChannelIfNeeded(channelId: string): Promise<void> {
  await client.conversations.join({ channel: channelId });
}

/**
 * Fetches all messages from a channel, paginating through the full history.
 * @param channelId - The Slack channel ID to fetch messages from.
 * @param oldest - Optional Unix timestamp string; only fetch messages after this time.
 * @param latest - Optional Unix timestamp string; only fetch messages before this time.
 * @returns Array of all messages in the channel, oldest first.
 */
export async function fetchAllMessages(
  channelId: string,
  oldest?: string,
  latest?: string
): Promise<SlackMessage[]> {
  const messages: SlackMessage[] = [];
  let cursor: string | undefined;
  do {
    const res = await client.conversations.history({
      channel: channelId,
      limit: 200,
      cursor,
      ...(oldest !== undefined && { oldest }),
      ...(latest !== undefined && { latest }),
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

/**
 * Fetches all messages in a thread and resolves user IDs to display names.
 * @param channelId - The Slack channel ID containing the thread.
 * @param threadTs - The timestamp of the parent message that starts the thread.
 * @returns A SlackThread with the parent message, replies, and resolved usernames.
 */
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

  if (messages.length === 0) {
    throw new Error(`Thread ${threadTs} in channel ${channelId} returned no messages`);
  }
  const [parent, ...replies] = messages;
  const channelName = await getChannelName(channelId);
  return { parentMessage: parent, replies, channelId, channelName };
}

/**
 * Parses a Slack message permalink into its channel ID and thread timestamp.
 * Handles both plain and threaded permalink formats.
 * @param slackUrl - A Slack permalink (e.g. "https://ws.slack.com/archives/C123/p1717000000123456").
 * @returns An object with `channelId` and `threadTs` (dot-separated timestamp).
 * @throws Error if the URL does not match the expected Slack permalink format.
 */
export function parseThreadUrl(slackUrl: string): { channelId: string; threadTs: string } {
  const match = slackUrl.match(/\/archives\/([A-Z0-9]+)\/p(\d+)/i);
  if (!match) throw new Error('Invalid Slack URL');
  const channelId = match[1];
  const rawTs = match[2];
  const threadTs = rawTs.slice(0, -6) + '.' + rawTs.slice(-6);
  return { channelId, threadTs };
}

/**
 * Fetches the human-readable name of a Slack channel, with in-memory caching.
 * @param channelId - The Slack channel ID to look up.
 * @returns The channel name, or the channel ID as a fallback if unavailable.
 */
export async function getChannelName(channelId: string): Promise<string> {
  const cached = channelNameCache.get(channelId);
  if (cached !== undefined) return cached;
  const res = await client.conversations.info({ channel: channelId });
  const name = res.channel?.name ?? channelId;
  channelNameCache.set(channelId, name);
  return name;
}
