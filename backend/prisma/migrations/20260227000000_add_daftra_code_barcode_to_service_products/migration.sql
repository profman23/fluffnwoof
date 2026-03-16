-- AlterTable
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "daftraCode" TEXT;
ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
