import { Router } from 'express';
import { invoiceController } from '../controllers/invoiceController';
import { authenticate, requirePermission } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

// Middleware
router.use(authenticate);
router.use(auditMiddleware('Invoice'));

// Invoice routes
router.post('/', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.create);
router.get('/appointment/:appointmentId', requirePermission('screens.invoices.read', 'screens.invoices.full', 'screens.flowBoard.read', 'screens.flowBoard.full'), invoiceController.findByAppointmentId);
router.get('/:id', requirePermission('screens.invoices.read', 'screens.invoices.full', 'screens.flowBoard.read', 'screens.flowBoard.full'), invoiceController.findById);
router.put('/:id', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.update);
router.delete('/:id', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.delete);

// Invoice items routes
router.post('/:id/items', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.addItem);
router.put('/items/:itemId', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.updateItem);
router.delete('/items/:itemId', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.removeItem);

// Payment routes
router.post('/:id/payments', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.addPayment);
router.delete('/payments/:paymentId', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.removePayment);

// Finalize invoice
router.patch('/:id/finalize', requirePermission('screens.invoices.full', 'screens.flowBoard.full'), invoiceController.finalize);

export default router;
