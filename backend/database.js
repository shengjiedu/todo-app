import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.FLY_VOLUME_DIR
  ? path.join('/data', 'todo.db')
  : path.join(__dirname, 'todo.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Create tables if not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    scheduledDate TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT,
    brainTokens INTEGER NOT NULL DEFAULT 0,
    intensity TEXT NOT NULL DEFAULT 'low',
    priority INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'pending',
    autoRollover INTEGER NOT NULL DEFAULT 1,
    rolloverCount INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    dailyTokenBudget INTEGER NOT NULL DEFAULT 1000,
    wxPusherUID TEXT,
    wxPusherToken TEXT,
    remindTime TEXT NOT NULL DEFAULT '22:00',
    morningPushTime TEXT NOT NULL DEFAULT '08:00',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,
    totalTasks INTEGER NOT NULL DEFAULT 0,
    completedTasks INTEGER NOT NULL DEFAULT 0,
    rolledTasks INTEGER NOT NULL DEFAULT 0,
    totalTokens INTEGER NOT NULL DEFAULT 0,
    snapshot TEXT
  );
`);

// Insert default settings if not exists
const defaultSettings = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!defaultSettings) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO settings (id, dailyTokenBudget, remindTime, morningPushTime, createdAt, updatedAt)
    VALUES (1, 1000, '22:00', '08:00', ?, ?)
  `).run(now, now);
}

export default db;
