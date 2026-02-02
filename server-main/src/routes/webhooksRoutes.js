import { Router } from 'express';
import { createWebhook, listWebhooks } from '../controllers/webhooksController.js';

const router = Router();

router.post('/', createWebhook);
router.get('/', listWebhooks);

export default router;
