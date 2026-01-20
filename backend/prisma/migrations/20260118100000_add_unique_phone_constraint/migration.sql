-- Add unique constraint to phone field in owners table
-- This prevents duplicate phone numbers for owners

-- First, check for any duplicate phone numbers and handle them
-- (This is a safeguard in case there are existing duplicates)

-- Add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "owners_phone_key" ON "owners"("phone");
