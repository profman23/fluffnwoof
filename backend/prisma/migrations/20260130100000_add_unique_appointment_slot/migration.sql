-- CreateIndex: Prevent double-booking at database level
-- This partial unique index only applies to active appointments (not CANCELLED)
-- Two customers cannot book the same vet at the same date/time

-- Step 1: Remove duplicate appointments (keep the oldest one based on createdAt)
-- This handles any existing race condition duplicates
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY "vetId", "appointmentDate", "appointmentTime"
               ORDER BY "createdAt" ASC
           ) as rn
    FROM "appointments"
    WHERE status != 'CANCELLED'
)
DELETE FROM "appointments"
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Step 2: Create the unique index to prevent future duplicates
CREATE UNIQUE INDEX "unique_active_vet_slot"
ON "appointments" ("vetId", "appointmentDate", "appointmentTime")
WHERE status != 'CANCELLED';
