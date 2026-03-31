import { jest } from '@jest/globals';

// 1. Mocks das dependências de base de dados
const mockDbRun = jest.fn();
const mockDbGet = jest.fn();
const mockDbAll = jest.fn();
const mockDb = {};

jest.unstable_mockModule('../db/sqliteAsync.js', () => ({
  dbRun: mockDbRun,
  dbGet: mockDbGet,
  dbAll: mockDbAll,
}));

jest.unstable_mockModule('../db/database.js', () => ({
  db: mockDb,
}));

// 2. Import dinâmico após mocks
const {
  createTicket,
  getTicketById,
  updateTicket,
  archiveTicket,
  listTickets,
  countTickets,
} = await import('../repositories/ticketsRepository.js');

// 3. Reset dos mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

// --- createTicket ---
describe('createTicket', () => {
  test('deve retornar o lastID do ticket criado', async () => {
    mockDbRun.mockResolvedValue({ lastID: 42, changes: 1 });
    const result = await createTicket({ ciName: 'Servidor' });
    expect(result).toBe(42);
  });
});

// --- getTicketById ---
describe('getTicketById', () => {
  test('deve retornar o ticket quando existe', async () => {
    const ticket = { id: 1, ciName: 'Servidor', status: 'Open' };
    mockDbGet.mockResolvedValue(ticket);
    const result = await getTicketById(1);
    expect(result).toEqual(ticket);
  });

  test('deve retornar null quando não existe', async () => {
    mockDbGet.mockResolvedValue(undefined);
    const result = await getTicketById(999);
    expect(result).toBeNull();
  });
});

// --- updateTicket ---
describe('updateTicket', () => {
  test('deve retornar o número de alterações', async () => {
    mockDbRun.mockResolvedValue({ changes: 1 });
    const result = await updateTicket(1, { ciName: 'Novo', status: 'Open' });
    expect(result).toBe(1);
  });
});

// --- archiveTicket ---
describe('archiveTicket', () => {
  test('deve arquivar o ticket e retornar changes', async () => {
    mockDbRun.mockResolvedValue({ changes: 1 });
    const result = await archiveTicket(1);
    expect(result).toBe(1);
  });

  test('a query deve incluir archived = 1', async () => {
    mockDbRun.mockResolvedValue({ changes: 1 });
    await archiveTicket(1);
    const sqlUsado = mockDbRun.mock.calls[0][1];
    expect(sqlUsado).toMatch(/archived\s*=\s*1/);
  });
});

// --- listTickets ---
describe('listTickets', () => {
  test('deve retornar array de tickets', async () => {
    const tickets = [{ id: 1 }, { id: 2 }];
    mockDbAll.mockResolvedValue(tickets);
    const result = await listTickets('WHERE archived = 0', [0], 20, 0);
    expect(result).toEqual(tickets);
  });
});

// --- countTickets ---
describe('countTickets', () => {
  test('deve retornar o total de tickets', async () => {
    mockDbGet.mockResolvedValue({ total: 5 });
    const result = await countTickets('WHERE archived = 0', [0]);
    expect(result).toBe(5);
  });

  test('deve retornar 0 se row vier null', async () => {
    mockDbGet.mockResolvedValue(null);
    const result = await countTickets('WHERE archived = 0', [0]);
    expect(result).toBe(0);
  });
});
