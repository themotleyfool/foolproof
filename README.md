# FoolProof

A local dev tool that scans public Slack channels, uses Claude to extract problem/solution pairs into a knowledge base, and lets you find solutions via text search or by pasting a Slack thread URL for an AI-generated answer informed by past findings.

---

## Setup: Existing App (Team Member)

The Slack app and API keys are already created. Credentials are stored in 1Password:

> **1Password link:** https://start.1password.com/open/i?a=ANPCTG6MWRD2DIJDOYIDJKO7DQ&v=2ai65vnrpivxsju7hfyg6rst2a&i=qn2tpnqzpkmpp7vry3f5333mne&h=fool.1password.com

The Slack app name is [FoolProof](https://api.slack.com/apps/A0B87TMUS4W).

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the values from the 1Password entry.

> Note: You will want to get a new OpenAI API key from the Orion Keyring (at some point) so you're not using Timothy Caish's key that is in 1Password. Follow the instructions in the "Get LLM API Access" section below to create your own key.

3. Install dependencies and run:
   ```bash
   npm i
   npm run dev
   ```

---

## Setup: First Time (Creating a New App)

Follow these steps if you need to create the Slack app and API keys from scratch.

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click **Create New App** → **From scratch**.
2. Name your app and select your workspace.
3. Under **OAuth & Permissions**, add the following **Bot Token Scopes**:
   - `channels:history`
   - `channels:read`
   - `channels:join`
   - `users:read`
4. Click **Install to Workspace** and authorize the app.

### 2. Retrieve Bot User OAuth Token

1. Navigate to **OAuth & Permissions** in your Slack app settings.
2. Copy the **Bot User OAuth Token** (starts with `xoxb-`) — this is your `SLACK_BOT_TOKEN`.

### 3. Get LLM API Access

This tool routes LLM calls through the company's LiteLLM proxy. To get access:

1. Post in the **#it-sysadmin-help** Slack channel and request **Orion Keyring** access to create an OpenAI API key.
2. Once access is granted, log in to [https://orion.fool.com/keyring](https://orion.fool.com/keyring).
3. Click **Create Key**, fill in the details, and click **Create Key**.
4. Copy the generated key — this is your `OPENAI_API_KEY`.

   > This key is only shown once — store it securely in 1Password.

5. Click the **Models** button, search for the model you want to use, and copy the model name — this is your `LLM_MODEL`.

### 4. Configure Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `LLM_MODEL` | Model name copied from Orion Keyring Models list |
| `OPENAI_API_KEY` | LiteLLM key from Orion Keyring |
| `PORT` | Express server port (default: `3001`) |
| `SLACK_BOT_TOKEN` | Bot User OAuth Token from Slack app (`xoxb-...`) |
| `VITE_SLACK_WORKSPACE_URL` | Base URL for your Slack workspace (e.g. `https://fool.slack.com/`) |

### 5. Install Dependencies and Run

```bash
npm i
npm run dev
```

The app runs the React frontend (Vite) and Express backend concurrently. The frontend proxies `/api` requests to the backend on port 3001.

---

## Architecture

- **Frontend:** React 19 + TypeScript + Vite + TanStack Query + Tailwind v4 (`src/`)
- **Backend:** Express + TypeScript via `tsx` (`server/`)
- **Knowledge base:** JSON files at `lib/knowledge-bases/{channel-name}.json`

### Key Files

| File | Purpose |
|---|---|
| `server/services/slack.ts` | Slack Web API wrapper |
| `server/services/claude.ts` | LLM calls via LiteLLM proxy |
| `server/services/knowledge-base.ts` | Knowledge base CRUD |
| `server/routes/scan.ts` | `POST /api/scan` — scan a channel (streams SSE progress events) |
| `server/routes/lookup.ts` | `POST /api/lookup` — look up by permalink |
| `server/routes/knowledge.ts` | `GET/PATCH/DELETE /api/knowledge` + `POST /api/knowledge/:channel/:id/refresh` |
| `src/types/index.ts` | Shared types |
| `src/components/pages/` | Top-level page components |
| `src/components/modals/` | Modal dialog components |
| `src/components/ui/` | Generic, stateless UI primitives |
