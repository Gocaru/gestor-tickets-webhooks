import { jest } from '@jest/globals';

// 1. Mocks do Service e Webhook
const mockCreateTicketService = jest.fn();
const mockGetTicketsService = jest.fn();
const mockGetTicketByIdService = jest.fn();
const mockUpdateTicketService = jest.fn();
const mockArchiveTicketService = jest.fn();
const mockNotifyWebhooks = jest.fn().mockResolvedValue();

jest.unstable_mockModule('../services/ticketsService.js', () => ({
  createTicketService: mockCreateTicketService,
  getTicketsService: mockGetTicketsService,
  getTicketByIdService: mockGetTicketByIdService,
  updateTicketService: mockUpdateTicketService,
  archiveTicketService: mockArchiveTicketService,
}));

jest.unstable_mockModule('../services/webhookDispatcher.js', () => ({
  notifyWebhooks: mockNotifyWebhooks,
}));

jest.unstable_mockModule('../services/ticketsStatsService.js', () => ({
  getStatsByStatusService: jest.fn(),
  getStatsByPriorityService: jest.fn(),
  getStatsByCiCatService: jest.fn(),
}));

// 2. Import dinâmico após mocks
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  archiveTicket,
} = await import('../controllers/ticketsController.js');

// 3. Helper para simular req e res do Express
const makeRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
});

// --- createTicket ---
describe('createTicket', () => {
  test('deve retornar 201 com o ticket criado', async () => {
    mockCreateTicketService.mockResolvedValue({ id: 1, status: 'Open' });
    const req = { body: { ciName: 'Servidor' } };
    const res = makeRes();
    await createTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 1, status: 'Open' });
  });

  test('deve retornar 400 se body for inválido', async () => {
    const req = { body: null };
    const res = makeRes();
    await createTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('deve retornar 500 se o service lançar erro', async () => {
    mockCreateTicketService.mockRejectedValue(new Error('DB error'));
    const req = { body: { ciName: 'Servidor' } };
    const res = makeRes();
    await createTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// --- getTickets ---
describe('getTickets', () => {
  test('deve retornar 200 com lista de tickets', async () => {
    mockGetTicketsService.mockResolvedValue({ total: 1, tickets: [{ id: 1 }] });
    const req = { query: {} };
    const res = makeRes();
    await getTickets(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deve retornar 500 se o service lançar erro', async () => {
    mockGetTicketsService.mockRejectedValue(new Error('DB error'));
    const req = { query: {} };
    const res = makeRes();
    await getTickets(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// --- getTicketById ---
describe('getTicketById', () => {
  test('deve retornar 200 com o ticket', async () => {
    mockGetTicketByIdService.mockResolvedValue({ id: 1, ciName: 'Servidor' });
    const req = { params: { id: '1' } };
    const res = makeRes();
    await getTicketById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockGetTicketByIdService.mockResolvedValue(null);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await getTicketById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 400 se id for inválido', async () => {
    const req = { params: { id: 'abc' } };
    const res = makeRes();
    await getTicketById(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// --- updateTicket ---
describe('updateTicket', () => {
  test('deve retornar 200 com o ticket actualizado', async () => {
    mockUpdateTicketService.mockResolvedValue({
      before: { id: 1, status: 'Open' },
      after: { id: 1, status: 'Closed' },
      changes: { status: { from: 'Open', to: 'Closed' } },
    });
    const req = { params: { id: '1' }, body: { status: 'Closed' } };
    const res = makeRes();
    await updateTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockUpdateTicketService.mockResolvedValue(null);
    const req = { params: { id: '999' }, body: { status: 'Closed' } };
    const res = makeRes();
    await updateTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 400 se id for inválido', async () => {
    const req = { params: { id: 'abc' }, body: {} };
    const res = makeRes();
    await updateTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

// --- archiveTicket ---
describe('archiveTicket', () => {
  test('deve retornar 200 quando arquivado com sucesso', async () => {
    mockArchiveTicketService.mockResolvedValue({ id: 1, archived: 1 });
    const req = { params: { id: '1' } };
    const res = makeRes();
    await archiveTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('deve retornar 404 se ticket não existir', async () => {
    mockArchiveTicketService.mockResolvedValue(null);
    const req = { params: { id: '999' } };
    const res = makeRes();
    await archiveTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('deve retornar 400 se id for inválido', async () => {
    const req = { params: { id: 'abc' } };
    const res = makeRes();
    await archiveTicket(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
