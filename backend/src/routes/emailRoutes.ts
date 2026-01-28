import { Router } from 'express';
import * as emailController from '../controllers/emailController';
import { authenticate, requireScreenAccess } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Test email connection
router.get('/test-connection', requireScreenAccess('reminders'), emailController.testConnection);

// Send test email
router.post('/send-test', requireScreenAccess('reminders'), emailController.sendTestEmail);

// Send appointment email
router.post('/send-appointment', requireScreenAccess('reminders'), emailController.sendAppointmentEmail);

export default router;
