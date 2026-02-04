-- AlterTable: Add approval workflow fields to staff_notifications
ALTER TABLE "staff_notifications" ADD COLUMN "status" TEXT;
ALTER TABLE "staff_notifications" ADD COLUMN "actionBy" TEXT;
ALTER TABLE "staff_notifications" ADD COLUMN "actionAt" TIMESTAMP(3);
ALTER TABLE "staff_notifications" ADD COLUMN "rejectReason" TEXT;

-- CreateIndex
CREATE INDEX "staff_notifications_status_idx" ON "staff_notifications"("status");

-- Update existing CUSTOMER_BOOKING notifications to have PENDING status
UPDATE "staff_notifications" SET "status" = 'PENDING' WHERE "type" = 'CUSTOMER_BOOKING' AND "status" IS NULL;
