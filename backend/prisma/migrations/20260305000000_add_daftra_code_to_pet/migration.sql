-- AlterTable
ALTER TABLE "pets" ADD COLUMN "daftraCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "pets_daftraCode_key" ON "pets"("daftraCode");
