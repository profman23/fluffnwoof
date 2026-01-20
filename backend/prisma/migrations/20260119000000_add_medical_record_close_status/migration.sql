-- Add Close/Reopen status fields to medical_records table
ALTER TABLE "medical_records" ADD COLUMN "isClosed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "medical_records" ADD COLUMN "closedAt" TIMESTAMP(3);
ALTER TABLE "medical_records" ADD COLUMN "closedById" TEXT;

-- Add foreign key constraint for closedById
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for isClosed field
CREATE INDEX "medical_records_isClosed_idx" ON "medical_records"("isClosed");
