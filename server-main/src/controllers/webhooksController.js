// src/controllers/webhooksController.js
//
// Controller responsável por:
// - gerir o registo de webhooks
// - listar webhooks registados
// - validar o resultado devolvido pela camada de serviços
// - devolver respostas HTTP apropriadas
//

import { createWebhookService, listWebhooksService } from '../services/webhooksService.js';

/**
 * Registar um novo webhook.
 *
 * - Recebe URL e evento no body
 * - A validação (evento permitido, formato do URL, etc.)
 *   é feita no service
 * - O repositório garante unicidade (URL + evento)
 */
export const createWebhook = async (req, res) => {
  try {
    // Delegar toda a lógica de validação ao service
    const result = await createWebhookService(req.body);

    // Caso o service indique erro de validação
    if (!result.ok) {
      return res.status(result.status).json({ message: result.message });
    }

    // Se id === 0, o registo foi ignorado por duplicado
    // (devido ao índice UNIQUE na base de dados)
    return res.status(201).json(result);
  } catch (err) {
    // Erro inesperado (ex.: erro na base de dados)
    console.error('[WEBHOOKS] Erro ao registar webhook:', err.message);

    // Resposta genérica de erro interno
    return res.status(500).json({ message: 'Error creating webhook' });
  }
};

/**
 * Listar todos os webhooks registados.
 *
 * - Devolve a lista completa (ativos e inativos, se aplicável)
 * - Não recebe parâmetros
 */
export const listWebhooks = async (req, res) => {
  try {
    const hooks = await listWebhooksService();

    // Resposta HTTP 200 com a lista de webhooks
    return res.status(200).json(hooks);
  } catch (err) {
    console.error('[WEBHOOKS] Erro ao listar webhooks:', err.message);

    // Erro interno do servidor
    return res.status(500).json({ message: 'Error listing webhooks' });
  }
};
