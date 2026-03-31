// src/db/initDb.js
import { getDb } from './database.js';
import { dbExec } from './sqliteAsync.js';

export async function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      ciName TEXT,
      ciCat TEXT,
      ciSubcat TEXT,

      status TEXT,
      impact TEXT,
      urgency TEXT,
      priority TEXT,

      openTime TEXT,
      resolvedTime TEXT,
      closeTime TEXT,

      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      event TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_url_event
      ON webhooks(url, event);
  `;

  try {
    await dbExec(getDb(), sql);
    console.log('[DB] Tabelas tickets + webhooks prontas.');
  } catch (err) {
    console.error('[DB] Erro a criar tabelas:', err.message);
    throw err;
  }
}
