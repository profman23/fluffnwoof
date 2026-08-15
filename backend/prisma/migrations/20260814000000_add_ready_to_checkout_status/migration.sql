-- AlterEnum: add READY_TO_CHECKOUT to AppointmentStatus
-- Additive-only (adds an enum value). Safe on all environments — existing
-- appointments keep their status; IF NOT EXISTS makes it a no-op where present.
-- Wrapped in DO/EXCEPTION per the project's established pattern (see
-- 20260225000000_add_missing_tables) because ALTER TYPE ... ADD VALUE cannot
-- run inside a transaction on older Postgres.
DO $$ BEGIN ALTER TYPE "AppointmentStatus" ADD VALUE IF NOT EXISTS 'READY_TO_CHECKOUT'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
