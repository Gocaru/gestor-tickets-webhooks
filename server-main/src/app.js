import cors from 'cors';
import express from 'express';
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/healthRoutes.js';
import ticketsRoutes from './routes/ticketsRoutes.js';
import webhooksRoutes from './routes/webhooksRoutes.js';

import { initDb } from './db/initDb.js';
import { getDb } from './db/database.js';
import { importTicketsFromCsv } from './services/csvImportService.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS (Swagger Editor / Petstore)
app.use(cors({
  origin: [
    'https://editor.swagger.io',
    'https://petstore.swagger.io'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));

// Se quiser garantir preflight sempre OK:
// app.options('*', cors());

app.use('/health', healthRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/webhooks', webhooksRoutes);

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// server-main/data/tickets.csv
const csvPath = path.join(dirname, '../data/tickets.csv');

function countTickets(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM tickets', (err, row) => {
      if (err) return reject(err);
      resolve(row && row.count ? row.count : 0);
    });
  });
}

async function startServer() {
  try {
    console.log('[INIT] A iniciar servidor principal...');

    await initDb();

    const db = getDb();
    const count = await countTickets(db);

    if (count === 0) {
      console.log('[IMPORT] DB vazia — a importar CSV automaticamente...');
      const result = await importTicketsFromCsv(db, csvPath);
      console.log('[IMPORT] Import concluído:', result);
    } else {
      console.log(`[IMPORT] DB já contém ${count} tickets — import ignorado`);
    }

    app.listen(PORT, () => {
      console.log(`[SERVER] Servidor principal a correr em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[ERROR] Falha ao iniciar o servidor principal:', err);
    process.exit(1);
  }
}

startServer();
