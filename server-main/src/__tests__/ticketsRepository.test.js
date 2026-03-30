import { jest } from '@jest/globals';

// Mocks da camada de base de dados
const mockDbRun = jest.fn();
const mockDbGet = jest.fn();
const mockDbAll = jest.fn();

jest.unstable_mockModule('../db/sqliteAsync.js', () => ({
  dbRun: mockDbRun,
  dbGet: mockDbGet,
  dbAll: mockDbAll,
}));

jest.unstable_mockModule('../db/database.js', () => ({
  db: {},
}));

const {
  createTicket,
  getTicketById,
  updateTicket,
  archiveTicket,
  listTickets,
  countTickets,
} = await import('../repositories/ticketsRepository.js');

// ─── createTicket ──────────────────────────────────────────────────
describe('createTicket', () => {
  test('deve retornar o id do ticket criado', async () => {
    mockDbRun.mockResolvedValue({ lastID: 42, changes: 1 });

    const id = await createTicket({ ciName: 'Switch', status: 'Open' });

    expect(id).toBe(42);
    expect(mockDbRun).toHaveBeenCalledTimes(1);
  });
});

// ─── getTicketById ────────────────────────────────────────────────
describe('getTicketById', () => {
  test('deve retornar o ticket se existir', async () => {
    const ticket = { id: 1, ciName: 'Switch', status: 'Open' };
    mockDbGet.mockResolvedValue(ticket);

    const result = await getTicketById(1);

    expect(result).toEqual(ticket);
    expect(mockDbGet).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('WHERE id = ?'),
      [1]
    );
  });

  test('deve retornar null se não existir', async () => {
    mockDbGet.mockResolvedValue(undefined);

    const result = await getTicketById(999);

    expect(result).toBeNull();
  });
});

// ─── updateTicket ─────────────────────────────────────────────────
describe('updateTicket', () => {
  test('deve retornar o número de alterações', async () => {
    mockDbRun.mockResolvedValue({ changes: 1 });

    const changes = await updateTicket(1, {
      ciName: 'Router', ciCat: 'Net', ciSubcat: 'LAN',
      status: 'Closed', impact: '2', urgency: '2', priority: '2',
      openTime: '2024-01-01', resolvedTime: null, closeTime: null,
    });

    expect(changes).toBe(1);
  });

  test('deve retornar 0 se ticket não existir', async () => {
    mockDbRun.mockResolvedValue({ changes: 0 });

    const changes = await updateTicket(999, {
      ciName: null, ciCat: null, ciSubcat: null,
      status: 'Open', impact: null, urgency: null, priority: null,
      openTime: null, resolvedTime: null, closeTime: null,
    });

    expect(changes).toBe(0);
  });
});

// ─── archiveTicket ────────────────────────────────────────────────
describe('archiveTicket', () => {
  test('deve arquivar e retornar 1 change', async () => {
    mockDbRun.mockResolvedValue({ changes: 1 });

    const changes = await archiveTicket(1);

    expect(changes).toBe(1);
    expect(mockDbRun).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('archived = 1'),
      [1]
    );
  });
});

// ─── listTickets ──────────────────────────────────────────────────
describe('listTickets', () => {
  test('deve retornar array de tickets', async () => {
    const tickets = [{ id: 1 }, { id: 2 }];
    mockDbAll.mockResolvedValue(tickets);

    const result = await listTickets('WHERE archived = 0', [0], 20, 0);

    expect(result).toHaveLength(2);
    expect(mockDbAll).toHaveBeenCalledTimes(1);
  });
});

// ─── countTickets ─────────────────────────────────────────────────
describe('countTickets', () => {
  test('deve retornar o total de tickets', async () => {
    mockDbGet.mockResolvedValue({ total: 15 });

    const total = await countTickets('WHERE archived = 0', [0]);

    expect(total).toBe(15);
  });

  test('deve retornar 0 se a query não devolver resultado', async () => {
    mockDbGet.mockResolvedValue(null);

    const total = await countTickets('WHERE archived = 0', [0]);

    expect(total).toBe(0);
  });
});