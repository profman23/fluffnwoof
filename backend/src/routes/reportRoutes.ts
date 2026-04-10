import express from 'express';
import { authenticate, requireScreenAccess } from '../middlewares/auth';
import { reportController } from '../controllers/reportController';

const router = express.Router();

router.use(authenticate);

// Get upcoming appointments report
router.get('/next-appointments', requireScreenAccess('nextAppointments'), reportController.getNextAppointments);

// Get sales report
router.get('/sales', requireScreenAccess('salesReport'), reportController.getSalesReport);

// Get acquisition report (customer sources)
router.get('/acquisition', requireScreenAccess('acquisitionReport'), reportController.getAcquisitionReport);

export default router;
