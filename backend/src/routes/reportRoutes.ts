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

// Get lost customers report (pets whose last visit was in range and never returned)
router.get('/lost-customers', requireScreenAccess('lostCustomersReport'), reportController.getLostCustomersReport);

export default router;
