// src/repositories/ticketsStatsRepository.js

import { db as defaultDb } from '../db/database.js';
import { dbAll } from '../db/sqliteAsync.js';

/**
 * Estatísticas por status (exclui tickets arquivados).
 */
export async function getStatsByStatus() {
  const sql = `
    SELECT status, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0
    GROUP BY status
    ORDER BY total DESC
  `;

  const rows = await dbAll(defaultDb, sql, []);
  return rows;
}

/**
 * Estatísticas por prioridade (exclui tickets arquivados).
 */
export async function getStatsByPriority() {
  const sql = `
    SELECT priority, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0
    GROUP BY priority
    ORDER BY total DESC
  `;

  const rows = await dbAll(defaultDb, sql, []);
  return rows;
}

/**
 * Estatísticas por categoria CI (exclui tickets arquivados).
 */
export async function getStatsByCiCat() {
  const sql = `
    SELECT ciCat, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0
    GROUP BY ciCat
    ORDER BY total DESC
  `;

  const rows = await dbAll(defaultDb, sql, []);
  return rows;
}
