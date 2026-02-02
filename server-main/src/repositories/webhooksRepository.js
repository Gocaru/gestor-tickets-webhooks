import { db as defaultDb } from '../db/database.js';

export function createWebhook({ url, event }) {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT OR IGNORE INTO webhooks (url, event, active)
      VALUES (?, ?, 1)
    `;
    defaultDb.run(sql, [url, event], function (err) {
      if (err) return reject(err);
      resolve(this.lastID || 0); // 0 se foi ignorado por ser duplicado
    });
  });
}

export function listWebhooks() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, url, event, active, createdAt
      FROM webhooks
      ORDER BY id DESC
    `;
    defaultDb.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function listActiveWebhooksByEvent(event) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, url, event
      FROM webhooks
      WHERE active = 1 AND event = ?
      ORDER BY id DESC
    `;
    defaultDb.all(sql, [event], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}