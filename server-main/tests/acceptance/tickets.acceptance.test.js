import request from 'supertest';
import { initTestDb, createTestApp } from '../setup.js';

let app;

beforeAll(async () => {
  await initTestDb();
  app = createTestApp();
});

const ticketBase = {
  ciName: 'Server-01',
  ciCat: 'Hardware',
  ciSubcat: 'CPU',
  status: 'Open',
  impact: 'High',
  urgency: 'High',
  priority: 'Critical',
  openTime: '2024-01-01T10:00:00Z',
};

// =============================================================================
// POST /api/tickets
// =============================================================================
describe('POST /api/tickets', () => {

  test('cria um ticket e devolve 201', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send(ticketBase);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.ciName).toBe('Server-01');
  });

  test('devolve 400 se o body for inválido', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send(null);

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/tickets
// =============================================================================
describe('GET /api/tickets', () => {

  test('devolve 200 e uma lista de tickets', async () => {
    const res = await request(app).get('/api/tickets');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(Array.isArray(res.body.tickets)).toBe(true);
  });

  test('devolve paginação (total, limit, offset)', async () => {
    const res = await request(app).get('/api/tickets');

    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('limit');
    expect(res.body).toHaveProperty('offset');
  });

  test('filtra por status', async () => {
    const res = await request(app).get('/api/tickets?status=Open');

    expect(res.status).toBe(200);
    res.body.tickets.forEach(t => {
      expect(t.status).toBe('Open');
    });
  });
});

// =============================================================================
// GET /api/tickets/:id
// =============================================================================
describe('GET /api/tickets/:id', () => {

  test('devolve 200 e o ticket correto', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send(ticketBase);

    const res = await request(app).get(`/api/tickets/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  test('devolve 404 se o ticket não existir', async () => {
    const res = await request(app).get('/api/tickets/99999');

    expect(res.status).toBe(404);
  });

  test('devolve 400 se o id for inválido', async () => {
    const res = await request(app).get('/api/tickets/abc');

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// PUT /api/tickets/:id
// =============================================================================
describe('PUT /api/tickets/:id', () => {

  test('atualiza o ticket e devolve 200', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send(ticketBase);

    const res = await request(app)
      .put(`/api/tickets/${created.body.id}`)
      .send({ status: 'Closed' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('Closed');
  });

  test('devolve 404 se o ticket não existir', async () => {
    const res = await request(app)
      .put('/api/tickets/99999')
      .send({ status: 'Closed' });

    expect(res.status).toBe(404);
  });
});

// =============================================================================
// DELETE /api/tickets/:id
// =============================================================================
describe('DELETE /api/tickets/:id', () => {

  test('arquiva o ticket e devolve 200', async () => {
    const created = await request(app)
      .post('/api/tickets')
      .send(ticketBase);

    const res = await request(app)
      .delete(`/api/tickets/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.ticket.archived).toBe(1);
  });

  test('devolve 404 se o ticket não existir', async () => {
    const res = await request(app).delete('/api/tickets/99999');

    expect(res.status).toBe(404);
  });
});
