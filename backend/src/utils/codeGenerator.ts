// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Atomic Code Generator
// Uses PostgreSQL UPSERT for race-condition-safe sequential codes
// Replaces the old read-last-then-increment pattern
// ══════════════════════════════════════════════════════════════

import prisma from '../config/database';

const MAX_RETRIES = 3;

/**
 * Core atomic increment using PostgreSQL UPSERT.
 * INSERT ... ON CONFLICT DO UPDATE is a single atomic operation —
 * two concurrent calls will never get the same number.
 */
async function atomicNextNumber(trackerKey: string): Promise<number> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const result = await prisma.$queryRaw<{ last_number: number }[]>`
        INSERT INTO "code_trackers" ("id", "key", "lastNumber", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${trackerKey}, 1, NOW(), NOW())
        ON CONFLICT ("key")
        DO UPDATE SET
          "lastNumber" = "code_trackers"."lastNumber" + 1,
          "updatedAt" = NOW()
        RETURNING "lastNumber" as last_number
      `;

      if (result && result.length > 0) {
        return result[0].last_number;
      }
    } catch (error: any) {
      // Retry on serialization failure or deadlock
      if (error.code === '40001' || error.code === '40P01') {
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));
        continue;
      }
      throw error;
    }
  }

  throw new Error(`Failed to generate code for key "${trackerKey}" after ${MAX_RETRIES} retries`);
}

/**
 * Generate next customer code: C00000001, C00000002, ...
 * Replaces generateCustomerCode() in ownerService, petService, customerAuthService, importService
 */
export async function nextCustomerCode(): Promise<string> {
  const num = await atomicNextNumber('customer_code');
  return `C${num.toString().padStart(8, '0')}`;
}

/**
 * Generate next pet code: P00000001, P00000002, ...
 * Replaces generatePetCode() in petService, importService
 */
export async function nextPetCode(): Promise<string> {
  const num = await atomicNextNumber('pet_code');
  return `P${num.toString().padStart(8, '0')}`;
}

/**
 * Generate next invoice number: INV-YYYYMMDD-0001, INV-YYYYMMDD-0002, ...
 * Uses a daily key so the sequence resets each day.
 * Replaces generateInvoiceNumber() in invoiceService
 */
export async function nextInvoiceNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const num = await atomicNextNumber(`invoice_${dateStr}`);
  return `INV-${dateStr}-${num.toString().padStart(4, '0')}`;
}
