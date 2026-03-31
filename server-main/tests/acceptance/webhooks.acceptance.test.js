import request from 'supertest';
import { initTestDb, createTestApp } from '../setup.js';

let app;

beforeAll(async () => {
  await initTestDb();
  app = createTestApp();
});

// =============================================================================
// POST /api/webhooks
// =============================================================================
describe('POST /api/webhooks', () => {

  test('cria um webhook e devolve 201', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: 'https://example.com/hook', event: 'ticket.created' });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.event).toBe('ticket.created');
  });

  test('devolve 400 se url estiver vazia', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: '', event: 'ticket.created' });

    expect(res.status).toBe(400);
  });

  test('devolve 400 se event for inválido', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: 'https://example.com/hook', event: 'evento.invalido' });

    expect(res.status).toBe(400);
  });

  test('devolve 400 se url não for válida', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({ url: 'nao-e-url', event: 'ticket.created' });

    expect(res.status).toBe(400);
  });

  test('devolve 400 se body estiver vazio', async () => {
    const res = await request(app)
      .post('/api/webhooks')
      .send({});

    expect(res.status).toBe(400);
  });
});

// =============================================================================
// GET /api/webhooks
// =============================================================================
describe('GET /api/webhooks', () => {

  test('devolve 200 e uma lista', async () => {
    const res = await request(app).get('/api/webhooks');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('lista inclui o webhook criado', async () => {
    await request(app)
      .post('/api/webhooks')
      .send({ url: 'https://lista.com/hook', event: 'ticket.updated' });

    const res = await request(app).get('/api/webhooks');

    const found = res.body.find(h => h.url === 'https://lista.com/hook');
    expect(found).toBeDefined();
    expect(found.event).toBe('ticket.updated');
  });
});
