/**
 * Form Controller
 * Handles form template and pet form operations
 */

import { Request, Response } from 'express';
import { formService } from '../services/formService';
import { emailService } from '../services/emailService';
import { FormCategory, SignerType } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from '../types';

/**
 * Get the primary frontend URL (first one if multiple are configured)
 */
const getFrontendUrl = (): string => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  // If multiple URLs are configured (comma-separated), use the first one
  if (frontendUrl.includes(',')) {
    return frontendUrl.split(',')[0].trim();
  }
  return frontendUrl;
};

/**
 * Get all form templates
 */
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { category, isActive, search } = req.query;

    const templates = await formService.getTemplates({
      category: category as FormCategory | undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get templates',
      errorAr: 'فشل في جلب القوالب',
    });
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await formService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        errorAr: 'القالب غير موجود',
      });
    }

    res.json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get template',
      errorAr: 'فشل في جلب القالب',
    });
  }
};

/**
 * Create new template
 */
export const createTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        errorAr: 'غير مصرح',
      });
    }

    const {
      nameEn,
      nameAr,
      contentEn,
      contentAr,
      category,
      requiresClientSignature,
      requiresVetSignature,
      headerLogoUrl,
      footerText,
    } = req.body;

    // Validation
    if (!nameEn || !nameAr || !contentEn || !contentAr) {
      return res.status(400).json({
        success: false,
        error: 'Name and content are required in both languages',
        errorAr: 'الاسم والمحتوى مطلوبان باللغتين',
      });
    }

    const template = await formService.createTemplate({
      nameEn,
      nameAr,
      contentEn,
      contentAr,
      category: category || 'OTHER',
      requiresClientSignature: requiresClientSignature ?? true,
      requiresVetSignature: requiresVetSignature ?? true,
      createdBy: userId,
      headerLogoUrl,
      footerText,
    });

    res.status(201).json({
      success: true,
      data: template,
      message: 'Template created successfully',
      messageAr: 'تم إنشاء القالب بنجاح',
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create template',
      errorAr: 'فشل في إنشاء القالب',
    });
  }
};

/**
 * Update template
 */
export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      nameEn,
      nameAr,
      contentEn,
      contentAr,
      category,
      requiresClientSignature,
      requiresVetSignature,
      isActive,
      headerLogoUrl,
      footerText,
    } = req.body;

    // Check if template exists
    const existing = await formService.getTemplateById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        errorAr: 'القالب غير موجود',
      });
    }

    const template = await formService.updateTemplate(id, {
      nameEn,
      nameAr,
      contentEn,
      contentAr,
      category,
      requiresClientSignature,
      requiresVetSignature,
      isActive,
      headerLogoUrl,
      footerText,
    });

    res.json({
      success: true,
      data: template,
      message: 'Template updated successfully',
      messageAr: 'تم تحديث القالب بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update template',
      errorAr: 'فشل في تحديث القالب',
    });
  }
};

/**
 * Delete template (soft delete)
 */
export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if template exists
    const existing = await formService.getTemplateById(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        errorAr: 'القالب غير موجود',
      });
    }

    await formService.deleteTemplate(id);

    res.json({
      success: true,
      message: 'Template deleted successfully',
      messageAr: 'تم حذف القالب بنجاح',
    });
  } catch (error: any) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete template',
      errorAr: 'فشل في حذف القالب',
    });
  }
};

/**
 * Get available variables for templates
 */
export const getAvailableVariables = async (req: Request, res: Response) => {
  try {
    const variables = formService.getAvailableVariables();
    res.json({
      success: true,
      data: variables,
    });
  } catch (error: any) {
    console.error('Error getting variables:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get variables',
      errorAr: 'فشل في جلب المتغيرات',
    });
  }
};

/**
 * Get pet forms
 */
