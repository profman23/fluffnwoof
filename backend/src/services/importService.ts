import prisma from '../config/database';
import { Species, Gender } from '@prisma/client';
import { normalizePhone, getPhoneVariants } from '../utils/phoneUtils';

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

export type ImportRowStatus = 'imported' | 'pet_added' | 'error';

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
  errors: number;
  results: ImportRowResult[];
}

async function generateCustomerCode(): Promise<string> {
  const lastOwner = await prisma.owner.findFirst({
    orderBy: { customerCode: 'desc' },
    select: { customerCode: true },
  });
  if (!lastOwner?.customerCode) return 'C00000001';
  const next = parseInt(lastOwner.customerCode.substring(1), 10) + 1;
  return `C${next.toString().padStart(8, '0')}`;
}

async function generatePetCode(): Promise<string> {
  const lastPet = await prisma.pet.findFirst({
    orderBy: { petCode: 'desc' },
    select: { petCode: true },
  });
  if (!lastPet?.petCode) return 'P00000001';
  const next = parseInt(lastPet.petCode.substring(1), 10) + 1;
  return `P${next.toString().padStart(8, '0')}`;
}

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
          // Add pet to existing owner
          const petCode = await generatePetCode();
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
        } else {
          // Create owner + pet atomically in a transaction
          const customerCode = await generateCustomerCode();
          const petCode = await generatePetCode();

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
    const errors = results.filter((r) => r.status === 'error').length;

    return {
      total: rows.length,
      imported,
      petAdded,
      errors,
      results,
    };
  },
};
