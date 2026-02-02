import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from '../db/initDb.js';
import { getDb } from '../db/database.js';
import { importTicketsFromCsv } from '../services/csvImportService.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const csvPath = path.join(dirname, '../../data/tickets.csv');

function countTickets(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM tickets', (err, row) => {
      if (err) return reject(err);
      resolve(row?.count ?? 0);
    });
  });
}

async function run() {
  try {
    await initDb();

    const db = getDb();

    const count = await countTickets(db);
    if (count > 0) {
      console.log(`Import ignorado: a tabela já tem ${count} tickets.`);
      process.exit(0);
    }

    const result = await importTicketsFromCsv(db, csvPath);
    console.log('Import concluído:', result);

    process.exit(0);
  } catch (err) {
    console.error('Erro no import:', err.message);
    process.exit(1);
  }
}

run();
