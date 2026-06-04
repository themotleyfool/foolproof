# Slack AI Knowledge Extractor — Agent Guide

## What this project does

A local developer tool that scans Slack channels for threaded conversations, uses an LLM to extract problem/solution pairs, stores them in a per-channel JSON knowledge base, and lets users paste a Slack thread URL to get an AI-suggested solution based on prior findings.

## Architecture

Two processes run in parallel via `npm run dev`:

- **Vite dev server** (`localhost:5173`) — React/TypeScript frontend
- **Express server** (`localhost:3001`) — handles all Slack API and LLM calls; the frontend never touches secrets

Vite proxies `/api/*` to `localhost:3001`, so all frontend fetches use `/api/...` paths.

## Directory structure

```
lib/
  data/                     # Static data files (e.g. Slack channel list)
  knowledge-bases/          # Runtime-generated JSON files, one per channel
  scripts/                  # One-off utility scripts (e.g. fetch-channels.ts)
server/
  index.ts                  # Express entry point
  routes/
    scan.ts                 # POST /api/scan
    lookup.ts               # POST /api/lookup
    knowledge.ts            # GET/DELETE /api/knowledge
  services/
    slack.ts                # Slack Web API wrapper
    claude.ts               # LLM wrapper (OpenAI-compatible client → LiteLLM proxy)
    knowledge-base.ts       # JSON file CRUD for knowledge bases
src/
  App.tsx                   # Tab shell + header stats
  components/
    scan-channel.tsx        # "Scan channel" tab
    lookup-thread.tsx       # "Look up thread" tab
    knowledge-base-panel.tsx # "Knowledge base" tab
    shared.tsx              # Reusable UI primitives (TagChip, ConfidenceMeter, etc.)
  hooks/
    use-api.ts              # Typed fetch wrapper
  types/index.ts            # Shared TypeScript interfaces (used by both src/ and server/)
  index.css                 # Design system tokens and component styles
```

## Documentation

Every function, React component, and hook must have a JSDoc docstring. Include a one-line summary, `@param` tags for each parameter, and a `@returns` tag where applicable. Example:

```ts
/**
 * Resolves a Slack user ID to a display name, with in-memory caching.
 * @param userId - The Slack user ID (e.g. "U01CX34UDLK").
 * @returns The user's display name, or the raw ID if resolution fails.
 */
async function resolveUserName(userId: string): Promise<string>
```

## Key conventions

**Types live in `src/types/index.ts`** and are imported by both the frontend and the server. When adding new API shapes, define them there.

**LLM calls go through `server/services/claude.ts`**, which uses the OpenAI-compatible client pointed at a LiteLLM proxy (`litellm.fool.com`). The model is set by `LLM_MODEL` in `.env`. Do not add direct Anthropic SDK calls — route everything through this service.

**Knowledge bases are per-channel JSON files** at `lib/knowledge-bases/{channelName}.json`. All reads/writes go through `server/services/knowledge-base.ts`. The save is atomic (write to `.tmp`, then rename).

**Entry IDs** are `{channelId}-{threadTs}` and are used for deduplication on every scan.

**Slack permalinks** follow the format `https://{workspace}.slack.com/archives/{channelId}/p{ts_no_dot}`. The workspace URL comes from `VITE_SLACK_WORKSPACE_URL` in `.env` (a `VITE_` prefix makes it available to the frontend at build time).

**Styling** uses a custom design system defined in `src/index.css` — CSS custom properties for tokens, utility classes for components (`card`, `btn`, `input`, `label`, etc.). Do not introduce Tailwind utility classes; the design system replaces them.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SLACK_BOT_TOKEN` | Yes | Slack bot token (`xoxb-...`) |
| `OPENAI_API_KEY` | Yes | API key for the LiteLLM proxy |
| `LLM_MODEL` | Yes | Model identifier (e.g. `anthropic/claude-sonnet-4-6`) |
| `PORT` | No | Express port (default `3001`) |
| `VITE_SLACK_WORKSPACE_URL` | No | Workspace base URL for Slack deep links (e.g. `https://fool.slack.com/`) |

Copy `.env.example` to `.env` to get started.

## Running locally

```bash
npm install
cp .env.example .env   # then fill in secrets
npm run dev            # starts both Vite and the Express server
```

## API routes

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/scan` | Scan a channel; body: `{ channelId, startDate? }` |
| `POST` | `/api/lookup` | Look up a thread; body: `{ slackUrl }` |
| `GET` | `/api/knowledge` | List channels that have a knowledge base |
| `GET` | `/api/knowledge/:channel` | Get entries; query params: `tag`, `q` |
| `DELETE` | `/api/knowledge/:channel/:id` | Remove an entry by ID |

## Required Slack bot OAuth scopes

`channels:history`, `channels:read`, `channels:join`, `users:read`
