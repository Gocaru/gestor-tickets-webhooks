// src/app.export.js
// Versão do app SEM startServer() — para testes de aceitação com Supertest

import cors from 'cors';
import express from 'express';
import 'dotenv/config';

import healthRoutes from './routes/healthRoutes.js';
import ticketsRoutes from './routes/ticketsRoutes.js';
import webhooksRoutes from './routes/webhooksRoutes.js';

const app = express();

app.use(express.json());

app.use(cors({
  origin: ['https://editor.swagger.io', 'https://petstore.swagger.io'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));

app.use('/health', healthRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/webhooks', webhooksRoutes);

export default app;