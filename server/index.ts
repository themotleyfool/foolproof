import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import scanRouter from './routes/scan.js';
import lookupRouter from './routes/lookup.js';
import knowledgeRouter from './routes/knowledge.js';

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api/scan', scanRouter);
app.use('/api/lookup', lookupRouter);
app.use('/api/knowledge', knowledgeRouter);

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
