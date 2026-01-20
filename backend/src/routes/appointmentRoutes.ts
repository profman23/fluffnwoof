import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticate, requirePermission } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware('Appointment'));

router.post('/', requirePermission('appointments.create', 'screens.flowBoard.full'), appointmentController.create);
router.get('/', requirePermission('appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.findAll);
router.get('/upcoming', requirePermission('appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.getUpcoming);
router.get('/flow-board', requirePermission('screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.getFlowBoardData);
router.get('/pet/:petId/upcoming', requirePermission('appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.getUpcomingByPetId);
router.get('/record/:recordId/scheduled', requirePermission('appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.getByScheduledFromRecordId);
router.get('/:id', requirePermission('appointments.read', 'screens.flowBoard.read', 'screens.flowBoard.full'), appointmentController.findById);
router.put('/:id', requirePermission('appointments.update', 'screens.flowBoard.full'), appointmentController.update);
router.patch('/:id/status', requirePermission('screens.flowBoard.full'), appointmentController.updateStatus);
router.patch('/:id/confirmation', requirePermission('screens.flowBoard.full'), appointmentController.updateConfirmation);
router.delete('/:id', requirePermission('appointments.delete', 'screens.flowBoard.full'), appointmentController.delete);

export default router;
