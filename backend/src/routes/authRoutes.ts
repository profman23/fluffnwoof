import { Router } from 'express';
import { authController } from '../controllers/authController';
import { registerValidator, loginValidator } from '../validators/authValidator';
import { validate } from '../middlewares/validate';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', registerValidator, validate, authController.register);
router.post('/login', loginValidator, validate, authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.get('/permissions', authenticate, authController.getMyPermissions);
router.post('/logout', authenticate, authController.logout);

export default router;
