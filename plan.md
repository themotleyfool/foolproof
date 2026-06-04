# Slack AI Knowledge Extractor — Implementation Plan

## Context

Build a local developer tool that (1) scans a public Slack channel to extract problem/solution pairs from threaded conversations using Claude, storing them in a JSON knowledge base, and (2) lets the user paste a Slack message URL to get an AI-suggested solution based on prior findings. The project is an empty React/TypeScript/Vite scaffold — no Slack or AI code exists yet.

---

## Architecture

**Frontend**: React (existing scaffold) — UI for scanning channels and looking up threads.  
**Backend**: Express.js server added to this project — handles all API calls to Slack and Anthropic so tokens never reach the browser.  
**Storage**: `knowledge-bases/{channel-name}.json` — flat JSON file.  
**Dev**: Vite proxies `/api` to `localhost:3001`; both run together via `concurrently`.

---

## Directory Structure

New/modified files:

```
├── .env                           # NEW — secrets (gitignored)
├── .env.example                   # NEW — placeholder template
├── knowledge-bases/
│   └── {channel-name}.json        # NEW — generated at runtime (gitignored)
├── server/
│   ├── tsconfig.json              # NEW
│   ├── index.ts                   # NEW — Express app entry
│   ├── routes/
│   │   ├── scan.ts                # NEW — POST /api/scan
│   │   ├── lookup.ts              # NEW — POST /api/lookup
│   │   └── knowledge.ts           # NEW — GET /api/knowledge, DELETE /api/knowledge/:id
│   └── services/
│       ├── slack.ts               # NEW — Slack Web API wrapper
│       ├── claude.ts              # NEW — Anthropic SDK wrapper
│       └── knowledge-base.ts       # NEW — JSON file CRUD
├── src/
│   ├── components/
│   │   ├── scan-channel.tsx        # NEW
│   │   ├── lookup-thread.tsx       # NEW
│   │   ├── knowledge-base-panel.tsx # NEW
│   │   └── status-message.tsx      # NEW — shared error/success banner
│   ├── hooks/
│   │   └── use-api.ts              # NEW — typed fetch wrapper
│   ├── types/
│   │   └── index.ts               # NEW — shared types (used by both src/ and server/)
│   ├── App.tsx                    # MODIFIED — replace scaffold with 3-tab layout
│   ├── App.css                    # DELETED — replaced by Tailwind utility classes
│   └── index.css                  # MODIFIED — replace scaffold styles with @import "tailwindcss"
├── vite.config.ts                 # MODIFIED — add /api proxy + Tailwind plugin
└── package.json                   # MODIFIED — new deps + scripts
```

---

## Dependencies to Install

```bash
npm install @slack/web-api @anthropic-ai/sdk express dotenv cors
npm install --save-dev @types/express @types/cors concurrently tsx nodemon tailwindcss @tailwindcss/vite
```

---

## TypeScript Types — `src/types/index.ts`

```typescript
export interface SlackMessage {
  ts: string;
  user: string;
  text: string;
  thread_ts?: string;
  reply_count?: number;
}

export interface SlackThread {
  parentMessage: SlackMessage;
  replies: SlackMessage[];
  channelId: string;
  channelName: string;
}

export interface KnowledgeEntry {
  id: string; // `${channelId}-${threadTs}`
  channelId: string;
  channelName: string;
  threadTs: string;
  scannedAt: string; // ISO 8601
  problem: string;
  solution: string;
  rawMessages: SlackMessage[];
  tags: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface KnowledgeBase {
  version: 1;
  lastUpdated: string;
  entries: KnowledgeEntry[];
}

export interface ScanRequest {
  channelName: string;
  maxMessages?: number;
}
export interface ScanResponse {
  channelId: string;
  channelName: string;
  threadsScanned: number;
  entriesAdded: number;
  entriesSkipped: number;
  durationMs: number;
}
export interface LookupRequest {
  slackUrl: string;
}
export interface LookupResponse {
  thread: SlackThread;
  suggestedSolution: string;
  relatedEntries: KnowledgeEntry[];
}
export interface ApiError {
  error: string;
  details?: string;
}
```

---

## Express Routes

### `POST /api/scan` (`server/routes/scan.ts`)

1. Resolve channel name → ID via `slack.resolveChannel()`
2. Join the channel via `slack.joinChannelIfNeeded()`
3. Fetch all messages (paginated) via `slack.fetchAllMessages(channelId, maxMessages)`
4. Filter to messages with `reply_count > 0`
5. Skip threads already in knowledge base (match on `id = ${channelId}-${thread_ts}`)
6. For each new thread, call `claude.extractKnowledge(thread)` — returns entry or `null`
7. Save non-null entries via `knowledgeBase.addEntries()`
8. Return `ScanResponse`

