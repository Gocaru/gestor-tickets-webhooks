import request from 'supertest';

const BASE_URL = 'http://localhost:3000';

describe('GET /api/tickets', () => {
  test('deve retornar status 200', async () => {
    const response = await request(BASE_URL).get('/api/tickets');
    expect(response.status).toBe(200);
  });

  test('deve retornar uma lista de tickets', async () => {
    const response = await request(BASE_URL).get('/api/tickets');
    expect(response.body).toHaveProperty('tickets');
    expect(Array.isArray(response.body.tickets)).toBe(true);
  });

  test('deve retornar o total de tickets', async () => {
    const response = await request(BASE_URL).get('/api/tickets');
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBeGreaterThan(0);
  });

  test('deve respeitar a paginação por defeito (limit 20)', async () => {
    const response = await request(BASE_URL).get('/api/tickets');
    expect(response.body.limit).toBe(20);
    expect(response.body.tickets.length).toBeLessThanOrEqual(20);
  });
});

describe('GET /api/tickets/:id', () => {
  test('deve retornar 200 para ticket existente', async () => {
    const response = await request(BASE_URL).get('/api/tickets/1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', 1);
  });

  test('deve retornar 404 para ticket inexistente', async () => {
    const response = await request(BASE_URL).get('/api/tickets/99999');
    expect(response.status).toBe(404);
  });

  test('deve retornar 400 para id inválido', async () => {
    const response = await request(BASE_URL).get('/api/tickets/abc');
    expect(response.status).toBe(400);
  });
});

describe('POST /api/tickets', () => {
  test('deve criar um ticket e retornar 201', async () => {
    const novoTicket = {
      ciName: 'Teste de Aceitação',
      ciCat: 'Software',
      ciSubcat: 'Web',
      status: 'Open',
      impact: '3',
      urgency: '3',
      priority: '3'
    };
    const response = await request(BASE_URL)
      .post('/api/tickets')
      .send(novoTicket);
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.ciName).toBe('Teste de Aceitação');
  });
});

describe('GET /health', () => {
  test('deve retornar 200', async () => {
    const response = await request(BASE_URL).get('/health');
    expect(response.status).toBe(200);
  });
});
