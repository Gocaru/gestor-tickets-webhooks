import { db } from './database.js';

export function initDb() {
  const sql = `
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,

      incidentId TEXT UNIQUE,

      ciName TEXT,
      ciCat TEXT,
      ciSubcat TEXT,
      category TEXT,
      wbs TEXT,

      status TEXT,
      impact TEXT,
      urgency TEXT,
      priority TEXT,

      numberCnt INTEGER,
      kbNumber TEXT,
      alertStatus TEXT,
      noOfReassignments INTEGER,

      openTime TEXT,
      reopenTime TEXT,
      resolvedTime TEXT,
      closeTime TEXT,

      handleTimeHrs REAL,

      closureCode TEXT,

      noOfRelatedInteractions INTEGER,
      relatedInteraction TEXT,
      noOfRelatedIncidents INTEGER,
      noOfRelatedChanges INTEGER,
      relatedChange TEXT
    )
  `;

  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Erro a criar tabela tickets:', err.message);
        return reject(err);
      }
      console.log('Tabela tickets pronta (schema completo).');
      resolve();
    });
  });
}
