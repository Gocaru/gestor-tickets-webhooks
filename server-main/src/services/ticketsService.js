import {
  createTicket,
  getTicketById,
  updateTicket,
  archiveTicket,
  listTickets,
  countTickets
} from '../repositories/ticketsRepository.js';

/**
 * Criar ticket.
 * Nota: o id é AUTOINCREMENT, portanto não é enviado.
 */
export const createTicketService = async (ticketData) => {
  const id = await createTicket(ticketData);
  return await getTicketById(id);
};

/**
 * Listar tickets com paginação + filtros (mínimo 4).
 * Filtros suportados: status, priority, impact, urgency (e ainda ciCat, ciSubcat).
 * Por defeito, não lista arquivados (archived=0).
 */
export const getTicketsService = async (query) => {
  const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
  const offset = Number(query.offset) >= 0 ? Number(query.offset) : 0;

  // Por defeito: ativos
  const archived = query.archived === '1' ? 1 : 0;

  const where = ['COALESCE(archived, 0) = ?'];
  const params = [archived];

  // Mínimo 4 filtros
  if (query.status) { where.push('status = ?'); params.push(query.status); }
  if (query.priority) { where.push('priority = ?'); params.push(query.priority); }
  if (query.impact) { where.push('impact = ?'); params.push(query.impact); }
  if (query.urgency) { where.push('urgency = ?'); params.push(query.urgency); }

  // Extra (opcionais)
  if (query.ciCat) { where.push('ciCat = ?'); params.push(query.ciCat); }
  if (query.ciSubcat) { where.push('ciSubcat = ?'); params.push(query.ciSubcat); }

  const whereSql = `WHERE ${where.join(' AND ')}`;

  const total = await countTickets(whereSql, params);
  const tickets = await listTickets(whereSql, params, limit, offset);

  return { total, limit, offset, tickets };
};

/**
 * Obter ticket por id.
 */
export const getTicketByIdService = async (id) => {
  return await getTicketById(id);
};

/**
 * Atualizar atributos relevantes do ticket.
 * Não altera archived aqui (arquivar é feito no "delete").
 */
export const updateTicketService = async (id, ticketData) => {
  const existing = await getTicketById(id);
  if (!existing) return null;

  const updated = {
    ciName: ticketData.ciName !== undefined ? ticketData.ciName : existing.ciName,
    ciCat: ticketData.ciCat !== undefined ? ticketData.ciCat : existing.ciCat,
    ciSubcat: ticketData.ciSubcat !== undefined ? ticketData.ciSubcat : existing.ciSubcat,

    status: ticketData.status !== undefined ? ticketData.status : existing.status,
    impact: ticketData.impact !== undefined ? ticketData.impact : existing.impact,
    urgency: ticketData.urgency !== undefined ? ticketData.urgency : existing.urgency,
    priority: ticketData.priority !== undefined ? ticketData.priority : existing.priority,

    openTime: ticketData.openTime !== undefined ? ticketData.openTime : existing.openTime,
    resolvedTime: ticketData.resolvedTime !== undefined ? ticketData.resolvedTime : existing.resolvedTime,
    closeTime: ticketData.closeTime !== undefined ? ticketData.closeTime : existing.closeTime
  };

  const changes = await updateTicket(id, updated);
  if (!changes) return null;

  const after = await getTicketById(id);
  if (!after) return null;

  // Contexto útil para webhooks: antes/depois + campos alterados
  const changedFields = {};
  Object.keys(after).forEach((key) => {
    // Ignorar alterações técnicas se existirem no futuro
    const beforeValue = existing[key];
    const afterValue = after[key];

    if (beforeValue !== afterValue) {
      changedFields[key] = { from: beforeValue, to: afterValue };
    }
  });

  return {
    before: existing,
    after,
    changes: changedFields,
  };
};

/**
 * Arquivar ticket (em vez de apagar fisicamente).
 */
export const archiveTicketService = async (id) => {
  const existing = await getTicketById(id);
  if (!existing) return null;

  const changes = await archiveTicket(id);
  if (!changes) return null;

  return await getTicketById(id);
};
