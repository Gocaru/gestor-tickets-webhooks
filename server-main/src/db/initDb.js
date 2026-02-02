import { db } from './database.js';

export function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      ciName TEXT,
      ciCat TEXT,
      ciSubcat TEXT,

      status TEXT,
      impact TEXT,
      urgency TEXT,
      priority TEXT,

      openTime TEXT,
      resolvedTime TEXT,
      closeTime TEXT,

      archived INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      event TEXT NOT NULL,
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_webhooks_url_event
      ON webhooks(url, event);
  `;

  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('Erro a criar tabelas:', err.message);
        return reject(err);
      }
      console.log('Tabelas tickets + webhooks prontas.');
      resolve();
    });
  });
}