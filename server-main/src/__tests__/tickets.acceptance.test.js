// src/__tests__/tickets.acceptance.test.js
//
// Testes de aceitação — testam os endpoints HTTP reais da app
// usando uma base de dados SQLite em memória (temporária)

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import sqlite3 from 'sqlite3';

// ─── Base de dados em memória ──────────────────────────────────────────────────
const db = new sqlite3.Database(':memory:');

await new Promise((resolve, reject) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ciName TEXT,
      ciCat TEXT,
      ciSubcat TEXT,
      status TEXT DEFAULT 'Open',
      impact TEXT,
      urgency TEXT,
      priority TEXT,
      openTime TEXT,
      resolvedTime TEXT,
      closeTime TEXT,
      archived INTEGER DEFAULT 0
    )
  `, (err) => err ? reject(err) : resolve());
});

// ─── Mock da base de dados ─────────────────────────────────────────────────────
jest.unstable_mockModule('../db/database.js', () => ({
  db: db,
  getDb: () => db,
}));

// ─── Imports dinâmicos (depois dos mocks) ─────────────────────────────────────
const ticketsRoutes = (await import('../routes/ticketsRoutes.js')).default;
const healthRoutes  = (await import('../routes/healthRoutes.js')).default;

// ─── App de teste ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/health', healthRoutes);
app.use('/api/tickets', ticketsRoutes);

// ─── Testes ───────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  test('devolve 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/tickets', () => {
  test('devolve 200 com lista de tickets', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  test('devolve estrutura de paginação correta', async () => {
    const res = await request(app).get('/api/tickets');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('offset');
  });
});

describe('POST /api/tickets', () => {
  test('cria um ticket e devolve 201', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Servidor Web', status: 'Open', priority: '2' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.ciName).toBe('Servidor Web');
  });

  test('devolve 400 para body inválido', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send(null);

    expect(res.status).toBe(400);
  });
});

describe('GET /api/tickets/:id', () => {
  test('devolve 200 para ticket existente', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Teste', status: 'Open' });

    const res = await request(app).get(`/api/tickets/${created.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  test('devolve 404 para ticket inexistente', async () => {
    const res = await request(app).get('/api/tickets/99999');
    expect(res.status).toBe(404);
  });

  test('devolve 400 para id inválido', async () => {
    const res = await request(app).get('/api/tickets/abc');
    expect(res.status).toBe(400);
  });
});