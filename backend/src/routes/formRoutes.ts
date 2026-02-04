/**
 * Form Routes
 * API endpoints for form templates and pet forms
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../middlewares/auth';
import * as formController from '../controllers/formController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =====================================================
// TEMPLATES - إدارة قوالب النماذج
// =====================================================

/**
 * GET /api/forms/templates
 * Get all form templates
 * Query params: category, isActive, search
 */
router.get(
  '/templates',
  requirePermission('screens.formsAndCertificates.read'),
  formController.getTemplates
);

/**
 * GET /api/forms/templates/variables
 * Get available variables for templates
 */
router.get(
  '/templates/variables',
  requirePermission('screens.formsAndCertificates.read'),
  formController.getAvailableVariables
);

/**
 * GET /api/forms/templates/:id
 * Get single template by ID
 */
router.get(
  '/templates/:id',
  requirePermission('screens.formsAndCertificates.read'),
  formController.getTemplateById
);

/**
 * POST /api/forms/templates
 * Create new template
 */
router.post(
  '/templates',
  requirePermission('screens.formsAndCertificates.full'),
  formController.createTemplate
);

/**
 * POST /api/forms/templates/preview
 * Preview template with sample data
 */
router.post(
  '/templates/preview',
  requirePermission('screens.formsAndCertificates.read'),
  formController.previewTemplate
);

/**
 * PUT /api/forms/templates/:id
 * Update template
 */
router.put(
  '/templates/:id',
  requirePermission('screens.formsAndCertificates.full'),
  formController.updateTemplate
);

/**
 * DELETE /api/forms/templates/:id
 * Delete template (soft delete)
 */
router.delete(
  '/templates/:id',
  requirePermission('screens.formsAndCertificates.full'),
  formController.deleteTemplate
);

// =====================================================
// PET FORMS - النماذج المرفقة بالحيوانات
// =====================================================

/**
 * GET /api/forms/pet/:petId
 * Get all forms for a specific pet
 */
router.get(
  '/pet/:petId',
  formController.getPetForms
);

/**
 * POST /api/forms/pet/:petId/attach
 * Attach a form template to a pet
 */
router.post(
  '/pet/:petId/attach',
  formController.attachFormToPet
);

/**
 * GET /api/forms/:formId
 * Get single form by ID
 */
router.get(
  '/:formId',
  formController.getFormById
);

/**
 * POST /api/forms/:formId/send-notification
 * Send notification to client to sign form
 */
router.post(
  '/:formId/send-notification',
  formController.sendFormNotification
);

/**
 * POST /api/forms/:formId/sign
 * Sign form as staff (vet)
 */
router.post(
  '/:formId/sign',
  formController.signFormAsStaff
);

/**
 * POST /api/forms/:formId/sign-client
 * Sign form as client (from tablet in clinic)
 * Used when client signs on doctor's tablet during visit
 */
router.post(
  '/:formId/sign-client',
  formController.signFormAsClient
);

export default router;