### `POST /api/lookup` (`server/routes/lookup.ts`)

1. Parse Slack permalink URL via `slack.parseThreadUrl()` → `{ channelId, threadTs }`
   - Handles format `https://<ws>.slack.com/archives/<C>/p<ts_nodot>` (strip `p`, insert `.` 6 chars from end)
2. Fetch the thread via `slack.fetchThread(channelId, threadTs)`
3. Load knowledge base via `knowledgeBase.load()`
4. Call `claude.suggestSolution(thread, kb)` → `{ suggestedSolution, relatedEntries }`
5. Return `LookupResponse`

### `GET /api/knowledge` + `DELETE /api/knowledge/:id` (`server/routes/knowledge.ts`)

- GET: load KB, apply optional `?channel`, `?tag`, `?q` filters, return `{ entries, total }`
- DELETE: remove entry by ID, return `{ success: true }` or 404

---

## Services

### `server/services/slack.ts`

Instantiate `WebClient` once at module level from `process.env.SLACK_BOT_TOKEN`.

| Function                      | What it does                                                         |
| ----------------------------- | -------------------------------------------------------------------- |
| `resolveChannel(name)`        | Paginate `conversations.list` to find channel ID by name             |
| `joinChannelIfNeeded(id)`     | Call `conversations.join` (idempotent)                               |
| `fetchAllMessages(id, limit)` | Cursor-paginate `conversations.history` up to `limit`                |
| `fetchThread(id, ts)`         | Cursor-paginate `conversations.replies` for the thread               |
| `parseThreadUrl(url)`         | Parse permalink → `{ channelId, threadTs }`, handle both URL formats |
| `getChannelName(id)`          | `conversations.info` → channel name                                  |

### `server/services/claude.ts`

Instantiate Anthropic client once at module level. Model: `process.env.LLM_MODEL ?? 'claude-sonnet-4-5'`.

**`extractKnowledge(thread)`** — extraction prompt (see below). Returns `Omit<KnowledgeEntry, 'id'|'scannedAt'>` or `null` if the thread response is exactly `NOT_APPLICABLE`.

**`suggestSolution(thread, kb)`** — lookup prompt (see below). Returns `{ suggestedSolution, relatedEntries }` where `relatedEntries` is KB entries matched by the IDs Claude returns.

### `server/services/knowledgeBase.ts`

Operates on `knowledge-bases/{channel-name}.json` (path resolved relative to the project root).

| Function                  | What it does                                                |
| ------------------------- | ----------------------------------------------------------- |
| `load()`                  | Read + parse JSON; return empty base if file doesn't exist  |
| `addEntries(entries)`     | Load, deduplicate by `id`, append, save; return added count |
| `removeEntry(id)`         | Load, filter out, save; return `true` if found              |
| `filterEntries(kb, opts)` | In-memory filter by channel, tag, and text query            |

Writes atomically: write to `.tmp` file first, then rename.

---

## Claude Prompts

### Extraction prompt (inside `extractKnowledge`)

```
You are analyzing a Slack thread to extract a problem/solution pair for a knowledge base.

Channel: #{{channelName}}

Parent message:
  {{parentText}}

Replies:
{{replies.map(r => `  ${r.text}`).join('\n') || '  (none)'}}

Determine whether this thread contains a clear problem AND a resolution or solution.
If it's casual chat, an announcement, or an unresolved question, respond with exactly: NOT_APPLICABLE

Otherwise respond with this JSON (no markdown fences):
{
  "problem": "concise problem description (1-3 sentences)",
  "solution": "concise solution description (1-5 sentences, include commands/steps if present)",
  "tags": ["tag1", "tag2"],
  "confidence": "high" | "medium" | "low"
}

Tags: lowercase, 1-3 words, technical domain (e.g. "docker", "oauth", "db-migrations").
Confidence: high = solution confirmed resolved; medium = likely helped; low = speculative.
```

### Lookup / suggestion prompt (inside `suggestSolution`)

