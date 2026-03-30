import { jest } from '@jest/globals';

// Mocks do repositório
const mockCreateTicket  = jest.fn();
const mockGetTicketById = jest.fn();
const mockUpdateTicket  = jest.fn();
const mockArchiveTicket = jest.fn();
const mockListTickets   = jest.fn();
const mockCountTickets  = jest.fn();

jest.unstable_mockModule('../repositories/ticketsRepository.js', () => ({
  createTicket:  mockCreateTicket,
  getTicketById: mockGetTicketById,
  updateTicket:  mockUpdateTicket,
  archiveTicket: mockArchiveTicket,
  listTickets:   mockListTickets,
  countTickets:  mockCountTickets,
}));

const {
  createTicketService,
  getTicketsService,
  getTicketByIdService,
  updateTicketService,
  archiveTicketService,
} = await import('../services/ticketsService.js');

// ─── createTicketService ──────────────────────────────────────────
describe('createTicketService', () => {
  test('deve criar ticket e devolvê-lo por id', async () => {
    const ticket = { id: 5, ciName: 'Router', status: 'Open' };
    mockCreateTicket.mockResolvedValue(5);
    mockGetTicketById.mockResolvedValue(ticket);

    const result = await createTicketService({ ciName: 'Router' });

    expect(mockCreateTicket).toHaveBeenCalledWith({ ciName: 'Router' });
    expect(mockGetTicketById).toHaveBeenCalledWith(5);
    expect(result).toEqual(ticket);
  });
});

// ─── getTicketsService ────────────────────────────────────────────
describe('getTicketsService', () => {
  test('deve usar valores por defeito (limit=20, offset=0, archived=0)', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);

    await getTicketsService({});

    expect(mockCountTickets).toHaveBeenCalledWith(
      expect.stringContaining('WHERE'),
      expect.arrayContaining([0])
    );
  });

  test('deve aplicar filtro de status', async () => {
    mockCountTickets.mockResolvedValue(1);
    mockListTickets.mockResolvedValue([{ id: 1, status: 'Open' }]);

    const result = await getTicketsService({ status: 'Open' });

    expect(result.tickets).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  test('deve respeitar limit e offset personalizados', async () => {
    mockCountTickets.mockResolvedValue(50);
    mockListTickets.mockResolvedValue([]);

    await getTicketsService({ limit: '10', offset: '20' });

    expect(mockListTickets).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      10,
      20
    );
  });

  test('deve devolver archived=1 quando pedido', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);

    await getTicketsService({ archived: '1' });

    expect(mockCountTickets).toHaveBeenCalledWith(
      expect.any(String),
      expect.arrayContaining([1])
    );
  });
});

// ─── getTicketByIdService ─────────────────────────────────────────
describe('getTicketByIdService', () => {
  test('deve devolver o ticket pelo id', async () => {
    const ticket = { id: 3, status: 'Closed' };
    mockGetTicketById.mockResolvedValue(ticket);

    const result = await getTicketByIdService(3);

    expect(result).toEqual(ticket);
    expect(mockGetTicketById).toHaveBeenCalledWith(3);
  });

  test('deve devolver null se ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await getTicketByIdService(999);

    expect(result).toBeNull();
  });
});

// ─── updateTicketService ──────────────────────────────────────────
describe('updateTicketService', () => {
  test('deve devolver null se ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await updateTicketService(999, { status: 'Closed' });

    expect(result).toBeNull();
  });

  test('deve devolver before, after e changes após atualização', async () => {
    const before = { id: 1, status: 'Open',   ciName: 'Router' };
    const after  = { id: 1, status: 'Closed', ciName: 'Router' };

    // 1ª chamada: existing | 2ª chamada: after
    mockGetTicketById
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(after);

    mockUpdateTicket.mockResolvedValue(1);

    const result = await updateTicketService(1, { status: 'Closed' });

    expect(result.before).toEqual(before);
    expect(result.after).toEqual(after);
    expect(result.changes).toHaveProperty('status');
    expect(result.changes.status).toEqual({ from: 'Open', to: 'Closed' });
  });

  test('deve devolver null se updateTicket não alterar nada', async () => {
    mockGetTicketById.mockResolvedValue({ id: 1, status: 'Open' });
    mockUpdateTicket.mockResolvedValue(0); // 0 changes

    const result = await updateTicketService(1, { status: 'Open' });

    expect(result).toBeNull();
  });
});

// ─── archiveTicketService ─────────────────────────────────────────
describe('archiveTicketService', () => {
  test('deve arquivar e devolver o ticket atualizado', async () => {
    const before   = { id: 1, archived: 0 };
    const archived = { id: 1, archived: 1 };

    mockGetTicketById
      .mockResolvedValueOnce(before)
      .mockResolvedValueOnce(archived);

    mockArchiveTicket.mockResolvedValue(1);

    const result = await archiveTicketService(1);

    expect(result.archived).toBe(1);
  });

  test('deve devolver null se ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await archiveTicketService(999);

    expect(result).toBeNull();
  });
});