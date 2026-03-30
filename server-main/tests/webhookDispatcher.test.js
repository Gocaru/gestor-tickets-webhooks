/**
 * Testes unitários — webhookDispatcher (notifyWebhooks)
 *
 * Testa o envio de webhooks: contagem de sucesso/falha,
 * assinatura HMAC e timeout — sem fazer chamadas HTTP reais.
 */

import { jest } from '@jest/globals';

// ── Mock do repositório ───────────────────────────────────────────────────────
const mockListActiveWebhooksByEvent = jest.fn();

jest.unstable_mockModule('../src/repositories/webhooksRepository.js', () => ({
  createWebhook:             jest.fn(),
  listWebhooks:              jest.fn(),
  listActiveWebhooksByEvent: mockListActiveWebhooksByEvent,
}));

// ── Mock global do fetch ──────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

const { notifyWebhooks } = await import('../src/services/webhookDispatcher.js');

// ── Helpers ───────────────────────────────────────────────────────────────────
const hookOk = { id: 1, url: 'https://receiver.example.com/hook' };

function mockFetchOk() {
  mockFetch.mockResolvedValue({ ok: true });
}

function mockFetchFail(status = 500) {
  mockFetch.mockResolvedValue({
    ok: false,
    status,
    text: async () => 'Internal Server Error',
  });
}

// ── Limpeza ───────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.WEBHOOK_SECRET;
});

// =============================================================================
// Sem webhooks registados
// =============================================================================
describe('notifyWebhooks — sem webhooks registados', () => {

  test('devolve sent=0 e failed=0 se não houver hooks', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([]);

    const result = await notifyWebhooks('ticket.created', {});

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  test('devolve o evento correto no resultado', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([]);

    const result = await notifyWebhooks('ticket.updated', {});

    expect(result.event).toBe('ticket.updated');
  });
});

// =============================================================================
// Envio bem sucedido
// =============================================================================
describe('notifyWebhooks — envio bem sucedido', () => {

  test('envia para 1 webhook e reporta sent=1', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchOk();

    const result = await notifyWebhooks('ticket.created', { id: 1 });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(0);
  });

  test('envia para múltiplos webhooks', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([
      { id: 1, url: 'https://a.com/hook' },
      { id: 2, url: 'https://b.com/hook' },
    ]);
    mockFetchOk();

    const result = await notifyWebhooks('ticket.created', {});

    expect(result.sent).toBe(2);
    expect(result.failed).toBe(0);
  });

  test('envia payload com Content-Type application/json', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchOk();

    await notifyWebhooks('ticket.created', { id: 42 });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  test('o payload enviado contém o evento e os dados', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchOk();

    await notifyWebhooks('ticket.archived', { id: 5 });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.event).toBe('ticket.archived');
    expect(body.data).toEqual({ id: 5 });
    expect(body.timestamp).toBeDefined();
  });
});

// =============================================================================
// Envio com falhas
// =============================================================================
describe('notifyWebhooks — envio com falhas', () => {

  test('conta como failed quando o servidor responde com erro', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchFail(500);

    const result = await notifyWebhooks('ticket.created', {});

    expect(result.sent).toBe(0);
    expect(result.failed).toBe(1);
  });

  test('conta parcialmente: 1 ok e 1 falha', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([
      { id: 1, url: 'https://ok.com/hook' },
      { id: 2, url: 'https://fail.com/hook' },
    ]);

    mockFetch
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => '' });

    const result = await notifyWebhooks('ticket.updated', {});

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
  });

  test('não lança exceção mesmo que todos os hooks falhem', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(notifyWebhooks('ticket.created', {})).resolves.toBeDefined();
  });
});

// =============================================================================
// Assinatura HMAC
// =============================================================================
describe('notifyWebhooks — assinatura HMAC', () => {

  test('envia X-Webhook-Signature quando WEBHOOK_SECRET está definido', async () => {
    process.env.WEBHOOK_SECRET = 'segredo-teste';
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchOk();

    await notifyWebhooks('ticket.created', {});

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).toHaveProperty('X-Webhook-Signature');
    expect(options.headers['X-Webhook-Signature']).toMatch(/^sha256=/);
  });

  test('não envia X-Webhook-Signature sem WEBHOOK_SECRET', async () => {
    mockListActiveWebhooksByEvent.mockResolvedValue([hookOk]);
    mockFetchOk();

    await notifyWebhooks('ticket.created', {});

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers).not.toHaveProperty('X-Webhook-Signature');
  });
});