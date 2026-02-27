-- Add priceBeforeTax and taxRate columns to invoice_items
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "priceBeforeTax" DOUBLE PRECISION;
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15;
