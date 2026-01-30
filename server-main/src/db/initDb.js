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
      closeTime TEXT
    )
  `;

  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Erro a criar tabela tickets:', err.message);
        return reject(err);
      }
      console.log('Tabela tickets pronta (schema reduzido).');
      resolve();
    });
  });
}