-- Add customerCode to owners table
ALTER TABLE "owners" ADD COLUMN "customerCode" TEXT;

-- Add petCode to pets table
ALTER TABLE "pets" ADD COLUMN "petCode" TEXT;

-- Generate customer codes for existing owners (C00000001, C00000002, etc.)
WITH numbered_owners AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "owners"
)
UPDATE "owners" o
SET "customerCode" = 'C' || LPAD(no.rn::text, 8, '0')
FROM numbered_owners no
WHERE o.id = no.id;

-- Generate pet codes for existing pets (P00000001, P00000002, etc.)
WITH numbered_pets AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as rn
  FROM "pets"
)
UPDATE "pets" p
SET "petCode" = 'P' || LPAD(np.rn::text, 8, '0')
FROM numbered_pets np
WHERE p.id = np.id;

-- Make columns NOT NULL after populating
ALTER TABLE "owners" ALTER COLUMN "customerCode" SET NOT NULL;
ALTER TABLE "pets" ALTER COLUMN "petCode" SET NOT NULL;

-- Add unique constraints
ALTER TABLE "owners" ADD CONSTRAINT "owners_customerCode_key" UNIQUE ("customerCode");
ALTER TABLE "pets" ADD CONSTRAINT "pets_petCode_key" UNIQUE ("petCode");

-- Create indexes for faster lookups
CREATE INDEX "owners_customerCode_idx" ON "owners"("customerCode");
CREATE INDEX "pets_petCode_idx" ON "pets"("petCode");
