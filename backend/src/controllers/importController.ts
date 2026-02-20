import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { importService, ImportRow } from '../services/importService';
import { AppError } from '../middlewares/errorHandler';
import { Species, Gender } from '@prisma/client';

const VALID_SPECIES = Object.values(Species);
const VALID_GENDERS = Object.values(Gender);

function validateRows(rows: any[]): { valid: ImportRow[]; errors: string[] } {
  const valid: ImportRow[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const rowErrors: string[] = [];

    if (!row?.owner?.firstName?.trim()) rowErrors.push('firstName required');
    if (!row?.owner?.lastName?.trim()) rowErrors.push('lastName required');
    if (!row?.owner?.phone?.trim()) rowErrors.push('phone required');
    if (!row?.pet?.name?.trim()) rowErrors.push('petName required');
    if (!row?.pet?.species) {
      rowErrors.push('species required');
    } else if (!VALID_SPECIES.includes(row.pet.species)) {
      rowErrors.push(`species invalid: ${row.pet.species}`);
    }
    if (!row?.pet?.gender) {
      rowErrors.push('gender required');
    } else if (!VALID_GENDERS.includes(row.pet.gender)) {
      rowErrors.push(`gender invalid: ${row.pet.gender}`);
    }

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`);
    } else {
      valid.push(row as ImportRow);
    }
  }

  return { valid, errors };
}

export const importController = {
  async clientsPets(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { rows } = req.body;

      if (!Array.isArray(rows) || rows.length === 0) {
        throw new AppError('No rows provided', 400, 'NO_ROWS');
      }

      if (rows.length > 1000) {
        throw new AppError('Maximum 1000 rows per import', 400, 'TOO_MANY_ROWS');
      }

      const { valid, errors: validationErrors } = validateRows(rows);

      if (valid.length === 0) {
        throw new AppError('No valid rows to import', 400, 'NO_VALID_ROWS');
      }

      const summary = await importService.importClientsPets(valid);

      res.status(200).json({
        success: true,
        message: `تم الاستيراد: ${summary.imported} عميل جديد، ${summary.petAdded} أليف مضاف، ${summary.errors} فشل`,
        data: {
          ...summary,
          skippedValidation: validationErrors.length,
          validationErrors,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