```
You are a technical support assistant with access to a knowledge base.

## Current Thread
Channel: #{{channelName}}
{{parentText}}
{{replies.map(r => `  ${r.text}`).join('\n') || '(no replies yet)'}}

## Knowledge Base ({{entries.length}} entries)
{{entries.slice(0,50).map((e,i) =>
  `[${i+1}] ID: ${e.id}\nProblem: ${e.problem}\nSolution: ${e.solution}\nTags: ${e.tags.join(', ')}`
).join('\n\n')}}

Instructions:
1. Identify the 0-5 most relevant KB entries. Output their IDs in "relatedEntryIds".
2. Write a "suggestedSolution" — actionable, under 300 words. Use KB context if relevant; answer from the thread alone if no KB entries match.

Respond with JSON (no markdown fences):
{
  "suggestedSolution": "...",
  "relatedEntryIds": ["id1", "id2"]
}
```

Note: if KB grows beyond 50 entries, pre-filter by keyword scoring before passing to the prompt.

---

## React Components

All components use Tailwind utility classes — no CSS modules or custom stylesheets.

**`App.tsx`** — Three tabs: "Scan Channel", "Lookup Thread", "Knowledge Base". Minimal state (`activeTab`). Tab bar uses `flex border-b` with active tab highlighted via `border-b-2 border-blue-500 text-blue-600`.

**`scan-channel.tsx`** — Channel name input, max messages input, submit button. Shows scanning progress, then stats card (threads scanned / entries added / skipped / duration). Uses `POST /api/scan`. Inputs use `border rounded px-3 py-2`; button uses `bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700`.

**`lookup-thread.tsx`** — Slack URL input, submit button. Shows spinner while loading. After success: thread summary in a `bg-gray-50 rounded p-4` box, suggested solution in a `bg-white border rounded p-4 prose` box, collapsible related-entries list. Uses `POST /api/lookup`.

**`knowledge-base-panel.tsx`** — Filter bar (channel, tag, text search) with `flex gap-2`. Scrollable entry list (`overflow-y-auto`) with problem/solution/tags/confidence badge/date per card (`bg-white border rounded-lg p-4 shadow-sm`). Confidence badges: `bg-green-100 text-green-800` (high), `bg-yellow-100 text-yellow-800` (medium), `bg-red-100 text-red-800` (low). Tag chips: `bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full`. Uses `GET /api/knowledge` + `DELETE /api/knowledge/:id`.

**`status-message.tsx`** — `type: 'success' | 'error' | 'info'` + `message: string`. Renders a colored banner using Tailwind: success=`bg-green-50 border-green-300 text-green-800`, error=`bg-red-50 border-red-300 text-red-800`, info=`bg-blue-50 border-blue-300 text-blue-800`.

**`hooks/use-api.ts`** — Generic typed hook: `execute(body?) → Promise<T | null>`, `data`, `loading`, `error`, `reset`. Reads `ApiError.error` from non-2xx responses.

---

## Vite Config Change

Update `vite.config.ts` to add the Tailwind plugin and `/api` proxy:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true }
    }
  }
})
```

Update `src/index.css` to replace the scaffold content with:

```css
@import "tailwindcss";
```

Delete `src/App.css` — all styling will use Tailwind utility classes directly in JSX.

---

## Package.json Scripts

```json
"scripts": {
  "dev": "concurrently -n \"vite,server\" -c \"cyan,yellow\" \"vite\" \"npm run server:dev\"",
  "server:dev": "nodemon --watch server --ext ts --exec \"node --import tsx/esm server/index.ts\"",
  "server:build": "tsc -p server/tsconfig.json",
  "build": "tsc -b && vite build && npm run server:build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

---

## server/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "../dist/server",
    "rootDir": "..",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true
  },
  "include": [".", "../src/types"]
}
```

---

## Environment Variables

`.env` (gitignored):

```
SLACK_BOT_TOKEN=xoxb-...
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-sonnet-4-5
PORT=3001
```

Required Slack bot OAuth scopes: `channels:history`, `channels:read`, `channels:join`

---

## Verification

1. `cp .env.example .env` and fill in tokens
2. `npm install` (new deps)
3. `npm run dev` — expect cyan Vite output on :5173, yellow server output on :3001
4. `curl http://localhost:5173/api/knowledge` — expect `{"entries":[],"total":0}` (confirms proxy)
5. `curl -X POST http://localhost:3001/api/scan -H "Content-Type: application/json" -d '{"channelName":"general","maxMessages":50}'` — expect `ScanResponse`; inspect `knowledge-bases/{channel-name}.json`
6. Open `http://localhost:5173`, go to "Lookup Thread", paste a Slack permalink, verify suggestion + related entries appear
7. Check browser DevTools Network tab — confirm no tokens appear in any response
