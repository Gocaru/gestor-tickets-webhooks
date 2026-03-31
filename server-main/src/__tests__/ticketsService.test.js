// src/__tests__/ticketsService.test.js

import { jest } from '@jest/globals';

// ─── Mock do repositório (deve ser feito ANTES dos imports que dependem dele) ──
const mockRepo = {
  createTicket: jest.fn(),
  getTicketById: jest.fn(),
  updateTicket: jest.fn(),
  archiveTicket: jest.fn(),
  listTickets: jest.fn(),
  countTickets: jest.fn(),
};

jest.unstable_mockModule('../repositories/ticketsRepository.js', () => mockRepo);

// ─── Imports dinâmicos (depois dos mocks) ─────────────────────────────────────
const {
  createTicketService,
  getTicketByIdService,
  getTicketsService,
  updateTicketService,
  archiveTicketService,
} = await import('../services/ticketsService.js');

const {
  createTicket,
  getTicketById,
  updateTicket,
  archiveTicket,
  listTickets,
  countTickets,
} = mockRepo;

// ─── Ticket de exemplo ─────────────────────────────────────────────────────────
const ticketBase = {
  id: 1,
  ciName: 'Servidor Web',
  ciCat: 'Hardware',
  ciSubcat: 'Servidor',
  status: 'Open',
  impact: '2',
  urgency: '2',
  priority: '2',
  openTime: '2025-01-01T00:00:00.000Z',
  resolvedTime: null,
  closeTime: null,
  archived: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createTicketService ───────────────────────────────────────────────────────
describe('createTicketService', () => {
  test('cria um ticket e devolve o objeto completo', async () => {
    createTicket.mockResolvedValue(1);
    getTicketById.mockResolvedValue(ticketBase);

    const result = await createTicketService({ ciName: 'Servidor Web' });

    expect(createTicket).toHaveBeenCalledTimes(1);
    expect(getTicketById).toHaveBeenCalledWith(1);
    expect(result).toEqual(ticketBase);
  });

  test('propaga erros do repositório', async () => {
    createTicket.mockRejectedValue(new Error('DB error'));

    await expect(createTicketService({ ciName: 'Servidor Web' }))
      .rejects.toThrow('DB error');
  });
});

// ─── getTicketByIdService ──────────────────────────────────────────────────────
describe('getTicketByIdService', () => {
  test('devolve o ticket quando existe', async () => {
    getTicketById.mockResolvedValue(ticketBase);

    const result = await getTicketByIdService(1);

    expect(getTicketById).toHaveBeenCalledWith(1);
    expect(result).toEqual(ticketBase);
  });

  test('devolve null quando o ticket não existe', async () => {
    getTicketById.mockResolvedValue(null);

    const result = await getTicketByIdService(999);

    expect(result).toBeNull();
  });
});

// ─── getTicketsService ─────────────────────────────────────────────────────────
describe('getTicketsService', () => {
  test('devolve lista paginada com defaults (limit=20, offset=0)', async () => {
    countTickets.mockResolvedValue(1);
    listTickets.mockResolvedValue([ticketBase]);

    const result = await getTicketsService({});

    expect(result).toEqual({ total: 1, limit: 20, offset: 0, tickets: [ticketBase] });
  });

  test('respeita limit e offset passados na query', async () => {
    countTickets.mockResolvedValue(50);
    listTickets.mockResolvedValue([ticketBase]);

    const result = await getTicketsService({ limit: '5', offset: '10' });

    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });

  test('filtra por status quando passado', async () => {
    countTickets.mockResolvedValue(0);
    listTickets.mockResolvedValue([]);

    await getTicketsService({ status: 'Closed' });

    const [whereSql] = countTickets.mock.calls[0];
    expect(whereSql).toContain('status');
  });

  test('usa archived=0 por defeito', async () => {
    countTickets.mockResolvedValue(0);
    listTickets.mockResolvedValue([]);

    await getTicketsService({});

    const [, params] = countTickets.mock.calls[0];
    expect(params[0]).toBe(0);
  });

  test('usa archived=1 quando pedido', async () => {
    countTickets.mockResolvedValue(0);
    listTickets.mockResolvedValue([]);

    await getTicketsService({ archived: '1' });

    const [, params] = countTickets.mock.calls[0];
    expect(params[0]).toBe(1);
  });
});

// ─── updateTicketService ───────────────────────────────────────────────────────
describe('updateTicketService', () => {
  const updatedTicket = { ...ticketBase, status: 'In Progress' };

  test('atualiza e devolve before/after/changes', async () => {
    getTicketById
      .mockResolvedValueOnce(ticketBase)
      .mockResolvedValueOnce(updatedTicket);
    updateTicket.mockResolvedValue(1);

    const result = await updateTicketService(1, { status: 'In Progress' });

    expect(result.before).toEqual(ticketBase);
    expect(result.after).toEqual(updatedTicket);
    expect(result.changes.status).toEqual({ from: 'Open', to: 'In Progress' });
  });

  test('devolve null quando o ticket não existe', async () => {
    getTicketById.mockResolvedValue(null);

    const result = await updateTicketService(999, { status: 'Closed' });

    expect(result).toBeNull();
    expect(updateTicket).not.toHaveBeenCalled();
  });

  test('devolve null quando a atualização não afeta linhas', async () => {
    getTicketById.mockResolvedValue(ticketBase);
    updateTicket.mockResolvedValue(0);

    const result = await updateTicketService(1, { status: 'Closed' });

    expect(result).toBeNull();
  });

  test('mantém valor existente para campos não enviados', async () => {
    getTicketById
      .mockResolvedValueOnce(ticketBase)
      .mockResolvedValueOnce(ticketBase);
    updateTicket.mockResolvedValue(1);

    await updateTicketService(1, {});

    const [, updatedArg] = updateTicket.mock.calls[0];
    expect(updatedArg.ciName).toBe(ticketBase.ciName);
  });
});

// ─── archiveTicketService ──────────────────────────────────────────────────────
describe('archiveTicketService', () => {
  const archivedTicket = { ...ticketBase, archived: 1 };

  test('arquiva e devolve o ticket atualizado', async () => {
    getTicketById
      .mockResolvedValueOnce(ticketBase)
      .mockResolvedValueOnce(archivedTicket);
    archiveTicket.mockResolvedValue(1);

    const result = await archiveTicketService(1);

    expect(archiveTicket).toHaveBeenCalledWith(1);
    expect(result.archived).toBe(1);
  });

  test('devolve null quando o ticket não existe', async () => {
    getTicketById.mockResolvedValue(null);

    const result = await archiveTicketService(999);

    expect(result).toBeNull();
    expect(archiveTicket).not.toHaveBeenCalled();
  });
});