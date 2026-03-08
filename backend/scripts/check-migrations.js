/**
 * Migration Safety Guard
 *
 * Scans UNAPPLIED Prisma migration SQL files for destructive commands.
 * Blocks deploy if DROP TABLE, DROP COLUMN, TRUNCATE, or DELETE FROM are found.
 *
 * Runs automatically in render-build BEFORE prisma migrate deploy.
 * Bypass: set ALLOW_DESTRUCTIVE_MIGRATION=true (for rare intentional cases only).
 *
 * How it works:
 * 1. Uses Prisma client to query _prisma_migrations for already-applied names
 * 2. Only scans migrations NOT yet applied
 * 3. Blocks deploy if any unapplied migration contains destructive SQL
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'prisma', 'migrations');

const DANGEROUS_PATTERNS = [
  { pattern: /\bDROP\s+TABLE\b/i, label: 'DROP TABLE' },
  { pattern: /\bDROP\s+COLUMN\b/i, label: 'DROP COLUMN' },
  { pattern: /\bALTER\s+TABLE\s+\S+\s+DROP\b/i, label: 'ALTER TABLE ... DROP' },
  { pattern: /\bTRUNCATE\b/i, label: 'TRUNCATE' },
  { pattern: /\bDELETE\s+FROM\b/i, label: 'DELETE FROM' },
];

async function getAppliedMigrations() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL
    `;
    return new Set(rows.map((r) => r.migration_name));
  } catch (err) {
    // Table might not exist on first deploy
    console.log('⚠️  Could not read _prisma_migrations — scanning ALL migrations');
    return new Set();
  } finally {
    await prisma.$disconnect();
  }
}

async function scanMigrations() {
  // Allow bypass for intentional destructive migrations
  if (process.env.ALLOW_DESTRUCTIVE_MIGRATION === 'true') {
    console.log('⚠️  ALLOW_DESTRUCTIVE_MIGRATION=true — safety check bypassed');
    return;
  }

  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log('✅ No migrations directory found — nothing to check');
    return;
  }

  const appliedMigrations = await getAppliedMigrations();

  const migrationDirs = fs.readdirSync(MIGRATIONS_DIR).filter((entry) => {
    const fullPath = path.join(MIGRATIONS_DIR, entry);
    return fs.statSync(fullPath).isDirectory();
  });

  // Only check unapplied migrations
  const unappliedDirs = migrationDirs.filter((dir) => !appliedMigrations.has(dir));

  if (unappliedDirs.length === 0) {
    console.log(`✅ No new migrations to check (${migrationDirs.length} already applied)`);
    return;
  }

  const violations = [];

  for (const dir of unappliedDirs) {
    const sqlFile = path.join(MIGRATIONS_DIR, dir, 'migration.sql');
    if (!fs.existsSync(sqlFile)) continue;

    const content = fs.readFileSync(sqlFile, 'utf-8');

    for (const { pattern, label } of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        violations.push({ file: `${dir}/migration.sql`, command: label });
      }
    }
  }

  if (violations.length > 0) {
    console.error('\n❌ DESTRUCTIVE MIGRATION DETECTED — DEPLOY BLOCKED!\n');
    console.error('The following dangerous commands were found in NEW migrations:\n');
    for (const v of violations) {
      console.error(`  📁 ${v.file}`);
      console.error(`  ⚠️  Contains: ${v.command}\n`);
    }
    console.error('This could cause DATA LOSS on Production.\n');
    console.error('If this is intentional, set ALLOW_DESTRUCTIVE_MIGRATION=true');
    console.error('in the Render environment variables.\n');
    process.exit(1);
  }

  console.log(
    `✅ Migration safety check passed (${unappliedDirs.length} new, ${appliedMigrations.size} already applied)`
  );
}

scanMigrations().catch((err) => {
  console.error('❌ Safety check script failed:', err.message);
  process.exit(1);
});
