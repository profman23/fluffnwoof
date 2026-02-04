-- Performance Optimization: Add composite index for booking conflict detection
-- This index significantly speeds up the race condition check query

-- Create composite index for fast booking lookup (vetId, date, time, status)
CREATE INDEX IF NOT EXISTS "idx_appointment_booking_lookup"
ON "appointments" ("vetId", "appointmentDate", "appointmentTime", "status");

-- Add index for slot reservation lookup
CREATE INDEX IF NOT EXISTS "idx_slot_reservation_lookup"
ON "slot_reservations" ("vetId", "reservationDate", "reservationTime", "status");
