import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { KnowledgeBase, KnowledgeEntry } from '../../src/types/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KB_DIR = path.resolve(__dirname, '../../data');

function kbPath(channelName: string): string {
  return path.join(KB_DIR, `${channelName}.json`);
}

export function load(channelName: string): KnowledgeBase {
  const file = kbPath(channelName);
  if (!fs.existsSync(file)) {
    return { version: 1, lastUpdated: new Date().toISOString(), entries: [] };
  }
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as KnowledgeBase;
}

function save(channelName: string, kb: KnowledgeBase): void {
  if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });
  const file = kbPath(channelName);
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(kb, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
}

export function addEntries(channelName: string, entries: KnowledgeEntry[]): number {
  const kb = load(channelName);
  const existingIds = new Set(kb.entries.map(e => e.id));
  const fresh = entries.filter(e => !existingIds.has(e.id));
  kb.entries.push(...fresh);
  kb.lastUpdated = new Date().toISOString();
  save(channelName, kb);
  return fresh.length;
}

export function removeEntry(channelName: string, id: string): boolean {
  const kb = load(channelName);
  const before = kb.entries.length;
  kb.entries = kb.entries.filter(e => e.id !== id);
  if (kb.entries.length === before) return false;
  kb.lastUpdated = new Date().toISOString();
  save(channelName, kb);
  return true;
}

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

export function listChannels(): string[] {
  if (!fs.existsSync(KB_DIR)) return [];
  return fs
    .readdirSync(KB_DIR)
    .filter(f => f.endsWith('.json') && !f.endsWith('.tmp'))
    .map(f => f.slice(0, -5));
}
