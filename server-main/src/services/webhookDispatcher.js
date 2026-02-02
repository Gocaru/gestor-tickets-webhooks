import { listActiveWebhooksByEvent } from '../repositories/webhooksRepository.js';

export async function notifyWebhooks(event, data) {
  const hooks = await listActiveWebhooksByEvent(event);

  if (!hooks.length) return { event, sent: 0, failed: 0 };

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const results = await Promise.allSettled(
    hooks.map(async (h) => {
      const res = await fetch(h.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
