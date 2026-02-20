import { Router } from 'express';
import { authenticate, requireScreenModify } from '../middlewares/auth';
import { importController } from '../controllers/importController';

const router = Router();

router.use(authenticate);

/**
 * POST /api/import/clients-pets
 * Import clients and pets from parsed Excel data (JSON rows)
 * Body: { rows: ImportRow[] }
 */
router.post('/clients-pets', requireScreenModify('importClients'), importController.clientsPets);

export default router;
