-- ══════════════════════════════════════════════════════════════
-- Sync schema drift (ADDITIVE ONLY — safe on all environments)
--
-- These columns/indexes/FKs already exist on Dev/Training/Production
-- (they were added via `db push` over time but never captured in a
-- migration). CI builds a fresh DB from migrations only, so it lacked
-- them and every test failed at createTestUser().
--
-- Every statement uses IF NOT EXISTS (or a guarded DO block), so on
-- environments where the object already exists this is a NO-OP:
-- ZERO data change, zero risk. On the CI's empty DB it fills the gap.
--
-- This migration is ADDITIVE ONLY. All removal/default-changing
-- statements from the raw drift were intentionally left out to keep
-- it non-destructive and safe for Production.
-- ══════════════════════════════════════════════════════════════

-- ── appointments ─────────────────────────────────────────────
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "isConfirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "scheduledFromRecordId" TEXT;
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "visitType" TEXT NOT NULL DEFAULT 'GENERAL_CHECKUP';

-- ── invoices ─────────────────────────────────────────────────
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "finalizedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "isFinalized" BOOLEAN NOT NULL DEFAULT false;

-- ── medical_records (SOAP fields) ────────────────────────────
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "attitude" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "behaviour" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "bodyConditionScore" INTEGER;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "chiefComplaint" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "crt" DOUBLE PRECISION;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "heartRate" INTEGER;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "history" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "hydration" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "mucousMembranes" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "muscleCondition" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "painScore" INTEGER;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "recordCode" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "respirationRate" INTEGER;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "temperature" DOUBLE PRECISION;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "updatedById" TEXT;
ALTER TABLE "medical_records" ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION;

-- ── users ────────────────────────────────────────────────────
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- ── indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "appointments_status_idx" ON "appointments"("status");
CREATE INDEX IF NOT EXISTS "appointments_scheduledFromRecordId_idx" ON "appointments"("scheduledFromRecordId");
CREATE UNIQUE INDEX IF NOT EXISTS "medical_records_recordCode_key" ON "medical_records"("recordCode");
CREATE INDEX IF NOT EXISTS "medical_records_appointmentId_idx" ON "medical_records"("appointmentId");

-- ── foreign key (guarded so it's idempotent) ─────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_scheduledFromRecordId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_scheduledFromRecordId_fkey"
      FOREIGN KEY ("scheduledFromRecordId") REFERENCES "medical_records"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
