import { listActiveWebhooksByEvent } from '../repositories/webhooksRepository.js';
import crypto from 'crypto';

/**
 * Helper para fazer fetch com timeout.
 * 
 * Por defeito, o fetch não tem timeout.
 * Se o servidor recetor estiver em baixo ou não responder,
 * o request pode ficar "pendurado".
 * 
 * Usamos AbortController (disponível nativamente no Node 18+)
 * para abortar o request ao fim de X milissegundos.
 */
function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();

  // agenda o cancelamento do request
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const finalOptions = {
    ...options,
    signal: controller.signal
  };

  // executa o fetch e garante que o timeout é limpo no fim
  return fetch(url, finalOptions).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Dispara webhooks associados a um determinado evento.
 *
 * - Não bloqueia a resposta da API
 * - Envia o payload em JSON
 * - Assina o corpo com HMAC-SHA256 (se existir WEBHOOK_SECRET)
 * - Usa timeout para evitar requests pendurados
 *
 * @param {string} event - nome do evento (ex: ticket.created)
 * @param {object} data  - dados do evento
 */
export async function notifyWebhooks(event, data) {

  // obter todos os webhooks ativos para este evento
  const hooks = await listActiveWebhooksByEvent(event);

  // se não existir nenhum webhook, sair imediatamente
  if (!hooks || hooks.length === 0) {
    return { event, sent: 0, failed: 0 };
  }

  // payload enviado aos webhooks
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // segredo partilhado (HMAC)
  const secret = (process.env.WEBHOOK_SECRET || '').trim();

  // corpo em string (necessário para a assinatura)
  const bodyString = JSON.stringify(payload);

  /**
   * Se existir segredo:
   * - assina o body com HMAC-SHA256
   * - envia no header X-Webhook-Signature
   *
   * Se não existir segredo:
   * - envia sem assinatura (com warning)
   */
  const signature = secret
    ? `sha256=${crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex')}`
    : '';

  if (!secret) {
    console.warn(
      'WEBHOOK_SECRET not set. Webhooks will be sent without signature.'
    );
  }

  /**
   * Envio dos webhooks em paralelo.
   * 
   * Promise.allSettled é usado para:
   * - tentar enviar todos
   * - não falhar tudo se um webhook falhar
   */
  const results = await Promise.allSettled(
    hooks.map(async (hook) => {

      // envio com timeout (ex: 4 segundos)
      const response = await fetchWithTimeout(
        hook.url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(signature ? { 'X-Webhook-Signature': signature } : {}),
          },
          body: bodyString,
        },
        4000 // timeout em ms
      );

      // se o servidor recetor respondeu com erro
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(
          `Webhook ${hook.url} failed: ${response.status} ${text}`
        );
      }

      return true;
    })
  );

  // contabilização de sucessos e falhas
  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  return { event, sent, failed };
}
