// src/__tests__/ticketsController.test.js

import { jest } from '@jest/globals';

// ─── Mocks (antes dos imports) ─────────────────────────────────────────────────
const mockService = {
  createTicketService:  jest.fn(),
  getTicketsService:    jest.fn(),
  getTicketByIdService: jest.fn(),
  updateTicketService:  jest.fn(),
  archiveTicketService: jest.fn(),
};

const mockWebhook = {
  notifyWebhooks: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('../services/ticketsService.js',    () => mockService);
jest.unstable_mockModule('../services/webhookDispatcher.js', () => mockWebhook);

// ─── Imports dinâmicos ─────────────────────────────────────────────────────────
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  archiveTicket,
} = await import('../controllers/ticketsController.js');

const {
  createTicketService,
  getTicketsService,
  getTicketByIdService,
  updateTicketService,
  archiveTicketService,
} = mockService;

// ─── Helpers ───────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (overrides = {}) => ({
  body:   {},
  params: {},
  query:  {},
  ip:     '127.0.0.1',
  ...overrides,
});

const ticketBase = {
  id: 1,
  ciName: 'Servidor Web',
  status: 'Open',
  archived: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── createTicket ──────────────────────────────────────────────────────────────
describe('createTicket (controller)', () => {
  test('devolve 201 com o ticket criado', async () => {
    createTicketService.mockResolvedValue(ticketBase);
    const req = makeReq({ body: { ciName: 'Servidor Web' } });
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(ticketBase);
  });

  test('devolve 400 quando o body é inválido', async () => {
    const req = makeReq({ body: null });
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(createTicketService).not.toHaveBeenCalled();
  });

  test('devolve 500 quando o service lança erro', async () => {
    createTicketService.mockRejectedValue(new Error('DB error'));
    const req = makeReq({ body: { ciName: 'X' } });
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getTickets ────────────────────────────────────────────────────────────────
describe('getTickets (controller)', () => {
  test('devolve 200 com resultado paginado', async () => {
    const payload = { total: 1, limit: 20, offset: 0, tickets: [ticketBase] };
    getTicketsService.mockResolvedValue(payload);
    const req = makeReq();
    const res = makeRes();

    await getTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
  });

  test('devolve 500 quando o service lança erro', async () => {
    getTicketsService.mockRejectedValue(new Error('DB error'));
    const req = makeReq();
    const res = makeRes();

    await getTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getTicketById ─────────────────────────────────────────────────────────────
describe('getTicketById (controller)', () => {
  test('devolve 200 quando o ticket existe', async () => {
    getTicketByIdService.mockResolvedValue(ticketBase);
    const req = makeReq({ params: { id: '1' } });
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ticketBase);
  });

  test('devolve 404 quando o ticket não existe', async () => {
    getTicketByIdService.mockResolvedValue(null);
    const req = makeReq({ params: { id: '999' } });
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devolve 400 para id inválido (string)', async () => {
    const req = makeReq({ params: { id: 'abc' } });
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getTicketByIdService).not.toHaveBeenCalled();
  });

  test('devolve 400 para id <= 0', async () => {
    const req = makeReq({ params: { id: '0' } });
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── updateTicket ──────────────────────────────────────────────────────────────
describe('updateTicket (controller)', () => {
  test('devolve 200 com o ticket atualizado', async () => {
    const updated = { ...ticketBase, status: 'Closed' };
    updateTicketService.mockResolvedValue({
      before:  ticketBase,
      after:   updated,
      changes: { status: { from: 'Open', to: 'Closed' } },
    });
    const req = makeReq({ params: { id: '1' }, body: { status: 'Closed' } });
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updated);
  });

  test('devolve 404 quando o ticket não existe', async () => {
    updateTicketService.mockResolvedValue(null);
    const req = makeReq({ params: { id: '999' }, body: { status: 'Closed' } });
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devolve 400 para id inválido', async () => {
    const req = makeReq({ params: { id: '-1' }, body: { status: 'Closed' } });
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(updateTicketService).not.toHaveBeenCalled();
  });

  test('devolve 400 para body inválido', async () => {
    const req = makeReq({ params: { id: '1' }, body: null });
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── archiveTicket ─────────────────────────────────────────────────────────────
describe('archiveTicket (controller)', () => {
  test('devolve 200 quando arquivado com sucesso', async () => {
    const archived = { ...ticketBase, archived: 1 };
    archiveTicketService.mockResolvedValue(archived);
    const req = makeReq({ params: { id: '1' } });
    const res = makeRes();

    await archiveTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket archived', ticket: archived });
  });

  test('devolve 404 quando o ticket não existe', async () => {
    archiveTicketService.mockResolvedValue(null);
    const req = makeReq({ params: { id: '999' } });
    const res = makeRes();

    await archiveTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('devolve 400 para id inválido', async () => {
    const req = makeReq({ params: { id: 'xyz' } });
    const res = makeRes();

    await archiveTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(archiveTicketService).not.toHaveBeenCalled();
  });
});