import prisma from '../config/database';
import { Species, Gender } from '@prisma/client';
import { normalizePhone, getPhoneVariants } from '../utils/phoneUtils';
import { nextCustomerCode, nextPetCode } from '../utils/codeGenerator';

export interface ImportOwnerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface ImportPetInput {
  name: string;
  species: Species;
  gender: Gender;
  breed?: string;
  birthDate?: string;
  color?: string;
  weight?: number;
}

export interface ImportRow {
  owner: ImportOwnerInput;
  pet: ImportPetInput;
}

export type ImportRowStatus = 'imported' | 'pet_added' | 'skipped' | 'error';

export interface ImportRowResult {
  row: number;
  status: ImportRowStatus;
  ownerName?: string;
  customerCode?: string;
  petName?: string;
  petCode?: string;
  error?: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  petAdded: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
}

// Code generation moved to utils/codeGenerator.ts (atomic UPSERT)

export const importService = {
  /**
   * Import clients and pets from parsed Excel rows.
   * Processes rows sequentially to avoid race conditions in code generation.
   * - If phone exists: adds pet to existing owner (status: pet_added)
   * - If phone is new: creates owner + pet atomically (status: imported)
   * - On any error: marks row as error and continues
   */
  async importClientsPets(rows: ImportRow[]): Promise<ImportSummary> {
    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { owner: ownerData, pet: petData } = rows[i];
      const rowNumber = i + 1;

      try {
        const parsedBirthDate = petData.birthDate
          ? new Date(`${String(petData.birthDate).split('T')[0]}T00:00:00.000Z`)
          : null;

        // Normalize phone before lookup/storage
        ownerData.phone = normalizePhone(ownerData.phone);

        // Check if owner with this phone already exists (search all format variants)
        const existingOwner = await prisma.owner.findFirst({
          where: { phone: { in: getPhoneVariants(ownerData.phone) } },
        });

        if (existingOwner) {
          // Check if this pet already exists under this owner (same name + species)
          const existingPet = await prisma.pet.findFirst({
            where: {
              ownerId: existingOwner.id,
              name: petData.name.trim(),
              species: petData.species,
            },
          });

          if (existingPet) {
            // Skip — duplicate pet for same owner
            results.push({
              row: rowNumber,
              status: 'skipped',
              ownerName: `${existingOwner.firstName} ${existingOwner.lastName}`,
              customerCode: existingOwner.customerCode,
              petName: existingPet.name,
              petCode: existingPet.petCode,
            });
          } else {
            // Add pet to existing owner
            let petCode: string;
            try {
              petCode = await nextPetCode();
            } catch (err) {
              console.error('[ImportService] nextPetCode failed, using fallback:', err);
              const lastPet = await prisma.pet.findFirst({
                where: { petCode: { not: null } },
                orderBy: { createdAt: 'desc' },
                select: { petCode: true },
              });
              const lastNum = lastPet?.petCode ? parseInt(lastPet.petCode.substring(1)) || 0 : 0;
              petCode = `P${(lastNum + 1).toString().padStart(8, '0')}`;
            }
            const pet = await prisma.pet.create({
              data: {
                name: petData.name.trim(),
                species: petData.species,
                gender: petData.gender,
                breed: petData.breed?.trim() || null,
                birthDate: parsedBirthDate,
                color: petData.color?.trim() || null,
                weight: petData.weight || null,
                petCode,
                ownerId: existingOwner.id,
              },
            });

            results.push({
              row: rowNumber,
              status: 'pet_added',
              ownerName: `${existingOwner.firstName} ${existingOwner.lastName}`,
              customerCode: existingOwner.customerCode,
              petName: pet.name,
              petCode: pet.petCode,
            });
          }
        } else {
          // Create owner + pet atomically in a transaction
          let customerCode: string;
          let petCode: string;
          try {
            customerCode = await nextCustomerCode();
          } catch (err) {
            console.error('[ImportService] nextCustomerCode failed, using fallback:', err);
            const lastOwner = await prisma.owner.findFirst({
              where: { customerCode: { not: null } },
              orderBy: { createdAt: 'desc' },
              select: { customerCode: true },
            });
            const lastNum = lastOwner?.customerCode ? parseInt(lastOwner.customerCode.substring(1)) || 0 : 0;
            customerCode = `C${(lastNum + 1).toString().padStart(8, '0')}`;
          }
          try {
            petCode = await nextPetCode();
          } catch (err) {
            console.error('[ImportService] nextPetCode failed, using fallback:', err);
            const lastPet = await prisma.pet.findFirst({
              where: { petCode: { not: null } },
              orderBy: { createdAt: 'desc' },
              select: { petCode: true },
            });
            const lastNum = lastPet?.petCode ? parseInt(lastPet.petCode.substring(1)) || 0 : 0;
            petCode = `P${(lastNum + 1).toString().padStart(8, '0')}`;
          }

          const { owner, pet } = await prisma.$transaction(async (tx) => {
            const owner = await tx.owner.create({
              data: {
                firstName: ownerData.firstName.trim(),
                lastName: ownerData.lastName.trim(),
                phone: ownerData.phone.trim(),
                email: ownerData.email?.trim() || `noemail_${ownerData.phone.trim()}@import.local`,
                customerCode,
              },
            });
            const pet = await tx.pet.create({
              data: {
                name: petData.name.trim(),
                species: petData.species,
                gender: petData.gender,
                breed: petData.breed?.trim() || null,
                birthDate: parsedBirthDate,
                color: petData.color?.trim() || null,
                weight: petData.weight || null,
                petCode,
                ownerId: owner.id,
              },
            });
            return { owner, pet };
          });

          results.push({
            row: rowNumber,
            status: 'imported',
            ownerName: `${owner.firstName} ${owner.lastName}`,
            customerCode: owner.customerCode,
            petName: pet.name,
            petCode: pet.petCode,
          });
        }
      } catch (error: any) {
        results.push({
          row: rowNumber,
          status: 'error',
          ownerName: `${ownerData.firstName} ${ownerData.lastName}`.trim(),
          petName: petData.name,
          error: error.message || 'Unknown error',
        });
      }
    }

    const imported = results.filter((r) => r.status === 'imported').length;
    const petAdded = results.filter((r) => r.status === 'pet_added').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;
    const errors = results.filter((r) => r.status === 'error').length;

    return {
      total: rows.length,
      imported,
      petAdded,
      skipped,
      errors,
      results,
    };
  },
};
