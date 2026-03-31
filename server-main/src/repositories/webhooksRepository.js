// src/repositories/webhooksRepository.js

import { getActiveDb } from '../db/dbContext.js';
import { dbRun, dbAll } from '../db/sqliteAsync.js';

export async function createWebhook({ url, event }, db = getActiveDb()) {
  const sql = `
    INSERT OR IGNORE INTO webhooks (url, event, active)
    VALUES (?, ?, 1)
  `;

  const result = await dbRun(db, sql, [url, event]);
  if (!result || result.changes === 0) return 0;
  return result.lastID || 0;
}

export async function listWebhooks(db = getActiveDb()) {
  const sql = `
    SELECT id, url, event, active, createdAt
    FROM webhooks
    ORDER BY id DESC
  `;

  const rows = await dbAll(db, sql, []);
  return rows;
}

export async function listActiveWebhooksByEvent(event, db = getActiveDb()) {
  const sql = `
    SELECT id, url, event
    FROM webhooks
    WHERE active = 1 AND event = ?
    ORDER BY id DESC
  `;

  const rows = await dbAll(db, sql, [event]);
  return rows;
}