export const getPetForms = async (req: Request, res: Response) => {
  try {
    const { petId } = req.params;
    const { appointmentId } = req.query;

    const forms = await formService.getPetForms(petId, appointmentId as string | undefined);

    res.json({
      success: true,
      data: forms,
    });
  } catch (error: any) {
    console.error('Error getting pet forms:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pet forms',
      errorAr: 'فشل في جلب نماذج الحيوان',
    });
  }
};

/**
 * Get form by ID
 */
export const getFormById = async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: form,
    });
  } catch (error: any) {
    console.error('Error getting form:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get form',
      errorAr: 'فشل في جلب النموذج',
    });
  }
};

/**
 * Attach form to pet
 */
export const attachFormToPet = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        errorAr: 'غير مصرح',
      });
    }

    const { petId } = req.params;
    const { templateId, appointmentId, vetId } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'Template ID is required',
        errorAr: 'معرف القالب مطلوب',
      });
    }

    const form = await formService.attachFormToPet({
      templateId,
      petId,
      appointmentId,
      createdBy: userId,
      vetId,
    });

    res.status(201).json({
      success: true,
      data: form,
      message: 'Form attached successfully',
      messageAr: 'تم إرفاق النموذج بنجاح',
    });
  } catch (error: any) {
    console.error('Error attaching form:', error);

    if (error.message === 'Template not found') {
      return res.status(404).json({
        success: false,
        error: 'Template not found',
        errorAr: 'القالب غير موجود',
      });
    }

    if (error.message === 'Pet not found') {
      return res.status(404).json({
        success: false,
        error: 'Pet not found',
        errorAr: 'الحيوان غير موجود',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to attach form',
      errorAr: 'فشل في إرفاق النموذج',
    });
  }
};

/**
 * Send form notification to client
 */
export const sendFormNotification = async (req: Request, res: Response) => {
  try {
    const { formId } = req.params;
    const { method = 'BOTH' } = req.body; // EMAIL, PORTAL, or BOTH

    // Get form with pet and owner
    const form = await formService.getFormById(formId);

    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
        errorAr: 'النموذج غير موجود',
      });
    }

    // Check if client already signed
    const clientAlreadySigned = form.signatures?.some(s => s.signerType === 'CLIENT');
    if (clientAlreadySigned) {
      return res.status(400).json({
        success: false,
        error: 'Form already signed by client',
        errorAr: 'النموذج موقّع بالفعل من قبل العميل',
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
    // Use public sign page (no login required)
    const portalUrl = `${getFrontendUrl()}/sign/${formId}`;

    // Send email notification if method is EMAIL or BOTH
    if ((method === 'EMAIL' || method === 'BOTH') && owner.email) {
      try {
        await emailService.sendFormNotificationEmail({
          ownerEmail: owner.email,
          ownerName: `${owner.firstName} ${owner.lastName}`,
          petName: form.pet.name,
          formName: form.template.nameEn,
          formNameAr: form.template.nameAr,
          signUrl: portalUrl,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    // Create portal notification if method is PORTAL or BOTH
    if (method === 'PORTAL' || method === 'BOTH') {
      await prisma.customerNotification.create({
        data: {
          ownerId: owner.id,
          type: 'FORM_PENDING',
          titleEn: `New form requires your signature`,
          titleAr: `نموذج جديد يحتاج توقيعك`,
          messageEn: `Please sign the "${form.template.nameEn}" form for ${form.pet.name}`,
          messageAr: `يرجى توقيع نموذج "${form.template.nameAr}" لـ ${form.pet.name}`,
          petFormId: formId,
        },
      });
    }

    // Update form notification status
    await formService.updateFormNotificationStatus(formId, method);

    res.json({
      success: true,
      message: 'Notification sent successfully',
      messageAr: 'تم إرسال الإشعار بنجاح',
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification',
      errorAr: 'فشل في إرسال الإشعار',
    });
  }
};

/**
 * Sign form as staff (vet)
 */
export const signFormAsStaff = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        errorAr: 'غير مصرح',
      });
    }

    const { formId } = req.params;
    const { signatureData } = req.body;

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        error: 'Signature data is required',
        errorAr: 'بيانات التوقيع مطلوبة',
      });
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        errorAr: 'المستخدم غير موجود',
      });
    }

    const signature = await formService.signForm({
      petFormId: formId,
      signerType: 'VET',
      signerName: `Dr. ${user.firstName} ${user.lastName}`,
      signerId: userId,
      signatureData,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.json({
      success: true,
      data: signature,
      message: 'Form signed successfully',
      messageAr: 'تم توقيع النموذج بنجاح',
    });
  } catch (error: any) {
    console.error('Error signing form:', error);

    if (error.message === 'Form not found') {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
        errorAr: 'النموذج غير موجود',
      });
    }

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
};

