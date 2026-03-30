import { jest } from '@jest/globals';

// Mocks declarados ANTES dos imports dinâmicos (obrigatório com ESM)
const mockCreateTicketService    = jest.fn();
const mockGetTicketsService      = jest.fn();
const mockGetTicketByIdService   = jest.fn();
const mockUpdateTicketService    = jest.fn();
const mockArchiveTicketService   = jest.fn();
const mockNotifyWebhooks         = jest.fn().mockResolvedValue();

jest.unstable_mockModule('../services/ticketsService.js', () => ({
  createTicketService:  mockCreateTicketService,
  getTicketsService:    mockGetTicketsService,
  getTicketByIdService: mockGetTicketByIdService,
  updateTicketService:  mockUpdateTicketService,
  archiveTicketService: mockArchiveTicketService,
}));

jest.unstable_mockModule('../services/ticketsStatsService.js', () => ({
  getStatsByStatusService:   jest.fn(),
  getStatsByPriorityService: jest.fn(),
  getStatsByCiCatService:    jest.fn(),
}));

jest.unstable_mockModule('../services/webhookDispatcher.js', () => ({
  notifyWebhooks: mockNotifyWebhooks,
}));

// Imports dinâmicos após os mocks
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  archiveTicket,
} = await import('../controllers/ticketsController.js');

// Helper: cria req e res simulados
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

// ─── createTicket ────────────────────────────────────────────────
describe('createTicket', () => {
  test('deve retornar 201 com o ticket criado', async () => {
    const ticket = { id: 1, status: 'Open', ciName: 'Servidor' };
    mockCreateTicketService.mockResolvedValue(ticket);

    const req = { body: { ciName: 'Servidor', status: 'Open' } };
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(ticket);
  });

  test('deve retornar 400 se o body for inválido', async () => {
    const req = { body: null };
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid request body' });
  });

  test('deve retornar 500 se o service lançar erro', async () => {
    mockCreateTicketService.mockRejectedValue(new Error('DB falhou'));

    const req = { body: { ciName: 'Servidor' } };
    const res = makeRes();

    await createTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Error creating ticket' });
  });
});

// ─── getTickets ───────────────────────────────────────────────────
describe('getTickets', () => {
  test('deve retornar 200 com a lista de tickets', async () => {
    const resultado = { total: 2, tickets: [{ id: 1 }, { id: 2 }] };
    mockGetTicketsService.mockResolvedValue(resultado);

    const req = { query: {} };
    const res = makeRes();

    await getTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(resultado);
  });

  test('deve retornar 500 se o service lançar erro', async () => {
    mockGetTicketsService.mockRejectedValue(new Error('DB falhou'));

    const req = { query: {} };
    const res = makeRes();

    await getTickets(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ─── getTicketById ────────────────────────────────────────────────
describe('getTicketById', () => {
  test('deve retornar 200 com o ticket', async () => {
    const ticket = { id: 1, status: 'Open' };
    mockGetTicketByIdService.mockResolvedValue(ticket);

    const req = { params: { id: '1' } };
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(ticket);
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockGetTicketByIdService.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket not found' });
  });

  test('deve retornar 400 se o id for inválido', async () => {
    const req = { params: { id: 'abc' } };
    const res = makeRes();

    await getTicketById(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid ticket id' });
  });
});

// ─── updateTicket ─────────────────────────────────────────────────
describe('updateTicket', () => {
  test('deve retornar 200 com o ticket atualizado', async () => {
    const result = {
      before: { id: 1, status: 'Open' },
      after:  { id: 1, status: 'Closed' },
      changes: { status: { from: 'Open', to: 'Closed' } },
    };
    mockUpdateTicketService.mockResolvedValue(result);

    const req = { params: { id: '1' }, body: { status: 'Closed' } };
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result.after);
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockUpdateTicketService.mockResolvedValue(null);

    const req = { params: { id: '999' }, body: { status: 'Closed' } };
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 400 se o id for inválido', async () => {
    const req = { params: { id: '0' }, body: { status: 'Closed' } };
    const res = makeRes();

    await updateTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// ─── archiveTicket ────────────────────────────────────────────────
describe('archiveTicket', () => {
  test('deve retornar 200 com o ticket arquivado', async () => {
    const ticket = { id: 1, archived: 1 };
    mockArchiveTicketService.mockResolvedValue(ticket);

    const req = { params: { id: '1' } };
    const res = makeRes();

    await archiveTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ticket archived', ticket });
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockArchiveTicketService.mockResolvedValue(null);

    const req = { params: { id: '999' } };
    const res = makeRes();

    await archiveTicket(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});