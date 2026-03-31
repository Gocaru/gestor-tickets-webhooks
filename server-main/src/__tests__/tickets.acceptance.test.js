// src/__tests__/tickets.acceptance.test.js
import { jest } from '@jest/globals';
import { createTestDb, initTestSchema, clearTickets } from './helpers/dbHelper.js';

// ✅ Criar DB em memória antes de qualquer mock
const testDb = await createTestDb();
await initTestSchema(testDb);

// Mock do database.js — injetar DB de teste
jest.unstable_mockModule('../db/database.js', () => ({
  db: testDb,
  getDb: () => testDb,
}));

// Mock do initDb — não queremos inicializar a DB real
jest.unstable_mockModule('../db/initDb.js', () => ({
  initDb: jest.fn().mockResolvedValue(),
}));

// Mock do webhookDispatcher — não queremos disparar webhooks reais
jest.unstable_mockModule('../services/webhookDispatcher.js', () => ({
  notifyWebhooks: jest.fn().mockResolvedValue(),
}));

// Import dinâmico do app após os mocks
const { default: app } = await import('../app.export.js');
const { default: request } = await import('supertest');

// ─── Setup ───────────────────────────────────────────────────────
afterEach(async () => {
  await clearTickets(testDb);
});

afterAll(() => {
  testDb.close();
});

// ─── GET /health ──────────────────────────────────────────────────
describe('[Aceitação] GET /health', () => {
  test('deve retornar 200 com status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estado');
    expect(res.body.estado).toBe('online');
  });
});

// ─── POST /api/tickets ────────────────────────────────────────────
describe('[Aceitação] POST /api/tickets', () => {
  test('deve criar um ticket e retornar 201', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Router', status: 'Open', priority: '2' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.ciName).toBe('Router');
    expect(res.body.status).toBe('Open');
  });

  test('deve retornar 400 se o body for inválido', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send(null)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/tickets ─────────────────────────────────────────────
describe('[Aceitação] GET /api/tickets', () => {
  test('deve retornar 200 com lista de tickets', async () => {
    // Criar alguns tickets primeiro
    await request(app).post('/api/tickets').send({ ciName: 'T1', status: 'Open' });
    await request(app).post('/api/tickets').send({ ciName: 'T2', status: 'Closed' });

    const res = await request(app).get('/api/tickets');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBe(2);
  });

  test('deve filtrar por status via query string', async () => {
    await request(app).post('/api/tickets').send({ ciName: 'Aberto',  status: 'Open' });
    await request(app).post('/api/tickets').send({ ciName: 'Fechado', status: 'Closed' });

    const res = await request(app).get('/api/tickets?status=Open');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
    expect(res.body.tickets[0].ciName).toBe('Aberto');
  });

  test('deve respeitar limit e offset', async () => {
    await request(app).post('/api/tickets').send({ ciName: 'T1', status: 'Open' });
    await request(app).post('/api/tickets').send({ ciName: 'T2', status: 'Open' });
    await request(app).post('/api/tickets').send({ ciName: 'T3', status: 'Open' });

    const res = await request(app).get('/api/tickets?limit=2&offset=0');

    expect(res.status).toBe(200);
    expect(res.body.tickets).toHaveLength(2);
    expect(res.body.total).toBe(3);
  });
});

// ─── GET /api/tickets/:id ─────────────────────────────────────────
describe('[Aceitação] GET /api/tickets/:id', () => {
  test('deve retornar 200 com o ticket correto', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Servidor', status: 'Open' });

    const res = await request(app).get(`/api/tickets/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
    expect(res.body.ciName).toBe('Servidor');
  });

  test('deve retornar 404 para id inexistente', async () => {
    const res = await request(app).get('/api/tickets/99999');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Ticket not found');
  });

  test('deve retornar 400 para id inválido', async () => {
    const res = await request(app).get('/api/tickets/abc');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid ticket id');
  });
});

// ─── PUT /api/tickets/:id ─────────────────────────────────────────
describe('[Aceitação] PUT /api/tickets/:id', () => {
  test('deve atualizar o ticket e retornar 200', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'PC', status: 'Open' });

    const res = await request(app)
      .put(`/api/tickets/${created.body.id}`)
      .send({ status: 'Closed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Closed');
  });

  test('deve retornar 404 para id inexistente', async () => {
    const res = await request(app)
      .put('/api/tickets/99999')
      .send({ status: 'Closed' });

    expect(res.status).toBe(404);
  });

  test('deve retornar 400 para id inválido', async () => {
    const res = await request(app)
      .put('/api/tickets/0')
      .send({ status: 'Closed' });

    expect(res.status).toBe(400);
  });
});

// ─── DELETE /api/tickets/:id ──────────────────────────────────────
describe('[Aceitação] DELETE /api/tickets/:id', () => {
  test('deve arquivar o ticket e retornar 200', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Impressora', status: 'Open' });

    const res = await request(app)
      .delete(`/api/tickets/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Ticket archived');
    expect(res.body.ticket.archived).toBe(1);
  });

  test('deve retornar 404 para id inexistente', async () => {
    const res = await request(app).delete('/api/tickets/99999');

    expect(res.status).toBe(404);
  });

  test('ticket arquivado não deve aparecer na listagem', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send({ ciName: 'Monitor', status: 'Open' });

    await request(app).delete(`/api/tickets/${created.body.id}`);

    const lista = await request(app).get('/api/tickets');
    const ids = lista.body.tickets.map(t => t.id);

    expect(ids).not.toContain(created.body.id);
  });
});