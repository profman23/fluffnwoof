-- Clean up empty strings and duplicates before restoring unique constraint
UPDATE "pets" SET "daftraCode" = NULL WHERE "daftraCode" = '';

-- For any duplicates, keep the oldest and null out the rest
UPDATE "pets" SET "daftraCode" = NULL
WHERE "daftraCode" IS NOT NULL
AND id NOT IN (
  SELECT DISTINCT ON ("daftraCode") id
  FROM "pets"
  WHERE "daftraCode" IS NOT NULL
  ORDER BY "daftraCode", "createdAt" ASC
);

-- CreateIndex
CREATE UNIQUE INDEX "pets_daftraCode_key" ON "pets"("daftraCode");
