import { createWebhook, listWebhooks } from '../repositories/webhooksRepository.js';

const ALLOWED_EVENTS = new Set([
  'ticket.created',
  'ticket.updated',
  'ticket.archived',
]);

export const createWebhookService = async (data) => {
  const url = (data?.url || '').trim();
  const event = (data?.event || '').trim();

  if (!url || !event) {
    return { ok: false, status: 400, message: 'url and event are required' };
  }

  if (!ALLOWED_EVENTS.has(event)) {
    return { ok: false, status: 400, message: `Invalid event. Allowed: ${[...ALLOWED_EVENTS].join(', ')}` };
  }

  // validação simples de URL
  try {
    new URL(url);
  } catch {
    return { ok: false, status: 400, message: 'Invalid url format' };
  }

  const id = await createWebhook({ url, event });

  return { ok: true, id, url, event };
};

export const listWebhooksService = async () => {
  const hooks = await listWebhooks();
  return hooks;
};
