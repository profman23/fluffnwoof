import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Get all dashboard data at once
router.get('/', dashboardController.getDashboardData);

// Get stats only
router.get('/stats', dashboardController.getStats);

// Get upcoming appointments
router.get('/appointments', dashboardController.getUpcomingAppointments);

// Get upcoming vaccinations
router.get('/vaccinations', dashboardController.getUpcomingVaccinations);

export default router;
