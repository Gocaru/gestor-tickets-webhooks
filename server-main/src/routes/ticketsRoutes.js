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

const router = Router();

// CRUD (estrutura)
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/stats/by-status', getStatsByStatus);
router.get('/stats/by-priority', getStatsByPriority);
router.get('/stats/by-ciCat', getStatsByCiCat);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);

// Em vez de apagar fisicamente: arquivar
router.delete('/:id', archiveTicket);

export default router;
