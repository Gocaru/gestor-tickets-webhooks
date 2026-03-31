import { jest } from '@jest/globals';

// 1. Mocks do Repository
const mockCreateTicket = jest.fn();
const mockGetTicketById = jest.fn();
const mockUpdateTicket = jest.fn();
const mockArchiveTicket = jest.fn();
const mockListTickets = jest.fn();
const mockCountTickets = jest.fn();

jest.unstable_mockModule('../repositories/ticketsRepository.js', () => ({
  createTicket: mockCreateTicket,
  getTicketById: mockGetTicketById,
  updateTicket: mockUpdateTicket,
  archiveTicket: mockArchiveTicket,
  listTickets: mockListTickets,
  countTickets: mockCountTickets,
}));

// 2. Import dinâmico após mocks
const {
  createTicketService,
  getTicketsService,
  getTicketByIdService,
  updateTicketService,
  archiveTicketService,
} = await import('../services/ticketsService.js');

beforeEach(() => {
  jest.clearAllMocks();
});

// --- createTicketService ---
describe('createTicketService', () => {
  test('deve criar ticket e retornar o ticket completo', async () => {
    mockCreateTicket.mockResolvedValue(1);
    mockGetTicketById.mockResolvedValue({ id: 1, ciName: 'Servidor', status: 'Open' });
    const result = await createTicketService({ ciName: 'Servidor' });
    expect(mockCreateTicket).toHaveBeenCalledWith({ ciName: 'Servidor' });
    expect(mockGetTicketById).toHaveBeenCalledWith(1);
    expect(result).toEqual({ id: 1, ciName: 'Servidor', status: 'Open' });
  });
});

// --- getTicketsService ---
describe('getTicketsService', () => {
  test('deve usar limit e offset por defeito', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);
    await getTicketsService({});
    expect(mockListTickets).toHaveBeenCalledWith(
      expect.any(String), expect.any(Array), 20, 0
    );
  });

  test('deve filtrar por status', async () => {
    mockCountTickets.mockResolvedValue(1);
    mockListTickets.mockResolvedValue([{ id: 1, status: 'Open' }]);
    const result = await getTicketsService({ status: 'Open' });
    expect(result.tickets).toEqual([{ id: 1, status: 'Open' }]);
  });

  test('deve listar arquivados quando archived=1', async () => {
    mockCountTickets.mockResolvedValue(1);
    mockListTickets.mockResolvedValue([{ id: 1, archived: 1 }]);
    const result = await getTicketsService({ archived: '1' });
    expect(result.tickets).toEqual([{ id: 1, archived: 1 }]);
  });

  test('deve respeitar limit e offset personalizados', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);
    await getTicketsService({ limit: '5', offset: '10' });
    expect(mockListTickets).toHaveBeenCalledWith(
      expect.any(String), expect.any(Array), 5, 10
    );
  });
});

// --- getTicketByIdService ---
describe('getTicketByIdService', () => {
  test('deve retornar o ticket pelo id', async () => {
    mockGetTicketById.mockResolvedValue({ id: 1, ciName: 'Servidor' });
    const result = await getTicketByIdService(1);
    expect(result).toEqual({ id: 1, ciName: 'Servidor' });
  });
});

// --- updateTicketService ---
describe('updateTicketService', () => {
  test('deve retornar null se ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);
    const result = await updateTicketService(999, {});
    expect(result).toBeNull();
  });

  test('deve detectar campos alterados', async () => {
    const existing = { id: 1, ciName: 'Antigo', status: 'Open' };
    const after = { id: 1, ciName: 'Novo', status: 'Open' };
    mockGetTicketById
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(after);
    mockUpdateTicket.mockResolvedValue(1);
    const result = await updateTicketService(1, { ciName: 'Novo' });
    expect(result.changes).toHaveProperty('ciName');
    expect(result.changes.ciName).toEqual({ from: 'Antigo', to: 'Novo' });
  });
});

// --- archiveTicketService ---
describe('archiveTicketService', () => {
  test('deve retornar null se ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);
    const result = await archiveTicketService(999);
    expect(result).toBeNull();
  });

  test('deve arquivar e retornar ticket com archived=1', async () => {
    mockGetTicketById
      .mockResolvedValueOnce({ id: 1, archived: 0 })
      .mockResolvedValueOnce({ id: 1, archived: 1 });
    mockArchiveTicket.mockResolvedValue(1);
    const result = await archiveTicketService(1);
    expect(result.archived).toBe(1);
  });
});
