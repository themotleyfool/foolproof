import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KnowledgeBase, KnowledgeEntry } from '../../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '../../knowledge-bases');

/**
 * Resolves the file path for a channel's knowledge base JSON file.
 * @param channelName - The Slack channel name (used as the filename).
 * @returns Absolute path to the knowledge base JSON file.
 */
function kbPath(channelName: string): string {
  return path.join(KB_DIR, `${channelName}.json`);
}

/**
 * Loads a channel's knowledge base from disk, returning an empty base if none exists.
 * @param channelName - The Slack channel name to load the knowledge base for.
 * @returns The parsed KnowledgeBase object.
 */
export function load(channelName: string): KnowledgeBase {
  const file = kbPath(channelName);
  if (!fs.existsSync(file)) {
    return { version: 1, lastUpdated: new Date().toISOString(), entries: [] };
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as KnowledgeBase;
}

/**
 * Atomically writes a knowledge base to disk by writing to a temp file then renaming.
 * @param channelName - The Slack channel name identifying which file to write.
 * @param kb - The KnowledgeBase object to persist.
 */
function save(channelName: string, kb: KnowledgeBase): void {
  if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });
  const file = kbPath(channelName);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(kb, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

/**
 * Appends new entries to a channel's knowledge base, skipping duplicates by ID.
 * @param channelName - The Slack channel name identifying which knowledge base to update.
 * @param entries - Array of entries to add.
 * @returns The number of entries actually added (duplicates excluded).
 */
export function addEntries(channelName: string, entries: KnowledgeEntry[]): number {
  const kb = load(channelName);
  const existingIds = new Set(kb.entries.map(e => e.id));
  const fresh = entries.filter(e => !existingIds.has(e.id));
  kb.entries.push(...fresh);
  kb.lastUpdated = new Date().toISOString();
  save(channelName, kb);
  return fresh.length;
}

/**
 * Removes a single entry from a channel's knowledge base by its ID.
 * @param channelName - The Slack channel name identifying which knowledge base to update.
 * @param id - The entry ID to remove.
 * @returns `true` if the entry was found and removed, `false` if it did not exist.
 */
export function removeEntry(channelName: string, id: string): boolean {
  const kb = load(channelName);
  const before = kb.entries.length;
  kb.entries = kb.entries.filter(e => e.id !== id);
  if (kb.entries.length === before) return false;
  kb.lastUpdated = new Date().toISOString();
  save(channelName, kb);
  return true;
}

/**
 * Filters knowledge base entries by tag and/or a text query against problem and solution fields.
 * @param kb - The KnowledgeBase to filter.
 * @param opts - Filter options: `tag` for exact tag match, `query` for case-insensitive text search.
 * @returns Array of entries matching all provided filters.
 */
export function filterEntries(
  kb: KnowledgeBase,
  opts: { tag?: string; query?: string }
): KnowledgeEntry[] {
  return kb.entries.filter(e => {
    if (opts.tag && !e.tags.includes(opts.tag)) return false;
    if (opts.query) {
      const q = opts.query.toLowerCase();
      if (!e.problem.toLowerCase().includes(q) && !e.solution.toLowerCase().includes(q))
        return false;
    }
    return true;
  });
}

/**
 * Lists the names of all channels that have a knowledge base file on disk.
 * @returns Array of channel name strings, derived from JSON filenames in the knowledge-bases directory.
 */
export function listChannels(): string[] {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
    .map(f => f.slice(0, -5));
}
