import express from 'express';
import sqlite3 from 'sqlite3';
import { dbExec } from '../src/db/sqliteAsync.js';
import { setActiveDb } from '../src/db/dbContext.js';
import ticketsRoutes from '../src/routes/ticketsRoutes.js';
import webhooksRoutes from '../src/routes/webhooksRoutes.js';

export const testDb = new sqlite3.Database(':memory:');

export async function initTestDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ciName TEXT, ciCat TEXT, ciSubcat TEXT,
      status TEXT, impact TEXT, urgency TEXT, priority TEXT,
      openTime TEXT, resolvedTime TEXT, closeTime TEXT,
      archived INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL, event TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_url_event
      ON webhooks(url, event);
  `;
  await dbExec(testDb, sql);
  setActiveDb(testDb);
}

export function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tickets', ticketsRoutes);
  app.use('/api/webhooks', webhooksRoutes);
  return app;
}