import { Router } from 'express';
import { petController } from '../controllers/petController';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware('Pet'));

// Read operations - requireScreenAccess allows both 'read' and 'full' levels
router.get('/', requireScreenAccess('patients'), petController.findAll);
router.get('/:id', requireScreenAccess('patients'), petController.findById);

// Write operations - requireScreenModify requires 'full' level only
router.post('/with-owner', requireScreenModify('patients'), petController.createWithOwner);
router.post('/', requireScreenModify('patients'), petController.create);
router.put('/:id', requireScreenModify('patients'), petController.update);
router.delete('/:id', requireScreenModify('patients'), petController.delete);

export default router;
