import cors from "cors";
import express from 'express';
import 'dotenv/config';

import path from 'path';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/healthRoutes.js';
import ticketsRoutes from './routes/ticketsRoutes.js';

import { initDb } from './db/initDb.js';
import { getDb } from './db/database.js';
import { importTicketsFromCsv } from './services/csvImportService.js';
import webhooksRoutes from './routes/webhooksRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: [
    "https://editor.swagger.io",
    "https://petstore.swagger.io"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Accept"]
}));


app.use('/health', healthRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/webhooks', webhooksRoutes);

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// ✅ server-main/data/tickets.csv
const csvPath = path.join(dirname, '../data/tickets.csv');

function countTickets(db) {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) AS count FROM tickets', (err, row) => {
      if (err) return reject(err);
      resolve(row?.count ?? 0);
    });
  });
}

async function startServer() {
  try {
    await initDb();

    const db = getDb();

    const count = await countTickets(db);

    if (count === 0) {
      console.log('DB vazia — a importar CSV automaticamente...');
      const result = await importTicketsFromCsv(db, csvPath);
      console.log('Import concluído:', result);
    } else {
      console.log(`DB já contém ${count} tickets — import ignorado`);
    }

    app.listen(PORT, () => {
      console.log(`Servidor principal a correr na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
}

startServer();

