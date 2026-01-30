import { db } from '../db/database.js';

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