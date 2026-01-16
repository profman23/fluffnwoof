import { Router } from 'express';
import { ownerController } from '../controllers/ownerController';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware('Owner'));

// Read operations - requireScreenAccess allows both 'read' and 'full' levels
router.get('/', requireScreenAccess('patients'), ownerController.findAll);
router.get('/:id', requireScreenAccess('patients'), ownerController.findById);

// Write operations - requireScreenModify requires 'full' level only
router.post('/', requireScreenModify('patients'), ownerController.create);
router.put('/:id', requireScreenModify('patients'), ownerController.update);
router.delete('/:id', requireScreenModify('patients'), ownerController.delete);

export default router;
