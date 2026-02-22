-- AlterTable: Add missing nameEn and nameAr columns to boarding_slot_configs
-- Using IF NOT EXISTS to safely handle databases where columns may already exist (e.g., via db push)
ALTER TABLE "boarding_slot_configs" ADD COLUMN IF NOT EXISTS "nameEn" TEXT NOT NULL DEFAULT '';
ALTER TABLE "boarding_slot_configs" ADD COLUMN IF NOT EXISTS "nameAr" TEXT NOT NULL DEFAULT '';

-- DropIndex: Remove unique constraint on (type, species) to allow multiple configs per combination
DROP INDEX IF EXISTS "boarding_slot_configs_type_species_key";
