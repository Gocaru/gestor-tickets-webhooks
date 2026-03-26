import { Router } from 'express';
import { createWebhook, listWebhooks } from '../controllers/webhooksController.js';
import { requireRole } from '../middleware/auth.js';

const router = Router();

// Gestão de webhooks — apenas admins
router.post('/', requireRole('admin'), createWebhook);
router.get('/', requireRole('admin'), listWebhooks);

export default router;