/**
 * Sign form as client (from tablet in clinic)
 * Used when client signs on doctor's tablet during visit
 */
export const signFormAsClient = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        errorAr: 'غير مصرح',
      });
    }

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

    const owner = form.pet.owner;

    const signature = await formService.signForm({
      petFormId: formId,
      signerType: 'CLIENT',
      signerName: `${owner.firstName} ${owner.lastName}`,
      signerId: owner.id,
      signatureData,
      ipAddress: req.ip,
      userAgent: `Tablet Signature - ${req.headers['user-agent']}`,
    });

    res.json({
      success: true,
      data: signature,
      message: 'Form signed successfully by client',
      messageAr: 'تم توقيع النموذج بنجاح من قبل العميل',
    });
  } catch (error: any) {
    console.error('Error signing form as client:', error);

    if (error.message === 'Form not found') {
      return res.status(404).json({
        success: false,
        error: 'Form not found',
        errorAr: 'النموذج غير موجود',
      });
    }

    if (error.message === 'Form has expired') {
      return res.status(400).json({
        success: false,
        error: 'Form has expired',
        errorAr: 'انتهت صلاحية النموذج',
      });
    }

    if (error.message === 'Already signed by client') {
      return res.status(400).json({
        success: false,
        error: 'Form already signed by client',
        errorAr: 'النموذج موقع بالفعل من قبل العميل',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to sign form',
      errorAr: 'فشل في توقيع النموذج',
    });
  }
};

/**
 * Preview template with sample data
 */
export const previewTemplate = async (req: Request, res: Response) => {
  try {
    const { contentEn, contentAr } = req.body;

    // Sample data for preview
    const samplePet = {
      id: 'sample',
      name: 'Max',
      species: 'DOG',
      breed: 'Golden Retriever',
      gender: 'MALE',
      birthDate: new Date('2023-05-15'),
      color: 'Golden',
      weight: 25,
      microchipId: '123456789012345',
      petCode: 'P00000001',
      owner: {
        id: 'sample',
        firstName: 'Ahmed',
        lastName: 'Mohammed',
        phone: '+966501234567',
        email: 'ahmed@example.com',
        nationalId: '1234567890',
        address: 'Riyadh, Saudi Arabia',
        customerCode: 'C00000001',
      },
    };

    const sampleVet = {
      id: 'sample',
      firstName: 'Sarah',
      lastName: 'Ahmed',
    };

    const sampleAppointment = {
      appointmentDate: new Date(),
      appointmentTime: '10:00',
      reason: 'General Checkup',
    };

    const filledContentEn = formService.fillTemplateVariables(
      contentEn || '',
      samplePet,
      sampleVet,
      sampleAppointment
    );

    const filledContentAr = formService.fillTemplateVariables(
      contentAr || '',
      samplePet,
      sampleVet,
      sampleAppointment
    );

    res.json({
      success: true,
      data: {
        contentEn: filledContentEn,
        contentAr: filledContentAr,
      },
    });
  } catch (error: any) {
    console.error('Error previewing template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to preview template',
      errorAr: 'فشل في معاينة القالب',
    });
  }
};

export default {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAvailableVariables,
  getPetForms,
  getFormById,
  attachFormToPet,
  sendFormNotification,
  signFormAsStaff,
  signFormAsClient,
  previewTemplate,
};
