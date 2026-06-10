import express from 'express';
import { authenticate, requireScreenAccess } from '../middlewares/auth';
import { aiDiagnosisLimiter } from '../middlewares/rateLimiter';
import { aiDiagnosisController } from '../controllers/aiDiagnosisController';

const router = express.Router();

router.use(authenticate);

// Generate an AI clinical-decision-support assessment for the current visit.
router.post(
  '/assess',
  requireScreenAccess('aiDiagnosis'),
  aiDiagnosisLimiter,
  aiDiagnosisController.assess
);

export default router;
