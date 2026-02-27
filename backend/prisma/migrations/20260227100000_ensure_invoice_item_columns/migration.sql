-- Ensure invoice_items has all required columns
-- These were added to Dev via prisma db push but had no proper migration
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "priceBeforeTax" DOUBLE PRECISION;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill priceBeforeTax from unitPrice where NULL
UPDATE "invoice_items"
SET "priceBeforeTax" = "unitPrice" / (1 + "taxRate" / 100)
WHERE "priceBeforeTax" IS NULL;
