import { Router } from 'express';
import { medicalRecordController } from '../controllers/medicalRecordController';
import { authenticate, requireScreenAccess, requireScreenModify } from '../middlewares/auth';
import { auditMiddleware } from '../middlewares/auditMiddleware';

const router = Router();

router.use(authenticate);
router.use(auditMiddleware('MedicalRecord'));

// Read operations - requireScreenAccess allows both 'read' and 'full' levels
router.get('/', requireScreenAccess('medical'), medicalRecordController.findAll);
router.get('/appointment/:appointmentId', requireScreenAccess('medical'), medicalRecordController.findByAppointmentId);
router.get('/pet/:petId', requireScreenAccess('medical'), medicalRecordController.findByPetId);
router.get('/:id/audit', requireScreenAccess('medical'), medicalRecordController.getAuditLog);
router.get('/:id', requireScreenAccess('medical'), medicalRecordController.findById);

// Write operations - requireScreenModify requires 'full' level only
router.post('/', requireScreenModify('medical'), medicalRecordController.create);
router.post('/appointment/:appointmentId', requireScreenModify('medical'), medicalRecordController.getOrCreateForAppointment);
// Close/Reopen routes MUST be before /:id to avoid conflicts
router.patch('/:id/close', requireScreenModify('medical'), medicalRecordController.closeRecord);
router.patch('/:id/reopen', requireScreenModify('medical'), medicalRecordController.reopenRecord);
router.patch('/:id', requireScreenModify('medical'), medicalRecordController.update);
router.delete('/:id', requireScreenModify('medical'), medicalRecordController.delete);

export default router;
