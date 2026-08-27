import { Router } from 'express';
import { creditNoteController } from '../controllers/creditNoteController';
import { authenticate, requirePermission } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware('CreditNote'));

const READ = ['screens.creditNotes.read', 'screens.creditNotes.full'];
const FULL = ['screens.creditNotes.full'];

// Finalized invoices eligible for a credit note (static path — before /:id)
router.get('/invoices', requirePermission(...READ), creditNoteController.listCreditableInvoices);

// Create a credit note (full cancellation)
router.post('/', requirePermission(...FULL), creditNoteController.create);

// List issued credit notes
router.get('/', requirePermission(...READ), creditNoteController.list);

// Single credit note
router.get('/:id', requirePermission(...READ), creditNoteController.findById);

export default router;
