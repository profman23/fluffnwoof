-- =====================================================
-- Migration: Add Missing Tables & Enums
-- These tables existed in schema.prisma but had no
-- migration file. Using IF NOT EXISTS for safety.
-- =====================================================

-- =====================================================
-- Missing Enum Types
-- =====================================================

DO $$ BEGIN
    CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReminderEventType" AS ENUM ('APPOINTMENT_BOOKED', 'APPOINTMENT_CONFIRMED', 'APPOINTMENT_CANCELLED', 'PRE_APPOINTMENT', 'FOLLOW_UP', 'OWNER_CREATED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "NotificationChannel" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL', 'PUSH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "ReminderLogStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "DayOfWeek" AS ENUM ('SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "FormCategory" AS ENUM ('BOARDING', 'SURGERY', 'VACCINATION', 'GROOMING', 'CONSENT', 'DISCHARGE', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "FormStatus" AS ENUM ('DRAFT', 'PENDING_CLIENT', 'PENDING_VET', 'COMPLETED', 'EXPIRED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "SignerType" AS ENUM ('CLIENT', 'VET', 'WITNESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "CustomerNotificationType" AS ENUM ('FORM_PENDING', 'FORM_COMPLETED', 'APPOINTMENT', 'GENERAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "VisitType" AS ENUM ('GENERAL_CHECKUP', 'GROOMING', 'SURGERY', 'VACCINATION', 'EMERGENCY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Missing Enum Values for existing enums
-- =====================================================

-- Species: add missing animal types
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'HORSE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'GOAT'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'SHEEP'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'COW'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'CAMEL'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'DONKEY'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'MONKEY'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'FERRET'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'HEDGEHOG'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'SNAKE'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'LIZARD'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'FROG'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'CHICKEN'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'DUCK'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'PIG'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "Species" ADD VALUE IF NOT EXISTS 'ALPACA'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- AppointmentStatus: add missing statuses
DO $$ BEGIN ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'CHECK_IN'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'HOSPITALIZED'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PaymentMethod: add missing methods
DO $$ BEGIN ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'MADA'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'TABBY'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'TAMARA'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- Independent Tables (no FK to other missing tables)
-- =====================================================

-- 1. user_preferences
CREATE TABLE IF NOT EXISTS "user_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "headerBgColor" TEXT,
    "sidebarBgColor" TEXT,
    "sidebarHoverColor" TEXT,
    "flowBoardColors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_preferences_userId_key" ON "user_preferences"("userId");
ALTER TABLE "user_preferences" DROP CONSTRAINT IF EXISTS "user_preferences_userId_fkey";
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. categories
CREATE TABLE IF NOT EXISTS "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

-- 3. medical_attachments
CREATE TABLE IF NOT EXISTS "medical_attachments" (
    "id" TEXT NOT NULL,
    "medicalRecordId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_attachments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "medical_attachments_medicalRecordId_idx" ON "medical_attachments"("medicalRecordId");
CREATE INDEX IF NOT EXISTS "medical_attachments_uploadedBy_idx" ON "medical_attachments"("uploadedBy");
ALTER TABLE "medical_attachments" DROP CONSTRAINT IF EXISTS "medical_attachments_medicalRecordId_fkey";
ALTER TABLE "medical_attachments" ADD CONSTRAINT "medical_attachments_medicalRecordId_fkey" FOREIGN KEY ("medicalRecordId") REFERENCES "medical_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "medical_attachments" DROP CONSTRAINT IF EXISTS "medical_attachments_uploadedBy_fkey";
ALTER TABLE "medical_attachments" ADD CONSTRAINT "medical_attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. sms_logs
CREATE TABLE IF NOT EXISTS "sms_logs" (
    "id" TEXT NOT NULL,
    "messageId" TEXT,
    "recipientPhone" TEXT NOT NULL,
    "recipientName" TEXT,
    "messageBody" TEXT NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentById" TEXT,

    CONSTRAINT "sms_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "sms_logs_recipientPhone_idx" ON "sms_logs"("recipientPhone");
CREATE INDEX IF NOT EXISTS "sms_logs_status_idx" ON "sms_logs"("status");
CREATE INDEX IF NOT EXISTS "sms_logs_createdAt_idx" ON "sms_logs"("createdAt");
ALTER TABLE "sms_logs" DROP CONSTRAINT IF EXISTS "sms_logs_sentById_fkey";
ALTER TABLE "sms_logs" ADD CONSTRAINT "sms_logs_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 5. reminder_settings
CREATE TABLE IF NOT EXISTS "reminder_settings" (
    "id" TEXT NOT NULL,
    "eventType" "ReminderEventType" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sendBeforeHours" INTEGER,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "templateAr" TEXT,
    "templateEn" TEXT,
    "reminderOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_settings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "reminder_settings_eventType_reminderOrder_key" ON "reminder_settings"("eventType", "reminderOrder");

-- 6. message_templates
CREATE TABLE IF NOT EXISTS "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "contentAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "message_templates_name_key" ON "message_templates"("name");

-- 7. vet_schedules
CREATE TABLE IF NOT EXISTS "vet_schedules" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_schedules_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vet_schedules_vetId_dayOfWeek_key" ON "vet_schedules"("vetId", "dayOfWeek");
CREATE INDEX IF NOT EXISTS "vet_schedules_vetId_idx" ON "vet_schedules"("vetId");
ALTER TABLE "vet_schedules" DROP CONSTRAINT IF EXISTS "vet_schedules_vetId_fkey";
ALTER TABLE "vet_schedules" ADD CONSTRAINT "vet_schedules_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 8. vet_days_off
CREATE TABLE IF NOT EXISTS "vet_days_off" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_days_off_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "vet_days_off_vetId_date_key" ON "vet_days_off"("vetId", "date");
CREATE INDEX IF NOT EXISTS "vet_days_off_vetId_idx" ON "vet_days_off"("vetId");
CREATE INDEX IF NOT EXISTS "vet_days_off_date_idx" ON "vet_days_off"("date");
ALTER TABLE "vet_days_off" DROP CONSTRAINT IF EXISTS "vet_days_off_vetId_fkey";
ALTER TABLE "vet_days_off" ADD CONSTRAINT "vet_days_off_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 9. vet_breaks
CREATE TABLE IF NOT EXISTS "vet_breaks" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek",
    "specificDate" DATE,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "description" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_breaks_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "vet_breaks_vetId_idx" ON "vet_breaks"("vetId");
CREATE INDEX IF NOT EXISTS "vet_breaks_dayOfWeek_idx" ON "vet_breaks"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "vet_breaks_specificDate_idx" ON "vet_breaks"("specificDate");
ALTER TABLE "vet_breaks" DROP CONSTRAINT IF EXISTS "vet_breaks_vetId_fkey";
ALTER TABLE "vet_breaks" ADD CONSTRAINT "vet_breaks_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. vet_schedule_periods
CREATE TABLE IF NOT EXISTS "vet_schedule_periods" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "workingDays" "DayOfWeek"[],
    "workStartTime" TEXT NOT NULL,
    "workEndTime" TEXT NOT NULL,
    "breakStartTime" TEXT,
    "breakEndTime" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vet_schedule_periods_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "vet_schedule_periods_vetId_idx" ON "vet_schedule_periods"("vetId");
CREATE INDEX IF NOT EXISTS "vet_schedule_periods_startDate_endDate_idx" ON "vet_schedule_periods"("startDate", "endDate");
ALTER TABLE "vet_schedule_periods" DROP CONSTRAINT IF EXISTS "vet_schedule_periods_vetId_fkey";
ALTER TABLE "vet_schedule_periods" ADD CONSTRAINT "vet_schedule_periods_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. visit_type_configs
CREATE TABLE IF NOT EXISTS "visit_type_configs" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visit_type_configs_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "visit_type_configs_code_key" ON "visit_type_configs"("code");
CREATE INDEX IF NOT EXISTS "visit_type_configs_isActive_idx" ON "visit_type_configs"("isActive");
CREATE INDEX IF NOT EXISTS "visit_type_configs_sortOrder_idx" ON "visit_type_configs"("sortOrder");

-- 12. clinic_form_settings
CREATE TABLE IF NOT EXISTS "clinic_form_settings" (
    "id" TEXT NOT NULL,
    "logoUrl" TEXT,
    "logoPosition" TEXT NOT NULL DEFAULT 'center',
    "clinicNameEn" TEXT NOT NULL DEFAULT 'Fluff N'' Woof',
    "clinicNameAr" TEXT NOT NULL DEFAULT 'فلف أند ووف',
    "addressEn" TEXT NOT NULL DEFAULT 'Riyadh - Kingdom of Saudi Arabia',
    "addressAr" TEXT NOT NULL DEFAULT 'الرياض - المملكة العربية السعودية',
    "phoneNumber" TEXT,
    "fontSize" INTEGER NOT NULL DEFAULT 14,
    "showClientSignature" BOOLEAN NOT NULL DEFAULT true,
    "clientSignatureLabelEn" TEXT NOT NULL DEFAULT 'Client Signature',
    "clientSignatureLabelAr" TEXT NOT NULL DEFAULT 'توقيع العميل',
    "showVetSignature" BOOLEAN NOT NULL DEFAULT true,
    "vetSignatureLabelEn" TEXT NOT NULL DEFAULT 'Veterinarian Signature',
    "vetSignatureLabelAr" TEXT NOT NULL DEFAULT 'توقيع الطبيب البيطري',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_form_settings_pkey" PRIMARY KEY ("id")
);

-- 13. record_code_tracker
CREATE TABLE IF NOT EXISTS "record_code_tracker" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "record_code_tracker_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "record_code_tracker_dateKey_key" ON "record_code_tracker"("dateKey");

-- 14. boarding_notifications
CREATE TABLE IF NOT EXISTS "boarding_notifications" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boarding_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "boarding_notifications_sessionId_idx" ON "boarding_notifications"("sessionId");
CREATE INDEX IF NOT EXISTS "boarding_notifications_isRead_idx" ON "boarding_notifications"("isRead");
CREATE INDEX IF NOT EXISTS "boarding_notifications_createdAt_idx" ON "boarding_notifications"("createdAt");
ALTER TABLE "boarding_notifications" DROP CONSTRAINT IF EXISTS "boarding_notifications_sessionId_fkey";
ALTER TABLE "boarding_notifications" ADD CONSTRAINT "boarding_notifications_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "boarding_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =====================================================
-- Dependent Tables (FK to other tables in this migration)
-- =====================================================

-- 15. service_products (depends on categories)
CREATE TABLE IF NOT EXISTS "service_products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "priceBeforeTax" DECIMAL(10,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "priceAfterTax" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_products_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "service_products_categoryId_idx" ON "service_products"("categoryId");
CREATE INDEX IF NOT EXISTS "service_products_name_idx" ON "service_products"("name");
ALTER TABLE "service_products" DROP CONSTRAINT IF EXISTS "service_products_categoryId_fkey";
ALTER TABLE "service_products" ADD CONSTRAINT "service_products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 16. reminder_logs (depends on reminder_settings)
CREATE TABLE IF NOT EXISTS "reminder_logs" (
    "id" TEXT NOT NULL,
    "settingId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "status" "ReminderLogStatus" NOT NULL DEFAULT 'PENDING',
    "recipientPhone" TEXT,
    "recipientEmail" TEXT,
    "recipientName" TEXT,
    "messageBody" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,

    CONSTRAINT "reminder_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reminder_logs_settingId_idx" ON "reminder_logs"("settingId");
CREATE INDEX IF NOT EXISTS "reminder_logs_appointmentId_idx" ON "reminder_logs"("appointmentId");
CREATE INDEX IF NOT EXISTS "reminder_logs_ownerId_idx" ON "reminder_logs"("ownerId");
CREATE INDEX IF NOT EXISTS "reminder_logs_status_idx" ON "reminder_logs"("status");
CREATE INDEX IF NOT EXISTS "reminder_logs_scheduledFor_idx" ON "reminder_logs"("scheduledFor");
CREATE INDEX IF NOT EXISTS "reminder_logs_createdAt_idx" ON "reminder_logs"("createdAt");
ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "reminder_logs_appointmentId_fkey";
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "reminder_logs_ownerId_fkey";
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "reminder_logs" DROP CONSTRAINT IF EXISTS "reminder_logs_settingId_fkey";
ALTER TABLE "reminder_logs" ADD CONSTRAINT "reminder_logs_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "reminder_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 17. form_templates
CREATE TABLE IF NOT EXISTS "form_templates" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "contentEn" TEXT NOT NULL,
    "contentAr" TEXT NOT NULL,
    "category" "FormCategory" NOT NULL DEFAULT 'OTHER',
    "requiresClientSignature" BOOLEAN NOT NULL DEFAULT true,
    "requiresVetSignature" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "headerLogoUrl" TEXT,
    "footerText" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "form_templates_category_idx" ON "form_templates"("category");
CREATE INDEX IF NOT EXISTS "form_templates_isActive_idx" ON "form_templates"("isActive");
CREATE INDEX IF NOT EXISTS "form_templates_createdBy_idx" ON "form_templates"("createdBy");
ALTER TABLE "form_templates" DROP CONSTRAINT IF EXISTS "form_templates_createdBy_fkey";
ALTER TABLE "form_templates" ADD CONSTRAINT "form_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 18. pet_forms (depends on form_templates)
CREATE TABLE IF NOT EXISTS "pet_forms" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "filledContentEn" TEXT NOT NULL,
    "filledContentAr" TEXT NOT NULL,
    "status" "FormStatus" NOT NULL DEFAULT 'DRAFT',
    "expiresAt" TIMESTAMP(3),
    "notificationSentAt" TIMESTAMP(3),
    "notificationMethod" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "pet_forms_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "pet_forms_petId_idx" ON "pet_forms"("petId");
CREATE INDEX IF NOT EXISTS "pet_forms_templateId_idx" ON "pet_forms"("templateId");
CREATE INDEX IF NOT EXISTS "pet_forms_status_idx" ON "pet_forms"("status");
CREATE INDEX IF NOT EXISTS "pet_forms_createdBy_idx" ON "pet_forms"("createdBy");
ALTER TABLE "pet_forms" DROP CONSTRAINT IF EXISTS "pet_forms_templateId_fkey";
ALTER TABLE "pet_forms" ADD CONSTRAINT "pet_forms_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "form_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pet_forms" DROP CONSTRAINT IF EXISTS "pet_forms_petId_fkey";
ALTER TABLE "pet_forms" ADD CONSTRAINT "pet_forms_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pet_forms" DROP CONSTRAINT IF EXISTS "pet_forms_appointmentId_fkey";
ALTER TABLE "pet_forms" ADD CONSTRAINT "pet_forms_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pet_forms" DROP CONSTRAINT IF EXISTS "pet_forms_createdBy_fkey";
ALTER TABLE "pet_forms" ADD CONSTRAINT "pet_forms_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 19. form_signatures (depends on pet_forms)
CREATE TABLE IF NOT EXISTS "form_signatures" (
    "id" TEXT NOT NULL,
    "petFormId" TEXT NOT NULL,
    "signerType" "SignerType" NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerId" TEXT,
    "signatureData" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "form_signatures_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "form_signatures_petFormId_signerType_key" ON "form_signatures"("petFormId", "signerType");
ALTER TABLE "form_signatures" DROP CONSTRAINT IF EXISTS "form_signatures_petFormId_fkey";
ALTER TABLE "form_signatures" ADD CONSTRAINT "form_signatures_petFormId_fkey" FOREIGN KEY ("petFormId") REFERENCES "pet_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 20. customer_notifications (depends on pet_forms)
CREATE TABLE IF NOT EXISTS "customer_notifications" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "CustomerNotificationType" NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "messageEn" TEXT NOT NULL,
    "messageAr" TEXT NOT NULL,
    "petFormId" TEXT,
    "appointmentId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notifications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "customer_notifications_ownerId_isRead_idx" ON "customer_notifications"("ownerId", "isRead");
CREATE INDEX IF NOT EXISTS "customer_notifications_type_idx" ON "customer_notifications"("type");
ALTER TABLE "customer_notifications" DROP CONSTRAINT IF EXISTS "customer_notifications_ownerId_fkey";
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "owners"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "customer_notifications" DROP CONSTRAINT IF EXISTS "customer_notifications_petFormId_fkey";
ALTER TABLE "customer_notifications" ADD CONSTRAINT "customer_notifications_petFormId_fkey" FOREIGN KEY ("petFormId") REFERENCES "pet_forms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
