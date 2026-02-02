import { db } from '../db/database.js';

// Método para o import CSV
export function insertTicket(ticket) {
  return new Promise((resolve, reject) => {
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

    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

// Métodos para a API

export function createTicket(ticket) {
  return new Promise((resolve, reject) => {
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

    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.lastID);
    });
  });
}

export function getTicketById(id) {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM tickets WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

export function updateTicket(id, updated) {
  return new Promise((resolve, reject) => {
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

    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

export function archiveTicket(id) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE tickets SET archived = 1 WHERE id = ?';
    db.run(sql, [id], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

export function listTickets(whereSql, params, limit, offset) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM tickets
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;

    db.all(sql, [...params, limit, offset], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function countTickets(whereSql, params) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT COUNT(*) AS total
      FROM tickets
      ${whereSql}
    `;

    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row.total);
    });
  });
}
