/**
 * Form Service
 * Handles form template operations and variable replacement
 */

import prisma from '../config/database';
import { FormCategory, FormStatus, SignerType, Prisma } from '@prisma/client';

// Variable placeholders that can be used in templates
export const AVAILABLE_VARIABLES = [
  // Date variables
  { key: '{date}', labelEn: 'Current Date', labelAr: 'التاريخ الحالي', example: '2026-01-31' },
  { key: '{date.formatted}', labelEn: 'Formatted Date', labelAr: 'التاريخ منسق', example: '31 January 2026' },

  // Client variables
  { key: '{client.name}', labelEn: 'Client Name', labelAr: 'اسم العميل', example: 'Ahmed Mohammed' },
  { key: '{client.firstName}', labelEn: 'Client First Name', labelAr: 'الاسم الأول', example: 'Ahmed' },
  { key: '{client.lastName}', labelEn: 'Client Last Name', labelAr: 'الاسم الأخير', example: 'Mohammed' },
  { key: '{client.phone}', labelEn: 'Client Phone', labelAr: 'هاتف العميل', example: '+966501234567' },
  { key: '{client.email}', labelEn: 'Client Email', labelAr: 'إيميل العميل', example: 'ahmed@example.com' },
  { key: '{client.nationalId}', labelEn: 'Client National ID', labelAr: 'رقم الهوية', example: '1234567890' },
  { key: '{client.address}', labelEn: 'Client Address', labelAr: 'عنوان العميل', example: 'Riyadh, Saudi Arabia' },
  { key: '{client.code}', labelEn: 'Customer Code', labelAr: 'رمز العميل', example: 'C00000001' },

  // Pet variables
  { key: '{pet.name}', labelEn: 'Pet Name', labelAr: 'اسم الحيوان', example: 'Max' },
  { key: '{pet.species}', labelEn: 'Species', labelAr: 'النوع', example: 'Dog' },
  { key: '{pet.speciesAr}', labelEn: 'Species (Arabic)', labelAr: 'النوع بالعربي', example: 'كلب' },
  { key: '{pet.breed}', labelEn: 'Breed', labelAr: 'السلالة', example: 'Golden Retriever' },
  { key: '{pet.gender}', labelEn: 'Gender', labelAr: 'الجنس', example: 'Male' },
  { key: '{pet.genderAr}', labelEn: 'Gender (Arabic)', labelAr: 'الجنس بالعربي', example: 'ذكر' },
  { key: '{pet.age}', labelEn: 'Pet Age', labelAr: 'العمر', example: '3 years' },
  { key: '{pet.color}', labelEn: 'Pet Color', labelAr: 'اللون', example: 'Golden' },
  { key: '{pet.weight}', labelEn: 'Pet Weight', labelAr: 'الوزن', example: '25 kg' },
  { key: '{pet.microchip}', labelEn: 'Microchip ID', labelAr: 'رقم الشريحة', example: '123456789012345' },
  { key: '{pet.code}', labelEn: 'Pet Code', labelAr: 'رمز الحيوان', example: 'P00000001' },

  // Vet variables
  { key: '{vet.name}', labelEn: 'Vet Name', labelAr: 'اسم الطبيب', example: 'Dr. Sarah' },
  { key: '{vet.fullName}', labelEn: 'Vet Full Name', labelAr: 'الاسم الكامل للطبيب', example: 'Dr. Sarah Ahmed' },

  // Clinic variables
  { key: '{clinic.name}', labelEn: 'Clinic Name', labelAr: 'اسم العيادة', example: "Fluff N' Woof" },
  { key: '{clinic.phone}', labelEn: 'Clinic Phone', labelAr: 'هاتف العيادة', example: '+966112345678' },

  // Appointment variables
  { key: '{appointment.date}', labelEn: 'Appointment Date', labelAr: 'تاريخ الموعد', example: '2026-02-01' },
  { key: '{appointment.time}', labelEn: 'Appointment Time', labelAr: 'وقت الموعد', example: '10:00' },
  { key: '{appointment.reason}', labelEn: 'Visit Reason', labelAr: 'سبب الزيارة', example: 'General Checkup' },
];

// Species translations
const speciesTranslations: Record<string, string> = {
  DOG: 'كلب',
  CAT: 'قطة',
  BIRD: 'طائر',
  RABBIT: 'أرنب',
  HAMSTER: 'هامستر',
  GUINEA_PIG: 'خنزير غينيا',
  TURTLE: 'سلحفاة',
  FISH: 'سمكة',
  HORSE: 'حصان',
  GOAT: 'ماعز',
  SHEEP: 'خروف',
  COW: 'بقرة',
  CAMEL: 'جمل',
  DONKEY: 'حمار',
  MONKEY: 'قرد',
  FERRET: 'فيريت',
  HEDGEHOG: 'قنفذ',
  SNAKE: 'ثعبان',
  LIZARD: 'سحلية',
  FROG: 'ضفدع',
  CHICKEN: 'دجاجة',
  DUCK: 'بطة',
  PIG: 'خنزير',
  ALPACA: 'ألبكة',
  OTHER: 'أخرى',
};

