import { db } from '../db/database.js';

export function insertTicket(ticket) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO tickets (
        incidentId,
        ciName, ciCat, ciSubcat, category, wbs,
        status, impact, urgency, priority,
        numberCnt, kbNumber, alertStatus,
        noOfReassignments,
        noOfRelatedInteractions, relatedInteraction,
        noOfRelatedIncidents,
        noOfRelatedChanges, relatedChange,
        openTime, reopenTime, resolvedTime, closeTime,
        handleTimeHrs,
        closureCode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      ticket.incidentId,
      ticket.ciName, ticket.ciCat, ticket.ciSubcat, ticket.category, ticket.wbs,
      ticket.status, ticket.impact, ticket.urgency, ticket.priority,
      ticket.numberCnt, ticket.kbNumber, ticket.alertStatus,
      ticket.noOfReassignments,
      ticket.noOfRelatedInteractions, ticket.relatedInteraction,
      ticket.noOfRelatedIncidents,
      ticket.noOfRelatedChanges, ticket.relatedChange,
      ticket.openTime, ticket.reopenTime, ticket.resolvedTime, ticket.closeTime,
      ticket.handleTimeHrs,
      ticket.closureCode
    ];

    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this.changes); // 1 se inseriu, 0 se ignorou (duplicado)
    });
  });
}
