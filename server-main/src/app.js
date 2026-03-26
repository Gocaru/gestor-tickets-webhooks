import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

import healthRoutes from './routes/healthRoutes.js';
import ticketsRoutes from './routes/ticketsRoutes.js';
import webhooksRoutes from './routes/webhooksRoutes.js';
import authRoutes from './routes/authRoutes.js';

import { initDb } from './db/initDb.js';
import { getDb } from './db/database.js';
import { importTicketsFromCsv } from './services/csvImportService.js';

const app = express();
const PORT = process.env.PORT;
if (!PORT) {
  throw new Error('PORT is required');
}

app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// CORS (Swagger Editor / Petstore)
app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['https://editor.swagger.io', 'https://petstore.swagger.io'];
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1') || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  credentials: true,
}));

// Se quiser garantir preflight sempre OK:
// app.options('*', cors());

app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/webhooks', webhooksRoutes);

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// server-main/data/tickets.csv
const csvPath = path.join(dirname, '../data/tickets.csv');

async function countTickets() {
  const pool = await getDb();
  const result = await pool.request()
    .query('SELECT COUNT(*) AS count FROM tickets');
  return result.recordset[0]?.count || 0;
}

async function startServer() {
  try {
    console.log('[INIT] A iniciar servidor principal...');
    await initDb();
    const count = await countTickets();
    if (count === 0) {
      console.log('[IMPORT] DB vazia — a importar CSV automaticamente...');
      const pool = await getDb();
      const result = await importTicketsFromCsv(pool, csvPath);
      console.log('[IMPORT] Import concluído:', result);
    } else {
      console.log(`[IMPORT] DB já contém ${count} tickets — import ignorado`);
    }
    app.listen(Number(PORT), () => {
      console.log(`[SERVER] Servidor principal a correr em http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[ERROR] Falha ao iniciar o servidor principal:', err);
    process.exit(1);
  }
}

startServer();