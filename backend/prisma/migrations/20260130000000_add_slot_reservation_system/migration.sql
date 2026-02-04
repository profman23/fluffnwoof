-- CreateEnum (if not exists)
DO $$ BEGIN
    CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'RELEASED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "slot_reservations" (
    "id" TEXT NOT NULL,
    "vetId" TEXT NOT NULL,
    "reservationDate" DATE NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "customerId" TEXT,
    "sessionId" TEXT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slot_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "slot_reservations_vetId_reservationDate_idx" ON "slot_reservations"("vetId", "reservationDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "slot_reservations_expiresAt_idx" ON "slot_reservations"("expiresAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "slot_reservations_status_idx" ON "slot_reservations"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "slot_reservations_sessionId_idx" ON "slot_reservations"("sessionId");

-- CreateIndex (unique constraint for active reservations)
CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_reservation" ON "slot_reservations"("vetId", "reservationDate", "reservationTime", "status");

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_vetId_fkey" FOREIGN KEY ("vetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
    ALTER TABLE "slot_reservations" ADD CONSTRAINT "slot_reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "owners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ================================================
-- CRITICAL: Partial Unique Index on Appointments
-- This prevents double-booking at the database level
-- ================================================

-- Create partial unique index (only for non-cancelled appointments)
CREATE UNIQUE INDEX IF NOT EXISTS "appointments_vet_date_time_unique"
ON "appointments" ("vetId", "appointmentDate", "appointmentTime")
WHERE "status" != 'CANCELLED';

COMMENT ON INDEX "appointments_vet_date_time_unique" IS
'Prevents double-booking: only one active appointment per vet/date/time';
