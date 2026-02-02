import { createWebhookService, listWebhooksService } from '../services/webhooksService.js';

export const createWebhook = async (req, res) => {
  try {
    const result = await createWebhookService(req.body);

    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    // Se id=0, foi ignorado por duplicado (por causa do UNIQUE)
    return res.status(201).json(result);
  } catch (err) {
    console.error('Erro ao registar webhook:', err.message);
    return res.status(500).json({ message: 'Error creating webhook' });
  }
};

export const listWebhooks = async (req, res) => {
  try {
    const hooks = await listWebhooksService();
    return res.status(200).json(hooks);
  } catch (err) {
    console.error('Erro ao listar webhooks:', err.message);
    return res.status(500).json({ message: 'Error listing webhooks' });
  }
};
