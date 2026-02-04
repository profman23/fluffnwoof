/**
 * Clinic Settings Controller
 * Handles clinic form settings operations
 */

import { Request, Response } from 'express';
import { clinicSettingsService } from '../services/clinicSettingsService';
import { uploadService } from '../services/uploadService';

/**
 * Get form settings
 */
export const getFormSettings = async (req: Request, res: Response) => {
  try {
    const settings = await clinicSettingsService.getFormSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error('Error getting form settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get form settings',
      errorAr: 'فشل في جلب إعدادات النماذج',
    });
  }
};

/**
 * Update form settings
 */
export const updateFormSettings = async (req: Request, res: Response) => {
  try {
    const {
      logoPosition,
      clinicNameEn,
      clinicNameAr,
      addressEn,
      addressAr,
      phoneNumber,
      fontSize,
      showClientSignature,
      clientSignatureLabelEn,
      clientSignatureLabelAr,
      showVetSignature,
      vetSignatureLabelEn,
      vetSignatureLabelAr,
    } = req.body;

    const settings = await clinicSettingsService.updateFormSettings({
      logoPosition,
      clinicNameEn,
      clinicNameAr,
      addressEn,
      addressAr,
      phoneNumber,
      fontSize,
      showClientSignature,
      clientSignatureLabelEn,
      clientSignatureLabelAr,
      showVetSignature,
      vetSignatureLabelEn,
      vetSignatureLabelAr,
    });

    res.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
      messageAr: 'تم تحديث الإعدادات بنجاح',
    });
  } catch (error: any) {
    console.error('Error updating form settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update form settings',
      errorAr: 'فشل في تحديث إعدادات النماذج',
    });
  }
};

/**
 * Upload form logo
 */
export const uploadFormLogo = async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        errorAr: 'لم يتم رفع أي ملف',
      });
    }

    // Get the Cloudinary URL from multer
    const result = file as unknown as { path: string; filename: string };
    const logoUrl = result.path;

    // Get current settings to delete old logo if exists
    const currentSettings = await clinicSettingsService.getFormSettings();
    if (currentSettings.logoUrl) {
      try {
        await uploadService.deleteFile(currentSettings.logoUrl);
      } catch (err) {
        console.error('Failed to delete old logo:', err);
      }
    }

    // Update settings with new logo
    const settings = await clinicSettingsService.updateLogo(logoUrl);

    res.json({
      success: true,
      data: settings,
      message: 'Logo uploaded successfully',
      messageAr: 'تم رفع الشعار بنجاح',
    });
  } catch (error: any) {
    console.error('Error uploading logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload logo',
      errorAr: 'فشل في رفع الشعار',
    });
  }
};

/**
 * Remove form logo
 */
export const removeFormLogo = async (req: Request, res: Response) => {
  try {
    // Get current settings to delete logo from Cloudinary
    const currentSettings = await clinicSettingsService.getFormSettings();
    if (currentSettings.logoUrl) {
      try {
        await uploadService.deleteFile(currentSettings.logoUrl);
      } catch (err) {
        console.error('Failed to delete logo from storage:', err);
      }
    }

    // Remove logo from settings
    const settings = await clinicSettingsService.removeLogo();

    res.json({
      success: true,
      data: settings,
      message: 'Logo removed successfully',
      messageAr: 'تم حذف الشعار بنجاح',
    });
  } catch (error: any) {
    console.error('Error removing logo:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove logo',
      errorAr: 'فشل في حذف الشعار',
    });
  }
};

export default {
  getFormSettings,
  updateFormSettings,
  uploadFormLogo,
  removeFormLogo,
};
