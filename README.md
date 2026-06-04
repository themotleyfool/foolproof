# Slack AI Knowledge Tool

A local dev tool that scans public Slack channels to extract problem/solution pairs using Claude, stores them in a knowledge base, and lets you look up solutions by pasting a Slack permalink.

---

## Setup: Existing App (Team Member)

The Slack app and API keys are already created. Credentials are stored in 1Password:

> **1Password link:** `<PLACEHOLDER>`

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in the values from the 1Password entry.
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
| `SLACK_BOT_TOKEN` | Bot User OAuth Token from Slack app (`xoxb-...`) |
| `OPENAI_API_KEY` | LiteLLM key from Orion Keyring |
| `LLM_MODEL` | Model name copied from Orion Keyring Models list |
| `PORT` | Express server port (default: `3001`) |

### 5. Install Dependencies and Run

```bash
npm i
npm run dev
```

The app runs the React frontend (Vite) and Express backend concurrently. The frontend proxies `/api` requests to the backend on port 3001.

---

## Architecture

- **Frontend:** React 19 + TypeScript + Vite + Tailwind v4 (`src/`)
- **Backend:** Express + TypeScript via `tsx` (`server/`)
- **Knowledge base:** JSON files at `knowledge-bases/{channel-name}.json`

### Key Files

| File | Purpose |
|---|---|
| `server/services/slack.ts` | Slack Web API wrapper |
| `server/services/claude.ts` | LLM calls via LiteLLM proxy |
| `server/services/knowledgeBase.ts` | Knowledge base CRUD |
| `server/routes/scan.ts` | `POST /api/scan` — scan a channel |
| `server/routes/lookup.ts` | `POST /api/lookup` — look up by permalink |
| `server/routes/knowledge.ts` | `GET/DELETE /api/knowledge` |
| `src/types/index.ts` | Shared types |
