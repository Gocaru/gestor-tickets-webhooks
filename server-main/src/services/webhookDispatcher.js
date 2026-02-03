import { listActiveWebhooksByEvent } from '../repositories/webhooksRepository.js';
import crypto from 'crypto';

export async function notifyWebhooks(event, data) {
  const hooks = await listActiveWebhooksByEvent(event);

  if (!hooks.length) return { event, sent: 0, failed: 0 };

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Segurança (chave secreta partilhada):
  // Assina o corpo do webhook com HMAC-SHA256.
  // O servidor recetor valida a assinatura usando a mesma WEBHOOK_SECRET.
  const secret = (process.env.WEBHOOK_SECRET || '').trim();
  const bodyString = JSON.stringify(payload);
  const signature = secret
    ? `sha256=${crypto.createHmac('sha256', secret).update(bodyString).digest('hex')}`
    : '';

  const results = await Promise.allSettled(
    hooks.map(async (h) => {
      const res = await fetch(h.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(signature ? { 'X-Webhook-Signature': signature } : {}),
        },
        body: bodyString,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Webhook ${h.url} failed: ${res.status} ${text}`);
      }
      return true;
    })
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.length - sent;

  return { event, sent, failed };
}
