import { db } from '../db/database.js';

export function getStatsByStatus() {
  const sql = `
    SELECT status, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0 -- exclui tickets arquivados
    GROUP BY status
    ORDER BY total DESC
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function getStatsByPriority() {
  const sql = `
    SELECT priority, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0
    GROUP BY priority
    ORDER BY total DESC
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function getStatsByCiCat() {
  const sql = `
    SELECT ciCat, COUNT(*) AS total
    FROM tickets
    WHERE COALESCE(archived, 0) = 0
    GROUP BY ciCat
    ORDER BY total DESC
  `;

  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}
