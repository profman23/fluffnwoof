import express from 'express';
import { authenticate, requireScreenAccess } from '../middlewares/auth';
import { reportController } from '../controllers/reportController';

const router = express.Router();

router.use(authenticate);

// Get upcoming appointments report
router.get('/next-appointments', requireScreenAccess('nextAppointments'), reportController.getNextAppointments);

// Get sales report
router.get('/sales', requireScreenAccess('salesReport'), reportController.getSalesReport);

export default router;
