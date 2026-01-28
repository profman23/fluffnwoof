import { Router } from 'express';
import { whatsappController } from '../controllers/whatsappController';
import { authenticate, requireScreenModify } from '../middlewares/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Test connection
router.get('/test', requireScreenModify('sms'), whatsappController.testConnection);

// Get templates
router.get('/templates', requireScreenModify('sms'), whatsappController.getTemplates);

// Send text message
router.post('/send', requireScreenModify('sms'), whatsappController.sendMessage);

// Send template message
router.post('/send-template', requireScreenModify('sms'), whatsappController.sendTemplate);

export default router;
