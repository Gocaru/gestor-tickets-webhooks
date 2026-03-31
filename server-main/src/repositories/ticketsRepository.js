// src/repositories/ticketsRepository.js

import { getActiveDb } from '../db/dbContext.js';
import { dbRun, dbGet, dbAll } from '../db/sqliteAsync.js';

export async function insertTicket(dbOrTicket, maybeTicket) {
  const usingDb = maybeTicket ? dbOrTicket : getActiveDb();
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
    ticket.ciName, ticket.ciCat, ticket.ciSubcat,
    ticket.status, ticket.impact, ticket.urgency, ticket.priority,
    ticket.openTime, ticket.resolvedTime, ticket.closeTime
  ];

  const result = await dbRun(usingDb, sql, params);
  return result.changes;
}

export async function createTicket(ticket, db = getActiveDb()) {
  const sql = `
    INSERT INTO tickets (
      ciName, ciCat, ciSubcat,
      status, impact, urgency, priority,
      openTime, resolvedTime, closeTime, archived
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `;

  const params = [
    ticket.ciName || null, ticket.ciCat || null, ticket.ciSubcat || null,
    ticket.status || 'Open', ticket.impact || null, ticket.urgency || null,
    ticket.priority || null, ticket.openTime || new Date().toISOString(),
    ticket.resolvedTime || null, ticket.closeTime || null
  ];

  const result = await dbRun(db, sql, params);
  return result.lastID;
}

export async function getTicketById(id, db = getActiveDb()) {
  const sql = 'SELECT * FROM tickets WHERE id = ?';
  const row = await dbGet(db, sql, [id]);
  if (!row) return null;
  return row;
}

export async function updateTicket(id, updated, db = getActiveDb()) {
  const sql = `
    UPDATE tickets
    SET ciName = ?, ciCat = ?, ciSubcat = ?,
        status = ?, impact = ?, urgency = ?, priority = ?,
        openTime = ?, resolvedTime = ?, closeTime = ?
    WHERE id = ?
  `;

  const params = [
    updated.ciName, updated.ciCat, updated.ciSubcat,
    updated.status, updated.impact, updated.urgency, updated.priority,
    updated.openTime, updated.resolvedTime, updated.closeTime, id
  ];

  const result = await dbRun(db, sql, params);
  return result.changes;
}

export async function archiveTicket(id, db = getActiveDb()) {
  const sql = 'UPDATE tickets SET archived = 1 WHERE id = ?';
  const result = await dbRun(db, sql, [id]);
  return result.changes;
}

export async function listTickets(whereSql, params, limit, offset, db = getActiveDb()) {
  const sql = `
    SELECT * FROM tickets
    ${whereSql}
    ORDER BY id DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await dbAll(db, sql, [...params, limit, offset]);
  return rows;
}

export async function countTickets(whereSql, params, db = getActiveDb()) {
  const sql = `
    SELECT COUNT(*) AS total
    FROM tickets
    ${whereSql}
  `;

  const row = await dbGet(db, sql, params);
  if (!row || row.total === undefined || row.total === null) return 0;
  return row.total;
}
