-- Add payment direction (INCOMING/OUTGOING) + refund linkage for credit notes.
-- Fully additive & idempotent. Zero DROP/DELETE — no impact on existing data.
-- Existing payment rows all become INCOMING via the column DEFAULT (one statement,
-- no data migration needed).

-- CreateEnum: PaymentDirection (guarded — idempotent)
DO $$ BEGIN
  CREATE TYPE "PaymentDirection" AS ENUM ('INCOMING', 'OUTGOING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Payment: direction column (DEFAULT backfills all existing rows to INCOMING)
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "direction" "PaymentDirection" NOT NULL DEFAULT 'INCOMING';

-- Payment: optional link to the credit note this refund belongs to
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "creditNoteId" TEXT;

-- CreditNote: how much was actually refunded (= the invoice's paid amount at credit time)
ALTER TABLE "credit_notes" ADD COLUMN IF NOT EXISTS "refundedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS "payments_direction_idx" ON "payments"("direction");
CREATE INDEX IF NOT EXISTS "payments_creditNoteId_idx" ON "payments"("creditNoteId");

-- Foreign key: payments.creditNoteId -> credit_notes.id (guarded — idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payments_creditNoteId_fkey') THEN
    ALTER TABLE "payments" ADD CONSTRAINT "payments_creditNoteId_fkey"
      FOREIGN KEY ("creditNoteId") REFERENCES "credit_notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
