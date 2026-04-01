// src/__tests__/ticketsService.integration.test.js
import { jest } from '@jest/globals';
import { createTestDb, initTestSchema, clearTickets } from './helpers/dbHelper.js';

// ✅ Criar a DB ANTES do mock — top-level await
// Assim quando o repositório importar "db", já tem valor real
const testDb = await createTestDb();
await initTestSchema(testDb);

jest.unstable_mockModule('../db/database.js', () => ({
  db: testDb,
  getDb: () => testDb,
}));

// Imports dinâmicos após o mock
const { createTicketService, getTicketsService, getTicketByIdService,
        updateTicketService, archiveTicketService } =
  await import('../services/ticketsService.js');

// ─── Setup ───────────────────────────────────────────────────────
afterEach(async () => {
  await clearTickets(testDb);
});

afterAll(() => {
  testDb.close();
});

// ─── createTicketService ──────────────────────────────────────────
describe('[Integração] createTicketService', () => {
  test('deve criar um ticket e devolvê-lo com id atribuído', async () => {
    const ticket = await createTicketService({
      ciName: 'Router', ciCat: 'Network', status: 'Open', priority: '2',
    });
    expect(ticket.id).toBeDefined();
    expect(ticket.id).toBeGreaterThan(0);
    expect(ticket.ciName).toBe('Router');
    expect(ticket.status).toBe('Open');
    expect(ticket.archived).toBe(0);
  });

  test('deve usar "Open" como status por defeito', async () => {
    const ticket = await createTicketService({ ciName: 'Switch' });
    expect(ticket.status).toBe('Open');
  });
});

// ─── getTicketsService ────────────────────────────────────────────
describe('[Integração] getTicketsService', () => {
  test('deve listar tickets com paginação correta', async () => {
    await createTicketService({ ciName: 'Ticket A', status: 'Open' });
    await createTicketService({ ciName: 'Ticket B', status: 'Open' });
    await createTicketService({ ciName: 'Ticket C', status: 'Closed' });

    const result = await getTicketsService({ limit: '10', offset: '0' });
    expect(result.total).toBe(3);
    expect(result.tickets).toHaveLength(3);
  });

  test('deve filtrar por status', async () => {
    await createTicketService({ ciName: 'Ticket A', status: 'Open' });
    await createTicketService({ ciName: 'Ticket B', status: 'Closed' });

    const result = await getTicketsService({ status: 'Open' });
    expect(result.total).toBe(1);
    expect(result.tickets[0].ciName).toBe('Ticket A');
  });

  test('deve filtrar por priority', async () => {
    await createTicketService({ ciName: 'P1', priority: '1', status: 'Open' });
    await createTicketService({ ciName: 'P2', priority: '2', status: 'Open' });

    const result = await getTicketsService({ priority: '1' });
    expect(result.total).toBe(1);
    expect(result.tickets[0].ciName).toBe('P1');
  });

  test('deve respeitar limit e offset', async () => {
    await createTicketService({ ciName: 'T1', status: 'Open' });
    await createTicketService({ ciName: 'T2', status: 'Open' });
    await createTicketService({ ciName: 'T3', status: 'Open' });

    const result = await getTicketsService({ limit: '2', offset: '0' });
    expect(result.tickets).toHaveLength(2);
    expect(result.total).toBe(3);
  });

  test('não deve listar tickets arquivados por defeito', async () => {
    await createTicketService({ ciName: 'Ativo', status: 'Open' });
    const t2 = await createTicketService({ ciName: 'Arquivado', status: 'Open' });
    await archiveTicketService(t2.id);

    const result = await getTicketsService({});
    expect(result.tickets.every(t => t.archived === 0)).toBe(true);
  });
});

// ─── getTicketByIdService ─────────────────────────────────────────
describe('[Integração] getTicketByIdService', () => {
  test('deve devolver o ticket correto pelo id', async () => {
    const criado = await createTicketService({ ciName: 'Servidor', status: 'Open' });
    const result = await getTicketByIdService(criado.id);

    expect(result).not.toBeNull();
    expect(result.id).toBe(criado.id);
    expect(result.ciName).toBe('Servidor');
  });

  test('deve devolver null para id inexistente', async () => {
    const result = await getTicketByIdService(9999);
    expect(result).toBeNull();
  });
});

// ─── updateTicketService ──────────────────────────────────────────
describe('[Integração] updateTicketService', () => {
  test('deve atualizar campos e devolver before/after/changes', async () => {
    const criado = await createTicketService({ ciName: 'PC', status: 'Open' });
    const result = await updateTicketService(criado.id, { status: 'Closed' });

    expect(result).not.toBeNull();
    expect(result.before.status).toBe('Open');
    expect(result.after.status).toBe('Closed');
    expect(result.changes.status).toEqual({ from: 'Open', to: 'Closed' });
  });

  test('deve devolver null para id inexistente', async () => {
    const result = await updateTicketService(9999, { status: 'Closed' });
    expect(result).toBeNull();
  });

  test('changes deve estar vazio se nada foi alterado', async () => {
    const criado = await createTicketService({ ciName: 'PC', status: 'Open' });
    const result = await updateTicketService(criado.id, { status: 'Open' });
    expect(result.changes).toEqual({});
  });
});

// ─── archiveTicketService ─────────────────────────────────────────
describe('[Integração] archiveTicketService', () => {
  test('deve arquivar o ticket (archived = 1)', async () => {
    const criado = await createTicketService({ ciName: 'Impressora', status: 'Open' });
    const result = await archiveTicketService(criado.id);

    expect(result).not.toBeNull();
    expect(result.archived).toBe(1);
  });

  test('deve devolver null para id inexistente', async () => {
    const result = await archiveTicketService(9999);
    expect(result).toBeNull();
  });

  test('ticket arquivado não deve aparecer na listagem normal', async () => {
    const criado = await createTicketService({ ciName: 'Monitor', status: 'Open' });
    await archiveTicketService(criado.id);

    const result = await getTicketsService({});
    const ids = result.tickets.map(t => t.id);
    expect(ids).not.toContain(criado.id);
  });
});