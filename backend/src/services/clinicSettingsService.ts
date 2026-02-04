/**
 * Clinic Settings Service
 * Manages clinic form settings (logo, header, footer, signatures)
 */

import prisma from '../config/database';
import { ClinicFormSettings } from '@prisma/client';

export interface ClinicFormSettingsInput {
  logoUrl?: string;
  logoPosition?: string;
  clinicNameEn?: string;
  clinicNameAr?: string;
  addressEn?: string;
  addressAr?: string;
  phoneNumber?: string;
  fontSize?: number;
  showClientSignature?: boolean;
  clientSignatureLabelEn?: string;
  clientSignatureLabelAr?: string;
  showVetSignature?: boolean;
  vetSignatureLabelEn?: string;
  vetSignatureLabelAr?: string;
}

export const clinicSettingsService = {
  /**
   * Get form settings (creates default if not exists)
   */
  async getFormSettings(): Promise<ClinicFormSettings> {
    // Try to find existing settings
    let settings = await prisma.clinicFormSettings.findFirst();

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.clinicFormSettings.create({
        data: {}, // All fields have defaults
      });
    }

    return settings;
  },

  /**
   * Update form settings
   */
  async updateFormSettings(data: ClinicFormSettingsInput): Promise<ClinicFormSettings> {
    // Get or create settings first
    const existing = await this.getFormSettings();

    // Update with new data
    return prisma.clinicFormSettings.update({
      where: { id: existing.id },
      data: {
        logoUrl: data.logoUrl,
        logoPosition: data.logoPosition,
        clinicNameEn: data.clinicNameEn,
        clinicNameAr: data.clinicNameAr,
        addressEn: data.addressEn,
        addressAr: data.addressAr,
        phoneNumber: data.phoneNumber,
        fontSize: data.fontSize,
        showClientSignature: data.showClientSignature,
        clientSignatureLabelEn: data.clientSignatureLabelEn,
        clientSignatureLabelAr: data.clientSignatureLabelAr,
        showVetSignature: data.showVetSignature,
        vetSignatureLabelEn: data.vetSignatureLabelEn,
        vetSignatureLabelAr: data.vetSignatureLabelAr,
      },
    });
  },

  /**
   * Update logo URL
   */
  async updateLogo(logoUrl: string | null): Promise<ClinicFormSettings> {
    const existing = await this.getFormSettings();

    return prisma.clinicFormSettings.update({
      where: { id: existing.id },
      data: { logoUrl },
    });
  },

  /**
   * Remove logo
   */
  async removeLogo(): Promise<ClinicFormSettings> {
    return this.updateLogo(null);
  },
};

export default clinicSettingsService;
