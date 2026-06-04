import { WebClient } from '@slack/web-api';
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const outPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/slack-channels.json');

const channels: { id: string; name: string }[] = [];
let cursor: string | undefined;

do {
  const res = await client.conversations.list({
    types: 'public_channel',
    exclude_archived: true,
    limit: 200,
    cursor,
  });
  for (const ch of res.channels ?? []) {
    if (ch.id && ch.name) channels.push({ id: ch.id, name: ch.name });
  }
  cursor = res.response_metadata?.next_cursor ?? undefined;
} while (cursor);

channels.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(outPath, JSON.stringify(channels, null, 2), 'utf-8');
console.log(`Wrote ${channels.length} channels to ${outPath}`);
