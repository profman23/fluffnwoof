/**
 * Clinic Settings Routes
 * API endpoints for clinic form settings
 */

import { Router } from 'express';
import multer from 'multer';
import { authenticate, requirePermission } from '../middlewares/auth';
import { clinicLogoStorage } from '../config/cloudinary';
import * as clinicSettingsController from '../controllers/clinicSettingsController';

const router = Router();

// Logo upload configuration
const logoUpload = multer({
  storage: clinicLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, WebP and SVG are allowed.'));
    }
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/clinic-settings/forms
 * Get clinic form settings
 */
router.get(
  '/forms',
  requirePermission('screens.clinicSetup.read'),
  clinicSettingsController.getFormSettings
);

/**
 * PUT /api/clinic-settings/forms
 * Update clinic form settings
 */
router.put(
  '/forms',
  requirePermission('screens.clinicSetup.full'),
  clinicSettingsController.updateFormSettings
);

/**
 * POST /api/clinic-settings/forms/logo
 * Upload clinic logo
 */
router.post(
  '/forms/logo',
  requirePermission('screens.clinicSetup.full'),
  logoUpload.single('logo'),
  clinicSettingsController.uploadFormLogo
);

/**
 * DELETE /api/clinic-settings/forms/logo
 * Remove clinic logo
 */
router.delete(
  '/forms/logo',
  requirePermission('screens.clinicSetup.full'),
  clinicSettingsController.removeFormLogo
);

export default router;
