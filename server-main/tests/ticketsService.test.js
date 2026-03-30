/**
 * Testes unitários — ticketsService
 *
 * Todos os repositórios são substituídos por mocks (jest.mock),
 * para que os testes não dependam da base de dados.
 */

import { jest } from '@jest/globals';

// ── Mocks dos repositórios ────────────────────────────────────────────────────
const mockCreateTicket    = jest.fn();
const mockGetTicketById   = jest.fn();
const mockUpdateTicket    = jest.fn();
const mockArchiveTicket   = jest.fn();
const mockListTickets     = jest.fn();
const mockCountTickets    = jest.fn();

jest.unstable_mockModule('../src/repositories/ticketsRepository.js', () => ({
  createTicket:  mockCreateTicket,
  getTicketById: mockGetTicketById,
  updateTicket:  mockUpdateTicket,
  archiveTicket: mockArchiveTicket,
  listTickets:   mockListTickets,
  countTickets:  mockCountTickets,
}));

// O import do serviço tem de ser DINÂMICO (depois dos mocks)
const {
  createTicketService,
  getTicketsService,
  getTicketByIdService,
  updateTicketService,
  archiveTicketService,
} = await import('../src/services/ticketsService.js');

// ── Dados de exemplo ──────────────────────────────────────────────────────────
const ticketBase = {
  id: 1,
  ciName: 'Server-01',
  ciCat: 'Hardware',
  ciSubcat: 'CPU',
  status: 'open',
  impact: 'high',
  urgency: 'high',
  priority: 'critical',
  openTime: '2024-01-01T10:00:00Z',
  resolvedTime: null,
  closeTime: null,
  archived: 0,
};

// ── Limpar mocks antes de cada teste ─────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// createTicketService
// =============================================================================
describe('createTicketService', () => {

  test('cria ticket e devolve o objeto completo', async () => {
    mockCreateTicket.mockResolvedValue(1);
    mockGetTicketById.mockResolvedValue(ticketBase);

    const result = await createTicketService({ ciName: 'Server-01' });

    expect(mockCreateTicket).toHaveBeenCalledTimes(1);
    expect(mockGetTicketById).toHaveBeenCalledWith(1);
    expect(result).toEqual(ticketBase);
  });

  test('propaga erro do repositório', async () => {
    mockCreateTicket.mockRejectedValue(new Error('DB error'));

    await expect(createTicketService({})).rejects.toThrow('DB error');
  });
});

// =============================================================================
// getTicketByIdService
// =============================================================================
describe('getTicketByIdService', () => {

  test('devolve ticket quando existe', async () => {
    mockGetTicketById.mockResolvedValue(ticketBase);

    const result = await getTicketByIdService(1);

    expect(mockGetTicketById).toHaveBeenCalledWith(1);
    expect(result).toEqual(ticketBase);
  });

  test('devolve null quando o ticket não existe', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await getTicketByIdService(999);

    expect(result).toBeNull();
  });
});

// =============================================================================
// getTicketsService — paginação e filtros
// =============================================================================
describe('getTicketsService', () => {

  test('usa valores por defeito (limit=20, offset=0, archived=0)', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);

    const result = await getTicketsService({});

    expect(result.limit).toBe(20);
    expect(result.offset).toBe(0);
    expect(result.total).toBe(0);
    expect(result.tickets).toEqual([]);
  });

  test('respeita limit e offset enviados na query', async () => {
    mockCountTickets.mockResolvedValue(5);
    mockListTickets.mockResolvedValue([ticketBase]);

    const result = await getTicketsService({ limit: '5', offset: '10' });

    expect(result.limit).toBe(5);
    expect(result.offset).toBe(10);
  });

  test('filtra por status quando fornecido', async () => {
    mockCountTickets.mockResolvedValue(1);
    mockListTickets.mockResolvedValue([ticketBase]);

    await getTicketsService({ status: 'open' });

    // O segundo argumento de countTickets (params) deve incluir 'open'
    const params = mockCountTickets.mock.calls[0][1];
    expect(params).toContain('open');
  });

  test('filtra por priority quando fornecido', async () => {
    mockCountTickets.mockResolvedValue(1);
    mockListTickets.mockResolvedValue([ticketBase]);

    await getTicketsService({ priority: 'critical' });

    const params = mockCountTickets.mock.calls[0][1];
    expect(params).toContain('critical');
  });

  test('lista arquivados quando archived=1', async () => {
    mockCountTickets.mockResolvedValue(2);
    mockListTickets.mockResolvedValue([]);

    await getTicketsService({ archived: '1' });

    const params = mockCountTickets.mock.calls[0][1];
    expect(params[0]).toBe(1); // primeiro param é o valor de archived
  });

  test('limit inválido (zero) recai no valor por defeito 20', async () => {
    mockCountTickets.mockResolvedValue(0);
    mockListTickets.mockResolvedValue([]);

    const result = await getTicketsService({ limit: '0' });

    expect(result.limit).toBe(20);
  });
});

