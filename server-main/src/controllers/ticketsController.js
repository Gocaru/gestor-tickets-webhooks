// src/controllers/ticketsController.js
//
// Controller responsável por:
// - receber pedidos HTTP relacionados com tickets
// - validar inputs básicos (params e body)
// - chamar a camada de serviços
// - devolver respostas HTTP adequadas
// - disparar webhooks quando aplicável
//

import {
  createTicketService,
  getTicketsService,
  getTicketByIdService,
  updateTicketService,
  archiveTicketService,
} from '../services/ticketsService.js';

import {
  getStatsByStatusService,
  getStatsByPriorityService,
  getStatsByCiCatService,
} from '../services/ticketsStatsService.js';

// Dispatcher responsável por notificar webhooks registados
import { notifyWebhooks } from '../services/webhookDispatcher.js';

/**
 * Criar um novo ticket.
 *
 * - Valida o corpo do pedido
 * - Cria o ticket via service
 * - Dispara o webhook "ticket.created"
 */
export const createTicket = async (req, res) => {
  try {
    const ticketData = req.body;

    // Validação mínima do body
    if (!ticketData || typeof ticketData !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    // Criação do ticket (lógica de negócio no service)
    const created = await createTicketService(ticketData);

    // 🔔 Notificar webhooks de forma assíncrona
    // Não bloqueia a resposta HTTP
    notifyWebhooks('ticket.created', created).catch(console.error);

    // Resposta HTTP 201 (Created)
    return res.status(201).json(created);
  } catch (err) {
    console.error('[TICKETS] Erro ao criar ticket:', err.message);
    return res.status(500).json({ message: 'Error creating ticket' });
  }
};

/**
 * Listar tickets com paginação e filtros.
 *
 * - Os filtros são recebidos via query string
 * - A lógica de construção do WHERE está no service
 */
export const getTickets = async (req, res) => {
  try {
    const result = await getTicketsService(req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[TICKETS] Erro ao listar tickets:', err.message);
    return res.status(500).json({ message: 'Error listing tickets' });
  }
};

/**
 * Obter um ticket específico pelo ID.
 */
export const getTicketById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    // Validação do parâmetro ID
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const ticket = await getTicketByIdService(id);

    // Ticket não encontrado
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json(ticket);
  } catch (err) {
    console.error('[TICKETS] Erro ao obter ticket:', err.message);
    return res.status(500).json({ message: 'Error getting ticket' });
  }
};

/**
 * Atualizar um ticket existente.
 *
 * - Valida ID e body
 * - Atualiza apenas os campos enviados
 * - Dispara webhook "ticket.updated" com contexto
 */
export const updateTicket = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const ticketData = req.body;

    if (!ticketData || typeof ticketData !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    // Atualização do ticket
    const result = await updateTicketService(id, ticketData);

    if (!result) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updated = result.after;

    // 🔔 Notificar webhooks com informação detalhada
    notifyWebhooks('ticket.updated', {
      ticketId: id,
      before: result.before,
      after: result.after,
      changes: result.changes,
    }).catch(console.error);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[TICKETS] Erro ao atualizar ticket:', err.message);
    return res.status(500).json({ message: 'Error updating ticket' });
  }
};

/**
 * Arquivar um ticket (soft delete).
 *
 * - Não remove o registo da base de dados
 * - Marca o ticket como arquivado
 * - Dispara webhook "ticket.archived"
 */
export const archiveTicket = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    const archived = await archiveTicketService(id);

    if (!archived) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // 🔔 Notificar webhooks
    notifyWebhooks('ticket.archived', archived).catch(console.error);

    return res.status(200).json({
      message: 'Ticket archived',
      ticket: archived,
    });
  } catch (err) {
    console.error('[TICKETS] Erro ao arquivar ticket:', err.message);
    return res.status(500).json({ message: 'Error archiving ticket' });
  }
};

/**
 * Estatísticas agregadas por status.
 */
export const getStatsByStatus = async (req, res) => {
  try {
    const stats = await getStatsByStatusService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by status:', err.message);
    return res.status(500).json({ message: 'Error getting stats by status' });
  }
};

/**
 * Estatísticas agregadas por prioridade.
 */
export const getStatsByPriority = async (req, res) => {
  try {
    const stats = await getStatsByPriorityService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by priority:', err.message);
    return res.status(500).json({ message: 'Error getting stats by priority' });
  }
};

/**
 * Estatísticas agregadas por categoria CI.
 */
export const getStatsByCiCat = async (req, res) => {
  try {
    const stats = await getStatsByCiCatService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by ciCat:', err.message);
    return res.status(500).json({ message: 'Error getting stats by ciCat' });
  }
};
