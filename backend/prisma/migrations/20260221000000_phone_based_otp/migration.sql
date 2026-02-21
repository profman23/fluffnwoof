-- AlterTable: owner_otps - change email to phone
ALTER TABLE "owner_otps" RENAME COLUMN "email" TO "phone";

-- AlterIndex
DROP INDEX IF EXISTS "owner_otps_email_type_idx";
CREATE INDEX "owner_otps_phone_type_idx" ON "owner_otps"("phone", "type");