// =============================================================================
// updateTicketService
// =============================================================================
describe('updateTicketService', () => {

  test('devolve null se o ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await updateTicketService(999, { status: 'closed' });

    expect(result).toBeNull();
  });

  test('devolve null se updateTicket não encontrar linhas', async () => {
    mockGetTicketById.mockResolvedValue(ticketBase);
    mockUpdateTicket.mockResolvedValue(0); // 0 rows changed

    const result = await updateTicketService(1, { status: 'closed' });

    expect(result).toBeNull();
  });

  test('devolve before/after/changes quando a atualização é bem sucedida', async () => {
    const ticketAtualizado = { ...ticketBase, status: 'closed' };

    mockGetTicketById
      .mockResolvedValueOnce(ticketBase)       // 1.ª chamada: existente
      .mockResolvedValueOnce(ticketAtualizado); // 2.ª chamada: depois de atualizar
    mockUpdateTicket.mockResolvedValue(1);

    const result = await updateTicketService(1, { status: 'closed' });

    expect(result).not.toBeNull();
    expect(result.before.status).toBe('open');
    expect(result.after.status).toBe('closed');
    expect(result.changes).toHaveProperty('status');
    expect(result.changes.status).toEqual({ from: 'open', to: 'closed' });
  });

  test('changes está vazio se nenhum campo mudou', async () => {
    mockGetTicketById.mockResolvedValue(ticketBase);
    mockUpdateTicket.mockResolvedValue(1);
    // Simula que após update o ticket é igual ao original
    mockGetTicketById.mockResolvedValueOnce(ticketBase).mockResolvedValueOnce(ticketBase);

    const result = await updateTicketService(1, {});

    expect(result.changes).toEqual({});
  });

  test('mantém o valor existente para campos não enviados', async () => {
    const ticketAtualizado = { ...ticketBase, status: 'closed' };

    mockGetTicketById
      .mockResolvedValueOnce(ticketBase)
      .mockResolvedValueOnce(ticketAtualizado);
    mockUpdateTicket.mockResolvedValue(1);

    await updateTicketService(1, { status: 'closed' });

    // O objeto enviado ao updateTicket deve manter ciName do original
    const updatedObj = mockUpdateTicket.mock.calls[0][1];
    expect(updatedObj.ciName).toBe(ticketBase.ciName);
  });
});

// =============================================================================
// archiveTicketService
// =============================================================================
describe('archiveTicketService', () => {

  test('devolve null se o ticket não existir', async () => {
    mockGetTicketById.mockResolvedValue(null);

    const result = await archiveTicketService(999);

    expect(result).toBeNull();
  });

  test('devolve null se archiveTicket não alterar nada', async () => {
    mockGetTicketById.mockResolvedValue(ticketBase);
    mockArchiveTicket.mockResolvedValue(0);

    const result = await archiveTicketService(1);

    expect(result).toBeNull();
  });

  test('devolve ticket arquivado quando bem sucedido', async () => {
    const arquivado = { ...ticketBase, archived: 1 };

    mockGetTicketById
      .mockResolvedValueOnce(ticketBase)  // verificação existência
      .mockResolvedValueOnce(arquivado);  // leitura final
    mockArchiveTicket.mockResolvedValue(1);

    const result = await archiveTicketService(1);

    expect(result.archived).toBe(1);
  });
});