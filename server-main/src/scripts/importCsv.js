import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from '../db/initDb.js';
import { importTicketsFromCsv } from '../services/csvImportService.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const csvPath = path.join(dirname, '../../data/tickets.csv');

async function run() {
  try {
    await initDb();
    const result = await importTicketsFromCsv(csvPath);
    console.log('Import concluído:', result);
    process.exit(0);
  } catch (err) {
    console.error('Erro no import:', err.message);
    process.exit(1);
  }
}

run();