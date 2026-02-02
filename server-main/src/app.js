import express from 'express';
import 'dotenv/config';

import healthRoutes from './routes/healthRoutes.js';
import ticketsRoutes from './routes/ticketsRoutes.js';
import { initDb } from './db/initDb.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/health', healthRoutes);
app.use('/api/tickets', ticketsRoutes);

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Servidor principal a correr na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar o servidor:', err);
    process.exit(1);
  }
}

startServer();
