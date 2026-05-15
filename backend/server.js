import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import './database.js';
import tasksRouter from './routes/tasks.js';
import scheduleRouter from './routes/schedule.js';
import settingsRouter from './routes/settings.js';
import { initCronJobs } from './cronJobs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: allow local dev and Vercel deployment
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  process.env.VERCEL_URL, // will be set after Vercel deployment
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// API routes
app.use('/api/tasks', tasksRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/settings', settingsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  initCronJobs();
});
