import { Router } from 'express';
import { authenticate } from '../middlewares/auth';
import {
  getBalance,
  sendSms,
  getLogs,
  getMessageStatus,
} from '../controllers/smsController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get SMS balance
router.get('/balance', getBalance);

// Send SMS
router.post('/send', sendSms);

// Get SMS logs
router.get('/logs', getLogs);

// Get message status
router.get('/status/:messageId', getMessageStatus);

export default router;
