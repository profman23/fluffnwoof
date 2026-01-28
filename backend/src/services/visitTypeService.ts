import prisma from '../config/database';
import { VisitTypeConfig } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

export interface VisitTypeInput {
  code?: string;
  nameEn: string;
  nameAr: string;
  duration: number;
  color?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// Default visit types (matching existing VisitType enum)
const DEFAULT_VISIT_TYPES: VisitTypeInput[] = [
  { code: 'GENERAL_CHECKUP', nameEn: 'General Checkup', nameAr: 'فحص عام', duration: 30, color: '#3B82F6' },
  { code: 'VACCINATION', nameEn: 'Vaccination', nameAr: 'تطعيم', duration: 15, color: '#10B981' },
  { code: 'GROOMING', nameEn: 'Grooming', nameAr: 'تجميل', duration: 60, color: '#F59E0B' },
  { code: 'SURGERY', nameEn: 'Surgery', nameAr: 'جراحة', duration: 120, color: '#EF4444' },
  { code: 'EMERGENCY', nameEn: 'Emergency', nameAr: 'طوارئ', duration: 45, color: '#DC2626' },
];

export const visitTypeService = {
  // Get all visit types
  async getAll(includeInactive: boolean = false): Promise<VisitTypeConfig[]> {
    const where = includeInactive ? {} : { isActive: true };

    return prisma.visitTypeConfig.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { nameEn: 'asc' }],
    });
  },

  // Get visit type by ID
  async getById(id: string): Promise<VisitTypeConfig | null> {
    return prisma.visitTypeConfig.findUnique({
      where: { id },
    });
  },

  // Get visit type by code
  async getByCode(code: string): Promise<VisitTypeConfig | null> {
    return prisma.visitTypeConfig.findUnique({
      where: { code },
    });
  },

  // Create a new visit type
  async create(data: VisitTypeInput): Promise<VisitTypeConfig> {
    // Generate a unique code if not provided
    const code = data.code || `CUSTOM_${Date.now()}`;

    // Check if code already exists
    const existing = await prisma.visitTypeConfig.findUnique({
      where: { code },
    });

    if (existing) {
      throw new AppError('Visit type code already exists', 400, 'CODE_EXISTS');
    }

    // Get max sort order
    const maxOrder = await prisma.visitTypeConfig.aggregate({
      _max: { sortOrder: true },
    });
    const sortOrder = data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1;

    return prisma.visitTypeConfig.create({
      data: {
        code,
        nameEn: data.nameEn,
        nameAr: data.nameAr,
        duration: data.duration,
        color: data.color || '#3B82F6',
        isActive: data.isActive ?? true,
        isSystem: false,
        sortOrder,
      },
    });
  },

  // Update a visit type
  async update(id: string, data: Partial<VisitTypeInput>): Promise<VisitTypeConfig> {
    const existing = await prisma.visitTypeConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Visit type not found', 404);
    }

    // Don't allow changing code for system types
    if (existing.isSystem && data.code && data.code !== existing.code) {
      throw new AppError('Cannot change code for system visit types', 400);
    }

    return prisma.visitTypeConfig.update({
      where: { id },
      data: {
        ...(data.nameEn && { nameEn: data.nameEn }),
        ...(data.nameAr && { nameAr: data.nameAr }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.color && { color: data.color }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean): Promise<VisitTypeConfig> {
    const existing = await prisma.visitTypeConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Visit type not found', 404);
    }

    return prisma.visitTypeConfig.update({
      where: { id },
      data: { isActive },
    });
  },

  // Delete a visit type (only non-system types)
  async delete(id: string): Promise<void> {
    const existing = await prisma.visitTypeConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Visit type not found', 404);
    }

    if (existing.isSystem) {
      throw new AppError('Cannot delete system visit types. You can deactivate them instead.', 400);
    }

    await prisma.visitTypeConfig.delete({
      where: { id },
    });
  },

  // Reorder visit types
  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      prisma.visitTypeConfig.update({
        where: { id },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);
  },

  // Seed default visit types (called on app startup or manually)
  async seedDefaults(): Promise<void> {
    for (const type of DEFAULT_VISIT_TYPES) {
      await prisma.visitTypeConfig.upsert({
        where: { code: type.code! },
        update: {}, // Don't update if exists
        create: {
          code: type.code!,
          nameEn: type.nameEn,
          nameAr: type.nameAr,
          duration: type.duration,
          color: type.color || '#3B82F6',
          isActive: true,
          isSystem: true, // Mark as system type
          sortOrder: DEFAULT_VISIT_TYPES.indexOf(type),
        },
      });
    }
  },

  // Get duration for a visit type code (for backward compatibility with enum)
  async getDurationByCode(code: string): Promise<number> {
    const visitType = await this.getByCode(code);
    return visitType?.duration || 30; // Default to 30 minutes
  },
};
