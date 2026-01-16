import express from 'express';
import { authenticate, requireScreenAccess } from '../middlewares/auth';
import { reportController } from '../controllers/reportController';

const router = express.Router();

router.use(authenticate);

// Get upcoming appointments report
router.get('/next-appointments', requireScreenAccess('reports'), reportController.getNextAppointments);

export default router;
