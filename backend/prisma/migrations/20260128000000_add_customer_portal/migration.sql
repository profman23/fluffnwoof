-- Customer Portal Migration
-- إضافة بوابة العملاء

-- CreateEnum
CREATE TYPE "OtpType" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('STAFF', 'CUSTOMER_PORTAL');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('STAFF', 'CUSTOMER');

-- AlterTable: appointments - إضافة حقول البوابة
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3);
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "cancelledBy" "CancelledBy";
ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "source" "AppointmentSource" NOT NULL DEFAULT 'STAFF';

-- AlterTable: owners - إضافة حقول المصادقة
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "preferredLang" TEXT NOT NULL DEFAULT 'ar';
ALTER TABLE "owners" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- CreateTable: owner_otps - جدول OTP
CREATE TABLE IF NOT EXISTS "owner_otps" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "OtpType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable: staff_notifications - إشعارات الموظفين
CREATE TABLE IF NOT EXISTS "staff_notifications" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: owner_otps
CREATE INDEX IF NOT EXISTS "owner_otps_email_type_idx" ON "owner_otps"("email", "type");
CREATE INDEX IF NOT EXISTS "owner_otps_expiresAt_idx" ON "owner_otps"("expiresAt");

-- CreateIndex: staff_notifications
CREATE INDEX IF NOT EXISTS "staff_notifications_isRead_idx" ON "staff_notifications"("isRead");
CREATE INDEX IF NOT EXISTS "staff_notifications_createdAt_idx" ON "staff_notifications"("createdAt");

-- CreateIndex: appointments
CREATE INDEX IF NOT EXISTS "appointments_source_idx" ON "appointments"("source");

-- CreateIndex: owners - unique email constraint
-- معالجة الـ duplicates: إضافة رقم للـ email المكرر
UPDATE "owners" o1
SET "email" = o1."email" || '_dup_' || o1."id"
WHERE EXISTS (
  SELECT 1 FROM "owners" o2
  WHERE o2."email" = o1."email"
    AND o2."id" < o1."id"
    AND o1."email" IS NOT NULL
);

-- إضافة unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "owners_email_key" ON "owners"("email") WHERE "email" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "owners_email_idx" ON "owners"("email");

-- AddForeignKey: owner_otps
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'owner_otps_ownerId_fkey') THEN
    ALTER TABLE "owner_otps" ADD CONSTRAINT "owner_otps_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey: staff_notifications
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'staff_notifications_appointmentId_fkey') THEN
    ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_appointmentId_fkey"
      FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
