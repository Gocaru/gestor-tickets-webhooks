// src/repositories/webhooksRepository.js

import { getDb } from '../db/database.js';
import { dbAll } from '../db/sqliteAsync.js';

/**
 * Criar webhook (registo).
 * Usa MERGE para evitar duplicados (url + event).
 * Retorna o ID criado ou 0 se já existia.
 */
export async function createWebhook({ url, event }) {
  const pool = await getDb();

  // Verifica se já existe
  const existing = await pool.request()
    .input('url', url)
    .input('event', event)
    .query('SELECT id FROM webhooks WHERE url = @url AND event = @event');

  if (existing.recordset.length > 0) return 0;

  // Cria o webhook
  const result = await pool.request()
    .input('url', url)
    .input('event', event)
    .query(`
      INSERT INTO webhooks (url, event, active)
      OUTPUT INSERTED.id
      VALUES (@url, @event, 1)
    `);

  return result.recordset[0]?.id || 0;
}

/**
 * Listar webhooks (todos).
 */
export async function listWebhooks() {
  return await dbAll(null, `
    SELECT id, url, event, active, createdAt
    FROM webhooks
    ORDER BY id DESC
  `, []);
}

/**
 * Listar webhooks ativos por evento.
 */
export async function listActiveWebhooksByEvent(event) {
  return await dbAll(null, `
    SELECT id, url, event
    FROM webhooks
    WHERE active = 1 AND event = @p0
    ORDER BY id DESC
  `, [event]);
}