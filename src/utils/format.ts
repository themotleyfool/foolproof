/**
 * Builds a Slack deep link URL for a message or thread.
 * For replies, appends thread_ts and cid query params so Slack opens the message in-thread.
 * @param workspaceUrl - The base workspace URL (e.g. "https://fool.slack.com/").
 * @param channelId - The Slack channel ID.
 * @param ts - The timestamp of the specific message to link to.
 * @param threadTs - The parent thread timestamp; omit or pass the same value as ts for the root message.
 * @returns A full Slack permalink URL.
 */
export function slackLink(workspaceUrl: string, channelId: string, ts: string, threadTs?: string): string {
  const pTs = 'p' + ts.replace('.', '');
  const base = `${workspaceUrl}archives/${channelId}/${pTs}`;
  return threadTs && threadTs !== ts
    ? `${base}?thread_ts=${threadTs}&cid=${channelId}`
    : base;
}

/**
 * Formats an ISO 8601 date string into a short localized date.
 * @param iso - An ISO 8601 date string.
 * @returns A localized short date string (e.g. "Jun 4, 2026").
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
