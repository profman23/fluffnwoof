-- CreateTable: code_trackers for atomic sequential code generation
CREATE TABLE "code_trackers" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "key" TEXT NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "code_trackers_key_key" ON "code_trackers"("key");

-- Initialize customer_code tracker from existing data (no data deletion)
INSERT INTO "code_trackers" ("id", "key", "lastNumber", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'customer_code',
    COALESCE(
        (SELECT MAX(CAST(SUBSTRING("customerCode" FROM 2) AS INTEGER))
         FROM "owners"
         WHERE "customerCode" IS NOT NULL AND "customerCode" ~ '^C\d+$'),
        0
    ),
    NOW(),
    NOW()
)
ON CONFLICT ("key") DO NOTHING;

-- Initialize pet_code tracker from existing data (no data deletion)
INSERT INTO "code_trackers" ("id", "key", "lastNumber", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'pet_code',
    COALESCE(
        (SELECT MAX(CAST(SUBSTRING("petCode" FROM 2) AS INTEGER))
         FROM "pets"
         WHERE "petCode" IS NOT NULL AND "petCode" ~ '^P\d+$'),
        0
    ),
    NOW(),
    NOW()
)
ON CONFLICT ("key") DO NOTHING;
