// src/repositories/ticketsRepository.js

import { db as defaultDb } from '../db/database.js';
import { dbRun, dbGet, dbAll } from '../db/sqliteAsync.js';

/**
 * Método para o import CSV
 * ✅ Suporta:
 *   insertTicket(ticket) -> usa defaultDb
 *   insertTicket(db, ticket) -> usa db passada (recomendado p/ import)
 *
 * Retorna o número de alterações (changes).
 */
export async function insertTicket(dbOrTicket, maybeTicket) {
  const usingDb = maybeTicket ? dbOrTicket : defaultDb;
  const ticket = maybeTicket ? maybeTicket : dbOrTicket;

  const sql = `
    INSERT OR IGNORE INTO tickets (
      ciName, ciCat, ciSubcat,
      status, impact, urgency, priority,
      openTime, resolvedTime, closeTime
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    ticket.ciName,
    ticket.ciCat,
    ticket.ciSubcat,
    ticket.status,
    ticket.impact,
    ticket.urgency,
    ticket.priority,
    ticket.openTime,
    ticket.resolvedTime,
    ticket.closeTime
  ];

  const result = await dbRun(usingDb, sql, params);
  return result.changes;
}

/**
 * Criar ticket (API)
 * Retorna o ID criado (lastID).
 */
export async function createTicket(ticket) {
  const sql = `
    INSERT INTO tickets (
      ciName, ciCat, ciSubcat,
      status, impact, urgency, priority,
      openTime, resolvedTime, closeTime,
      archived
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    ticket.ciName || null,
    ticket.ciCat || null,
    ticket.ciSubcat || null,
    ticket.status || 'Open',
    ticket.impact || null,
    ticket.urgency || null,
    ticket.priority || null,
    ticket.openTime || new Date().toISOString(),
    ticket.resolvedTime || null,
    ticket.closeTime || null
  ];

  const result = await dbRun(defaultDb, sql, params);
  return result.lastID;
}

/**
 * Obter ticket por ID.
 * Retorna o objeto ou null.
 */
export async function getTicketById(id) {
  const sql = 'SELECT * FROM tickets WHERE id = ?';
  const row = await dbGet(defaultDb, sql, [id]);

  if (!row) return null;
  return row;
}

/**
 * Atualizar ticket.
 * Retorna o número de alterações (changes).
 */
export async function updateTicket(id, updated) {
  const sql = `
    UPDATE tickets
    SET
      ciName = ?,
      ciCat = ?,
      ciSubcat = ?,
      status = ?,
      impact = ?,
      urgency = ?,
      priority = ?,
      openTime = ?,
      resolvedTime = ?,
      closeTime = ?
    WHERE id = ?
  `;

  const params = [
    updated.ciName,
    updated.ciCat,
    updated.ciSubcat,
    updated.status,
    updated.impact,
    updated.urgency,
    updated.priority,
    updated.openTime,
    updated.resolvedTime,
    updated.closeTime,
    id
  ];

  const result = await dbRun(defaultDb, sql, params);
  return result.changes;
}

/**
 * Arquivar ticket (soft delete).
 * Retorna o número de alterações (changes).
 */
export async function archiveTicket(id) {
  const sql = 'UPDATE tickets SET archived = 1 WHERE id = ?';
  const result = await dbRun(defaultDb, sql, [id]);

  return result.changes;
}

/**
 * Listar tickets com filtros + paginação.
 * Retorna array de tickets.
 */
export async function listTickets(whereSql, params, limit, offset) {
  const sql = `
    SELECT *
    FROM tickets
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await dbAll(defaultDb, sql, [...params, limit, offset]);
  return rows;
}

/**
 * Contar tickets (para paginação).
 * Retorna total (número).
 */
export async function countTickets(whereSql, params) {
  const sql = `
    SELECT COUNT(*) AS total
    FROM tickets
    ${whereSql}
  `;

  const row = await dbGet(defaultDb, sql, params);

  // proteção extra: se row vier null/undefined
  if (!row || row.total === undefined || row.total === null) return 0;

  return row.total;
}
