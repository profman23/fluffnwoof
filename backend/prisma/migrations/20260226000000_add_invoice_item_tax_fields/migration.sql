-- AlterTable: Add priceBeforeTax and taxRate columns to invoice_items
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "priceBeforeTax" DOUBLE PRECISION;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15;

-- Backfill priceBeforeTax for existing invoice items where it's NULL
-- Calculate from unitPrice (which is priceAfterTax) and taxRate
UPDATE "invoice_items"
SET "priceBeforeTax" = "unitPrice" / (1 + "taxRate" / 100)
WHERE "priceBeforeTax" IS NULL;
