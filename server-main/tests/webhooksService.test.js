/**
 * Testes unitários — webhooksService
 *
 * Testa a lógica de validação (URL, evento) sem aceder à base de dados.
 */

import { jest } from '@jest/globals';

// ── Mocks do repositório ──────────────────────────────────────────────────────
const mockCreateWebhook = jest.fn();
const mockListWebhooks  = jest.fn();

jest.unstable_mockModule('../src/repositories/webhooksRepository.js', () => ({
  createWebhook:             mockCreateWebhook,
  listWebhooks:              mockListWebhooks,
  listActiveWebhooksByEvent: jest.fn().mockResolvedValue([]),
}));

const {
  createWebhookService,
  listWebhooksService,
} = await import('../src/services/webhooksService.js');

// ── Limpar mocks ──────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
});

// =============================================================================
// createWebhookService — validações de input
// =============================================================================
describe('createWebhookService — validações', () => {

  test('devolve erro 400 se url estiver vazia', async () => {
    const result = await createWebhookService({ url: '', event: 'ticket.created' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toMatch(/url and event are required/i);
  });

  test('devolve erro 400 se event estiver vazio', async () => {
    const result = await createWebhookService({ url: 'https://example.com', event: '' });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });

  test('devolve erro 400 se event for inválido', async () => {
    const result = await createWebhookService({
      url: 'https://example.com/hook',
      event: 'ticket.desconhecido',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toMatch(/invalid event/i);
  });

  test('devolve erro 400 se url não for válida', async () => {
    const result = await createWebhookService({
      url: 'nao-e-uma-url',
      event: 'ticket.created',
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
    expect(result.message).toMatch(/invalid url/i);
  });

  test('devolve erro 400 se data for undefined', async () => {
    const result = await createWebhookService(undefined);

    expect(result.ok).toBe(false);
    expect(result.status).toBe(400);
  });
});

// =============================================================================
// createWebhookService — casos de sucesso
// =============================================================================
describe('createWebhookService — sucesso', () => {

  test('aceita ticket.created', async () => {
    mockCreateWebhook.mockResolvedValue(10);

    const result = await createWebhookService({
      url: 'https://example.com/hook',
      event: 'ticket.created',
    });

    expect(result.ok).toBe(true);
    expect(result.id).toBe(10);
    expect(result.event).toBe('ticket.created');
  });

  test('aceita ticket.updated', async () => {
    mockCreateWebhook.mockResolvedValue(11);

    const result = await createWebhookService({
      url: 'https://example.com/hook',
      event: 'ticket.updated',
    });

    expect(result.ok).toBe(true);
    expect(result.event).toBe('ticket.updated');
  });

  test('aceita ticket.archived', async () => {
    mockCreateWebhook.mockResolvedValue(12);

    const result = await createWebhookService({
      url: 'https://example.com/hook',
      event: 'ticket.archived',
    });

    expect(result.ok).toBe(true);
    expect(result.event).toBe('ticket.archived');
  });

  test('devolve url e event no resultado', async () => {
    mockCreateWebhook.mockResolvedValue(20);

    const result = await createWebhookService({
      url: 'https://meu-servidor.pt/webhook',
      event: 'ticket.created',
    });

    expect(result.url).toBe('https://meu-servidor.pt/webhook');
    expect(result.event).toBe('ticket.created');
  });

  test('faz trim ao url e event antes de validar', async () => {
    mockCreateWebhook.mockResolvedValue(21);

    const result = await createWebhookService({
      url: '  https://example.com/hook  ',
      event: '  ticket.created  ',
    });

    expect(result.ok).toBe(true);
  });
});

// =============================================================================
// listWebhooksService
// =============================================================================
describe('listWebhooksService', () => {

  test('devolve lista de webhooks', async () => {
    const hooks = [
      { id: 1, url: 'https://a.com', event: 'ticket.created' },
      { id: 2, url: 'https://b.com', event: 'ticket.updated' },
    ];
    mockListWebhooks.mockResolvedValue(hooks);

    const result = await listWebhooksService();

    expect(result).toHaveLength(2);
    expect(result[0].event).toBe('ticket.created');
  });

  test('devolve lista vazia se não houver webhooks', async () => {
    mockListWebhooks.mockResolvedValue([]);

    const result = await listWebhooksService();

    expect(result).toEqual([]);
  });
});