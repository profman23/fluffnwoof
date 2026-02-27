-- AlterTable: Add discount column to invoice_items
ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
