import express from 'express';
import { authenticate } from '../middlewares/auth';
import { profileController } from '../controllers/profileController';

const router = express.Router();

// Apply authentication to all routes
// No special permissions needed - users can only access their own profile
router.use(authenticate);

// Profile routes
router.get('/', profileController.getMyProfile);
router.put('/', profileController.updateMyProfile);

// Preferences routes
router.get('/preferences', profileController.getMyPreferences);
router.put('/preferences', profileController.updateMyPreferences);
router.delete('/preferences', profileController.resetMyPreferences);

export default router;
