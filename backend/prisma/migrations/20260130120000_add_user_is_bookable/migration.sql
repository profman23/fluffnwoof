-- AlterTable: Add isBookable field to users table
-- This field determines if a staff member appears in booking lists for customers
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isBookable" BOOLEAN NOT NULL DEFAULT false;

-- Set isBookable to true for users who have VET role (optional - run if needed)
-- UPDATE "users" SET "isBookable" = true WHERE "roleId" IN (SELECT id FROM "roles" WHERE name = 'VET');
