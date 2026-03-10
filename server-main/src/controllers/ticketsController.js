// src/controllers/ticketsController.js
import { auditLog } from '../services/auditService.js';

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

import { notifyWebhooks } from '../services/webhookDispatcher.js';

export const createTicket = async (req, res) => {
  try {
    const ticketData = req.body;
    if (!ticketData || typeof ticketData !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }
    ticketData.owner_id = req.user.userId;
    const created = await createTicketService(ticketData);
    notifyWebhooks('ticket.created', created).catch(console.error);
    auditLog(req.user.userId, 'ticket.created', `ticket:${created.id}`, 'success', req.ip);
    return res.status(201).json(created);
  } catch (err) {
    console.error('[TICKETS] Erro ao criar ticket:', err.message);
    return res.status(500).json({ message: 'Error creating ticket' });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { role, userId } = req.user;
    const filters = {
      ...req.query,
      ...(role === 'user' ? { owner_id: userId } : {}),
    };
    const result = await getTicketsService(filters);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[TICKETS] Erro ao listar tickets:', err.message);
    return res.status(500).json({ message: 'Error listing tickets' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid ticket id' });
    }
    const ticket = await getTicketByIdService(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    const { role, userId } = req.user;
    if (role === 'user' && ticket.owner_id !== userId) {
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
 * - agents e admins podem atualizar qualquer ticket
 * - users só podem atualizar os seus próprios tickets (IDOR)
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

    // IDOR: user só pode editar os seus próprios tickets
    if (req.user.role === 'user') {
      const existing = await getTicketByIdService(id);
      if (!existing) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
      if (existing.owner_id !== req.user.userId) {
        return res.status(404).json({ message: 'Ticket not found' });
      }
    }

    const result = await updateTicketService(id, ticketData);
    if (!result) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const updated = result.after;
    notifyWebhooks('ticket.updated', {
      ticketId: id,
      before: result.before,
      after: result.after,
      changes: result.changes,
    }).catch(console.error);
    auditLog(req.user.userId, 'ticket.updated', `ticket:${id}`, 'success', req.ip);

    return res.status(200).json(updated);
  } catch (err) {
    console.error('[TICKETS] Erro ao atualizar ticket:', err.message);
    return res.status(500).json({ message: 'Error updating ticket' });
  }
};

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
    notifyWebhooks('ticket.archived', archived).catch(console.error);
    auditLog(req.user.userId, 'ticket.archived', `ticket:${id}`, 'success', req.ip);
    return res.status(200).json({ message: 'Ticket archived', ticket: archived });
  } catch (err) {
    console.error('[TICKETS] Erro ao arquivar ticket:', err.message);
    return res.status(500).json({ message: 'Error archiving ticket' });
  }
};

export const getStatsByStatus = async (req, res) => {
  try {
    const stats = await getStatsByStatusService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by status:', err.message);
    return res.status(500).json({ message: 'Error getting stats by status' });
  }
};

export const getStatsByPriority = async (req, res) => {
  try {
    const stats = await getStatsByPriorityService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by priority:', err.message);
    return res.status(500).json({ message: 'Error getting stats by priority' });
  }
};

export const getStatsByCiCat = async (req, res) => {
  try {
    const stats = await getStatsByCiCatService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[STATS] Erro stats by ciCat:', err.message);
    return res.status(500).json({ message: 'Error getting stats by ciCat' });
  }
};