-- CreateEnum
CREATE TYPE "BoardingType" AS ENUM ('BOARDING', 'ICU');

-- CreateEnum
CREATE TYPE "BoardingSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "boarding_slot_configs" (
    "id" TEXT NOT NULL,
    "type" "BoardingType" NOT NULL,
    "species" "Species" NOT NULL,
    "totalSlots" INTEGER NOT NULL,
    "pricePerDay" DECIMAL(10,2),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boarding_slot_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boarding_sessions" (
    "id" TEXT NOT NULL,
    "configId" TEXT NOT NULL,
    "petId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "checkInDate" TIMESTAMP(3) NOT NULL,
    "checkOutDate" TIMESTAMP(3),
    "expectedCheckOutDate" TIMESTAMP(3),
    "status" "BoardingSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "dailyRate" DECIMAL(10,2),
    "totalAmount" DECIMAL(10,2),
    "assignedVetId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boarding_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boarding_slot_configs_type_idx" ON "boarding_slot_configs"("type");

-- CreateIndex
CREATE INDEX "boarding_slot_configs_species_idx" ON "boarding_slot_configs"("species");

-- CreateIndex
CREATE INDEX "boarding_slot_configs_isActive_idx" ON "boarding_slot_configs"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "boarding_slot_configs_type_species_key" ON "boarding_slot_configs"("type", "species");

-- CreateIndex
CREATE INDEX "boarding_sessions_configId_idx" ON "boarding_sessions"("configId");

-- CreateIndex
CREATE INDEX "boarding_sessions_petId_idx" ON "boarding_sessions"("petId");

-- CreateIndex
CREATE INDEX "boarding_sessions_status_idx" ON "boarding_sessions"("status");

-- CreateIndex
CREATE INDEX "boarding_sessions_checkInDate_idx" ON "boarding_sessions"("checkInDate");

-- CreateIndex
CREATE INDEX "boarding_sessions_assignedVetId_idx" ON "boarding_sessions"("assignedVetId");

-- AddForeignKey
ALTER TABLE "boarding_sessions" ADD CONSTRAINT "boarding_sessions_configId_fkey" FOREIGN KEY ("configId") REFERENCES "boarding_slot_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boarding_sessions" ADD CONSTRAINT "boarding_sessions_petId_fkey" FOREIGN KEY ("petId") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boarding_sessions" ADD CONSTRAINT "boarding_sessions_assignedVetId_fkey" FOREIGN KEY ("assignedVetId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boarding_sessions" ADD CONSTRAINT "boarding_sessions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