// Gender translations
const genderTranslations: Record<string, string> = {
  MALE: 'ذكر',
  FEMALE: 'أنثى',
};

interface PetWithOwner {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  gender: string;
  birthDate: Date | null;
  color: string | null;
  weight: number | null;
  microchipId: string | null;
  petCode: string;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    nationalId: string | null;
    address: string | null;
    customerCode: string;
  };
}

interface VetInfo {
  id: string;
  firstName: string;
  lastName: string;
}

interface AppointmentInfo {
  appointmentDate: Date;
  appointmentTime: string;
  reason: string | null;
}

/**
 * Calculate pet age from birth date
 */
function calculatePetAge(birthDate: Date | null): string {
  if (!birthDate) return 'Unknown';

  const now = new Date();
  const birth = new Date(birthDate);
  const diffMs = now.getTime() - birth.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);

  if (years > 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  } else {
    return 'Newborn';
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export const formService = {
  /**
   * Get all available variables for templates
   */
  getAvailableVariables() {
    return AVAILABLE_VARIABLES;
  },

  /**
   * Fill template content with actual values
   */
  fillTemplateVariables(
    content: string,
    pet: PetWithOwner,
    vet?: VetInfo | null,
    appointment?: AppointmentInfo | null
  ): string {
    const now = new Date();

    const variables: Record<string, string> = {
      // Date
      '{date}': formatDate(now),
      '{date.formatted}': formatDateLong(now),

      // Client
      '{client.name}': `${pet.owner.firstName} ${pet.owner.lastName}`,
      '{client.firstName}': pet.owner.firstName,
      '{client.lastName}': pet.owner.lastName,
      '{client.phone}': pet.owner.phone,
      '{client.email}': pet.owner.email || '',
      '{client.nationalId}': pet.owner.nationalId || '',
      '{client.address}': pet.owner.address || '',
      '{client.code}': pet.owner.customerCode,

      // Pet
      '{pet.name}': pet.name,
      '{pet.species}': pet.species,
      '{pet.speciesAr}': speciesTranslations[pet.species] || pet.species,
      '{pet.breed}': pet.breed || '',
      '{pet.gender}': pet.gender,
      '{pet.genderAr}': genderTranslations[pet.gender] || pet.gender,
      '{pet.age}': calculatePetAge(pet.birthDate),
      '{pet.color}': pet.color || '',
      '{pet.weight}': pet.weight ? `${pet.weight} kg` : '',
      '{pet.microchip}': pet.microchipId || '',
      '{pet.code}': pet.petCode,

      // Vet
      '{vet.name}': vet ? `Dr. ${vet.firstName}` : '',
      '{vet.fullName}': vet ? `Dr. ${vet.firstName} ${vet.lastName}` : '',

      // Clinic (can be made configurable later)
      '{clinic.name}': "Fluff N' Woof",
      '{clinic.phone}': '+966112345678',

      // Appointment
      '{appointment.date}': appointment ? formatDate(appointment.appointmentDate) : '',
      '{appointment.time}': appointment?.appointmentTime || '',
      '{appointment.reason}': appointment?.reason || '',
    };

    let filledContent = content;
    for (const [key, value] of Object.entries(variables)) {
      filledContent = filledContent.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    }

    return filledContent;
  },

  /**
   * Get all form templates
   */
  async getTemplates(filters?: {
    category?: FormCategory;
    isActive?: boolean;
    search?: string;
  }) {
    const where: Prisma.FormTemplateWhereInput = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.search) {
      where.OR = [
        { nameEn: { contains: filters.search, mode: 'insensitive' } },
        { nameAr: { contains: filters.search } },
      ];
    }

    return prisma.formTemplate.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            petForms: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get template by ID
   */
  async getTemplateById(id: string) {
    return prisma.formTemplate.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Create new template
   */
  async createTemplate(data: {
    nameEn: string;
    nameAr: string;
    contentEn: string;
    contentAr: string;
    category: FormCategory;
    requiresClientSignature: boolean;
    requiresVetSignature: boolean;
    createdBy: string;
    headerLogoUrl?: string;
    footerText?: string;
  }) {
    return prisma.formTemplate.create({
      data,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Update template
   */
  async updateTemplate(
    id: string,
    data: Partial<{
      nameEn: string;
      nameAr: string;
      contentEn: string;
      contentAr: string;
      category: FormCategory;
      requiresClientSignature: boolean;
      requiresVetSignature: boolean;
      isActive: boolean;
      headerLogoUrl: string;
      footerText: string;
    }>
  ) {
    return prisma.formTemplate.update({
      where: { id },
      data,
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Delete template (soft delete by setting isActive = false)
   */
  async deleteTemplate(id: string) {
    return prisma.formTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  },

  /**
   * Get pet forms
   */
  async getPetForms(petId: string, appointmentId?: string) {
    return prisma.petForm.findMany({
      where: {
        petId,
        ...(appointmentId ? { appointmentId } : {}),
      },
      include: {
        template: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            category: true,
            requiresClientSignature: true,
            requiresVetSignature: true,
          },
        },
        signatures: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Get form by ID
   */
  async getFormById(id: string) {
    return prisma.petForm.findUnique({
      where: { id },
      include: {
        template: true,
        pet: {
          include: {
            owner: true,
          },
        },
        appointment: true,
        signatures: true,
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  /**
   * Attach form to pet (create PetForm with filled content)
   */
  async attachFormToPet(data: {
    templateId: string;
    petId: string;
    appointmentId?: string;
    createdBy: string;
    vetId?: string;
  }) {
    // Get template
    const template = await prisma.formTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Get pet with owner
    const pet = await prisma.pet.findUnique({
      where: { id: data.petId },
      include: { owner: true },
    });

    if (!pet) {
      throw new Error('Pet not found');
    }

    // Get vet if provided
    let vet = null;
    if (data.vetId) {
      vet = await prisma.user.findUnique({
        where: { id: data.vetId },
        select: { id: true, firstName: true, lastName: true },
      });
    }

    // Get appointment if provided
    let appointment = null;
    if (data.appointmentId) {
      appointment = await prisma.appointment.findUnique({
        where: { id: data.appointmentId },
        select: { appointmentDate: true, appointmentTime: true, reason: true },
      });
    }

    // Fill template content with actual values
    const filledContentEn = this.fillTemplateVariables(
      template.contentEn,
      pet as PetWithOwner,
      vet,
      appointment
    );

    const filledContentAr = this.fillTemplateVariables(
      template.contentAr,
      pet as PetWithOwner,
      vet,
      appointment
    );

    // Determine initial status
    let status: FormStatus = 'DRAFT';
    if (template.requiresClientSignature) {
      status = 'PENDING_CLIENT';
    } else if (template.requiresVetSignature) {
      status = 'PENDING_VET';
    }

    // Create pet form
    return prisma.petForm.create({
      data: {
        templateId: data.templateId,
        petId: data.petId,
        appointmentId: data.appointmentId,
        filledContentEn,
        filledContentAr,
        status,
        createdBy: data.createdBy,
        // Set expiry to 7 days from now
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      include: {
        template: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            category: true,
            requiresClientSignature: true,
            requiresVetSignature: true,
          },
        },
        pet: {
          include: { owner: true },
        },
        signatures: true,
      },
    });
  },

  /**
   * Add signature to form
   */
  async signForm(data: {
    petFormId: string;
    signerType: SignerType;
    signerName: string;
    signerId?: string;
    signatureData: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    // Get the form with template
    const form = await prisma.petForm.findUnique({
      where: { id: data.petFormId },
      include: { template: true, signatures: true },
    });

    if (!form) {
      throw new Error('Form not found');
    }

    // Check if form is expired
    if (form.expiresAt && form.expiresAt < new Date()) {
      throw new Error('Form has expired');
    }

    // Create signature
    const signature = await prisma.formSignature.create({
      data: {
        petFormId: data.petFormId,
        signerType: data.signerType,
        signerName: data.signerName,
        signerId: data.signerId,
        signatureData: data.signatureData,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });

    // Determine new form status
    const allSignatures = [...form.signatures, signature];
    const hasClientSignature = allSignatures.some(s => s.signerType === 'CLIENT');
    const hasVetSignature = allSignatures.some(s => s.signerType === 'VET');

    let newStatus: FormStatus = form.status;

    if (form.template.requiresClientSignature && form.template.requiresVetSignature) {
      if (hasClientSignature && hasVetSignature) {
        newStatus = 'COMPLETED';
      } else if (hasClientSignature) {
        newStatus = 'PENDING_VET';
      }
    } else if (form.template.requiresClientSignature && hasClientSignature) {
      newStatus = 'COMPLETED';
    } else if (form.template.requiresVetSignature && hasVetSignature) {
      newStatus = 'COMPLETED';
    }

    // Update form status
    if (newStatus !== form.status) {
      await prisma.petForm.update({
        where: { id: data.petFormId },
        data: {
          status: newStatus,
          completedAt: newStatus === 'COMPLETED' ? new Date() : null,
        },
      });
    }

    return signature;
  },

  /**
   * Update form notification status
   */
  async updateFormNotificationStatus(
    formId: string,
    method: 'EMAIL' | 'PORTAL' | 'BOTH'
  ) {
    return prisma.petForm.update({
      where: { id: formId },
      data: {
        notificationSentAt: new Date(),
        notificationMethod: method,
        status: 'PENDING_CLIENT',
      },
    });
  },

  /**
   * Get customer's pending forms
   */
  async getCustomerPendingForms(ownerId: string) {
    const pets = await prisma.pet.findMany({
      where: { ownerId },
      select: { id: true },
    });

    const petIds = pets.map(p => p.id);

    return prisma.petForm.findMany({
      where: {
        petId: { in: petIds },
        status: 'PENDING_CLIENT',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        template: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            category: true,
          },
        },
        pet: {
          select: {
            id: true,
            name: true,
            petCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};

export default formService;
