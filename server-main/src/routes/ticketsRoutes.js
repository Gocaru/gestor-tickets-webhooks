import { Router } from 'express';
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  archiveTicket,
} from '../controllers/ticketsController.js';

const router = Router();

// CRUD (estrutura)
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicketById);
router.put('/:id', updateTicket);

// Em vez de apagar fisicamente: arquivar
router.delete('/:id', archiveTicket);

export default router;
