-- AlterEnum: add CREDITED to InvoiceStatus
-- Additive-only. Safe on all environments — existing invoices keep their status.
-- IF NOT EXISTS makes it a no-op where already present. Wrapped in DO/EXCEPTION per
-- the project's established pattern because ALTER TYPE ... ADD VALUE cannot run
-- inside a transaction on older Postgres.
DO $$ BEGIN ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'CREDITED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- CreateTable: credit_notes (idempotent — additive only, zero impact on existing data)
CREATE TABLE IF NOT EXISTS "credit_notes" (
    "id" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "credit_notes_creditNoteNumber_key" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "credit_notes_invoiceId_key" ON "credit_notes"("invoiceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "credit_notes_ownerId_idx" ON "credit_notes"("ownerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "credit_notes_creditNoteNumber_idx" ON "credit_notes"("creditNoteNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "credit_notes_createdAt_idx" ON "credit_notes"("createdAt");

-- AddForeignKey (guarded — idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_notes_invoiceId_fkey') THEN
    ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_notes_ownerId_fkey') THEN
    ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'credit_notes_createdById_fkey') THEN
    ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
