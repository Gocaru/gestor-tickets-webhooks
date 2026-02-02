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


export const createTicket = async (req, res) => {
  try {
    const ticketData = req.body;

    // validação mínima (pode expandir depois)
    if (!ticketData || typeof ticketData !== 'object') {
      return res.status(400).json({ message: 'Invalid request body' });
    }

    const created = await createTicketService(ticketData);
    return res.status(201).json(created);
  } catch (err) {
    console.error('Erro ao criar ticket:', err.message);
    return res.status(500).json({ message: 'Error creating ticket' });
  }
};

export const getTickets = async (req, res) => {
  try {
    const result = await getTicketsService(req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Erro ao listar tickets:', err.message);
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

    return res.status(200).json(ticket);
  } catch (err) {
    console.error('Erro ao obter ticket:', err.message);
    return res.status(500).json({ message: 'Error getting ticket' });
  }
};

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

    const updated = await updateTicketService(id, ticketData);

    if (!updated) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('Erro ao atualizar ticket:', err.message);
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

    return res.status(200).json({
      message: 'Ticket archived',
      ticket: archived,
    });
  } catch (err) {
    console.error('Erro ao arquivar ticket:', err.message);
    return res.status(500).json({ message: 'Error archiving ticket' });
  }
};

export const getStatsByStatus = async (req, res) => {
  try {
    const stats = await getStatsByStatusService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('Erro stats by status:', err.message);
    return res.status(500).json({ message: 'Error getting stats by status' });
  }
};

export const getStatsByPriority = async (req, res) => {
  try {
    const stats = await getStatsByPriorityService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('Erro stats by priority:', err.message);
    return res.status(500).json({ message: 'Error getting stats by priority' });
  }
};

export const getStatsByCiCat = async (req, res) => {
  try {
    const stats = await getStatsByCiCatService();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('Erro stats by ciCat:', err.message);
    return res.status(500).json({ message: 'Error getting stats by ciCat' });
  }
};

