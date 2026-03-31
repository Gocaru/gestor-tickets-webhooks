// src/repositories/webhooksRepository.js

import { db as defaultDb } from '../db/database.js';
import { dbRun, dbAll } from '../db/sqliteAsync.js';

/**
 * Criar webhook (registo).
 * Usa INSERT OR IGNORE para evitar duplicados (url + event).
 * Retorna:
 * - lastID (quando inseriu)
 * - 0 (quando foi ignorado por duplicado)
 */
export async function createWebhook({ url, event }) {
  const sql = `
    INSERT OR IGNORE INTO webhooks (url, event, active)
    VALUES (?, ?, 1)
  `;

  const result = await dbRun(defaultDb, sql, [url, event]);

  // Quando é ignorado por duplicado, lastID pode não ser útil.
  // Mantemos a regra: devolver 0 nesses casos.
  if (!result || result.changes === 0) return 0;

  return result.lastID || 0;
}

/**
 * Listar webhooks (todos).
 */
export async function listWebhooks() {
  const sql = `
    SELECT id, url, event, active, createdAt
    FROM webhooks
    ORDER BY id DESC
  `;

  const rows = await dbAll(defaultDb, sql, []);
  return rows;
}

/**
 * Listar webhooks ativos por evento (para disparar eventos).
 */
export async function listActiveWebhooksByEvent(event) {
  const sql = `
    SELECT id, url, event
    FROM webhooks
    WHERE active = 1 AND event = ?
    ORDER BY id DESC
  `;

  const rows = await dbAll(defaultDb, sql, [event]);
  return rows;
}
