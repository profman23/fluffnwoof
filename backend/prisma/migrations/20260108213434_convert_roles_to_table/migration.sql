-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayNameEn" TEXT NOT NULL,
    "displayNameAr" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- Insert existing roles from enum
INSERT INTO "roles" (id, name, "displayNameEn", "displayNameAr", "isSystem", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'ADMIN', 'Administrator', 'مدير النظام', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'VET', 'Veterinarian', 'طبيب بيطري', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (gen_random_uuid(), 'RECEPTIONIST', 'Receptionist', 'موظف استقبال', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add roleId column to users (nullable temporarily)
ALTER TABLE "users" ADD COLUMN "roleId" TEXT;

-- Migrate existing user roles to roleId
UPDATE "users" u
SET "roleId" = r.id
FROM "roles" r
WHERE u.role::text = r.name;

-- Make roleId NOT NULL
ALTER TABLE "users" ALTER COLUMN "roleId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index on roleId
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- Drop old role column
ALTER TABLE "users" DROP COLUMN "role";

-- Add roleId column to role_permissions (nullable temporarily)
ALTER TABLE "role_permissions" ADD COLUMN "roleId" TEXT;

-- Migrate existing role_permissions.role to roleId
UPDATE "role_permissions" rp
SET "roleId" = r.id
FROM "roles" r
WHERE rp.role::text = r.name;

-- Make roleId NOT NULL
ALTER TABLE "role_permissions" ALTER COLUMN "roleId" SET NOT NULL;

-- Drop old unique constraint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_permissionId_key";

-- Add new unique constraint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_permissionId_key"
  UNIQUE ("roleId", "permissionId");

-- Add foreign key constraint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop old index
DROP INDEX "role_permissions_role_idx";

-- Create new index
CREATE INDEX "role_permissions_roleId_idx" ON "role_permissions"("roleId");

-- Drop old role column
ALTER TABLE "role_permissions" DROP COLUMN "role";
