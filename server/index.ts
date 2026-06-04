import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import scanRouter from './routes/scan.js';
import lookupRouter from './routes/lookup.js';
import knowledgeRouter from './routes/knowledge.js';

const REQUIRED_ENV = ['SLACK_BOT_TOKEN', 'OPENAI_API_KEY', 'LLM_MODEL'] as const;
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
app.use(helmet());
app.use(express.json({ limit: '64kb' }));
app.use(cors({ origin: 'http://localhost:5173' }));

// Protect expensive Slack + LLM routes from rapid repeated calls
const llmLimiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Too many requests' } });

app.use('/api/scan', llmLimiter, scanRouter);
app.use('/api/lookup', llmLimiter, lookupRouter);
app.use('/api/knowledge', knowledgeRouter);

const PORT = process.env.PORT ?? 3001;
// Bind explicitly to loopback — this server has no auth and must not be reachable from the network
app.listen(Number(PORT), '127.0.0.1', () => console.log(`Server running on http://localhost:${PORT}`));
