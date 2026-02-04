/**
 * Public Form Routes
 * API endpoints for form signing without authentication
 * Used when clients sign forms from email links
 */

import { Router } from 'express';
import { Request, Response } from 'express';
import { formService } from '../services/formService';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/public/forms/:formId
 * Get form details for signing (public access)
 */
router.get('/:formId', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;

    const form = await formService.getFormById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
        errorAr: 'النموذج غير موجود',
      });
    }

    // Check if form is expired
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Form has expired',
        errorAr: 'انتهت صلاحية النموذج',
      });
    }

    // Check if form is cancelled
    if (form.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Form has been cancelled',
        errorAr: 'تم إلغاء النموذج',
      });
    }

    // Return limited form data for public access
    const clientSignature = form.signatures?.find(s => s.signerType === 'CLIENT');
    const vetSignature = form.signatures?.find(s => s.signerType === 'VET');

    res.json({
      success: true,
      data: {
        id: form.id,
        status: form.status,
        contentEn: form.filledContentEn,
        contentAr: form.filledContentAr,
        createdAt: form.createdAt,
        expiresAt: form.expiresAt,
        template: {
          nameEn: form.template.nameEn,
          nameAr: form.template.nameAr,
          category: form.template.category,
          requiresClientSignature: form.template.requiresClientSignature,
          requiresVetSignature: form.template.requiresVetSignature,
        },
        pet: {
          name: form.pet.name,
        },
        owner: {
          firstName: form.pet.owner.firstName,
          lastName: form.pet.owner.lastName,
        },
        clientSigned: !!clientSignature,
        clientSignedAt: clientSignature?.signedAt,
        vetSigned: !!vetSignature,
        vetSignedAt: vetSignature?.signedAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch form',
      errorAr: 'فشل في جلب النموذج',
    });
  }
});

/**
 * POST /api/public/forms/:formId/sign
 * Sign form publicly (from email link)
 */
router.post('/:formId/sign', async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        error: 'Signature data is required',
        errorAr: 'بيانات التوقيع مطلوبة',
      });
    }

    // Get form with pet and owner info
    const form = await formService.getFormById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
        errorAr: 'النموذج غير موجود',
      });
    }

    // Check if form is expired
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Form has expired',
        errorAr: 'انتهت صلاحية النموذج',
      });
    }

    // Check if form is cancelled
    if (form.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: 'Form has been cancelled',
        errorAr: 'تم إلغاء النموذج',
      });
    }

    // Check if client already signed
    const clientAlreadySigned = form.signatures?.some(s => s.signerType === 'CLIENT');
    if (clientAlreadySigned) {
      return res.status(400).json({
        success: false,
        error: 'Form already signed',
        errorAr: 'النموذج موقّع بالفعل',
      });
    }

    // Check if form requires client signature
    if (!form.template.requiresClientSignature) {
      return res.status(400).json({
        success: false,
        error: 'This form does not require client signature',
        errorAr: 'هذا النموذج لا يتطلب توقيع العميل',
      });
    }

    const owner = form.pet.owner;

    const signature = await formService.signForm({
      petFormId: formId,
      signerType: 'CLIENT',
      signerName: `${owner.firstName} ${owner.lastName}`,
      signerId: owner.id,
      signatureData,
      ipAddress: req.ip,
      userAgent: `Email Signature - ${req.headers['user-agent']}`,
    });

    res.json({
      success: true,
      data: {
        signedAt: signature.signedAt,
        signerName: signature.signerName,
      },
      message: 'Form signed successfully',
      messageAr: 'تم توقيع النموذج بنجاح',
    });
  } catch (error: any) {
    console.error('Error signing form publicly:', error);

    if (error.message === 'Form has expired') {
      return res.status(400).json({
        success: false,
        error: 'Form has expired',
        errorAr: 'انتهت صلاحية النموذج',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to sign form',
      errorAr: 'فشل في توقيع النموذج',
    });
  }
});

export default router;
