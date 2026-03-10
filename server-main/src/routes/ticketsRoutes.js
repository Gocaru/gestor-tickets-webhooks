// src/routes/ticketsRoutes.js
import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  archiveTicket,
  getStatsByStatus,
  getStatsByPriority,
  getStatsByCiCat,
} from '../controllers/ticketsController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Qualquer utilizador autenticado pode criar tickets e ver os seus
router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, getTickets);

// Stats apenas para agents e admins
// ⚠️ Estas rotas têm de ficar ANTES de /:id
router.get('/stats/by-status',   requireRole('agent', 'admin'), getStatsByStatus);
router.get('/stats/by-priority', requireRole('agent', 'admin'), getStatsByPriority);
router.get('/stats/by-ciCat',    requireRole('agent', 'admin'), getStatsByCiCat);

// Ver ticket individual — qualquer autenticado
router.get('/:id', requireAuth, getTicketById);

// Atualizar — qualquer autenticado (IDOR verificado no controller)
router.put('/:id', requireAuth, updateTicket);

// Arquivar — apenas agents e admins
router.delete('/:id', requireRole('agent', 'admin'), archiveTicket);

export default router;