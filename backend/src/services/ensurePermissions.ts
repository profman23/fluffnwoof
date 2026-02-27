import prisma from '../config/database';

// Master list of ALL permissions — single source of truth
// Both seed.ts and server startup use this list
export const ALL_PERMISSIONS = [
  // Dashboard
  { name: 'screens.dashboard.read', description: 'Dashboard - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.dashboard.full', description: 'Dashboard - Full Control', category: 'screens', action: 'full' },

  // Patients (Owners + Pets combined)
  { name: 'screens.patients.read', description: 'Patients - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.patients.full', description: 'Patients - Full Control', category: 'screens', action: 'full' },

  // Appointments
  { name: 'screens.appointments.read', description: 'Appointments - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.appointments.full', description: 'Appointments - Full Control', category: 'screens', action: 'full' },

  // Medical Records
  { name: 'screens.medical.read', description: 'Medical - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.medical.full', description: 'Medical - Full Control', category: 'screens', action: 'full' },

  // Boarding Management (Kanban board for daily operations)
  { name: 'screens.boardingManagement.read', description: 'Boarding Management - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.boardingManagement.full', description: 'Boarding Management - Full Control', category: 'screens', action: 'full' },

  // Invoices
  { name: 'screens.invoices.read', description: 'Invoices - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.invoices.full', description: 'Invoices - Full Control', category: 'screens', action: 'full' },

  // User Management
  { name: 'screens.userManagement.read', description: 'User Management - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.userManagement.full', description: 'User Management - Full Control', category: 'screens', action: 'full' },

  // Roles & Permissions
  { name: 'screens.rolesPermissions.read', description: 'Roles & Permissions - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.rolesPermissions.full', description: 'Roles & Permissions - Full Control', category: 'screens', action: 'full' },

  // Audit Log
  { name: 'screens.audit.read', description: 'Audit Log - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.audit.full', description: 'Audit Log - Full Control', category: 'screens', action: 'full' },

  // Flow Board
  { name: 'screens.flowBoard.read', description: 'Flow Board - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.flowBoard.full', description: 'Flow Board - Full Control', category: 'screens', action: 'full' },

  // Reports (parent screen)
  { name: 'screens.reports.read', description: 'Reports - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.reports.full', description: 'Reports - Full Control', category: 'screens', action: 'full' },

  // Upcoming Appointments (child of Reports)
  { name: 'screens.nextAppointments.read', description: 'Upcoming Appointments - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.nextAppointments.full', description: 'Upcoming Appointments - Full Control', category: 'screens', action: 'full' },

  // Sales Report (child of Reports)
  { name: 'screens.salesReport.read', description: 'Sales Report - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.salesReport.full', description: 'Sales Report - Full Control', category: 'screens', action: 'full' },

  // Services & Products
  { name: 'screens.serviceProducts.read', description: 'Services & Products - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.serviceProducts.full', description: 'Services & Products - Full Control', category: 'screens', action: 'full' },

  // CRM Management (parent screen)
  { name: 'screens.crm.read', description: 'CRM Management - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.crm.full', description: 'CRM Management - Full Control', category: 'screens', action: 'full' },

  // SMS
  { name: 'screens.sms.read', description: 'SMS - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.sms.full', description: 'SMS - Full Control', category: 'screens', action: 'full' },

  // Reminders
  { name: 'screens.reminders.read', description: 'Reminders - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.reminders.full', description: 'Reminders - Full Control', category: 'screens', action: 'full' },

  // Clinic Setup (parent screen)
  { name: 'screens.clinicSetup.read', description: 'Clinic Setup - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.clinicSetup.full', description: 'Clinic Setup - Full Control', category: 'screens', action: 'full' },

  // Shifts Management
  { name: 'screens.shiftsManagement.read', description: 'Shifts Management - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.shiftsManagement.full', description: 'Shifts Management - Full Control', category: 'screens', action: 'full' },

  // Visit Types
  { name: 'screens.visitTypes.read', description: 'Visit Types - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.visitTypes.full', description: 'Visit Types - Full Control', category: 'screens', action: 'full' },

  // Forms & Certificates
  { name: 'screens.formsAndCertificates.read', description: 'Forms & Certificates - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.formsAndCertificates.full', description: 'Forms & Certificates - Full Control', category: 'screens', action: 'full' },

  // Boarding & ICU
  { name: 'screens.boardingAndIcu.read', description: 'Boarding & ICU - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.boardingAndIcu.full', description: 'Boarding & ICU - Full Control', category: 'screens', action: 'full' },

  // Import Data (parent module)
  { name: 'screens.importData.read', description: 'Import Data - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.importData.full', description: 'Import Data - Full Control', category: 'screens', action: 'full' },

  // Import Clients & Pets
  { name: 'screens.importClients.read', description: 'Import Clients & Pets - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.importClients.full', description: 'Import Clients & Pets - Full Control', category: 'screens', action: 'full' },

  // API-level permissions for reminders
  { name: 'reminders.read', description: 'Reminders - Read', category: 'reminders', action: 'read' },
  { name: 'reminders.write', description: 'Reminders - Write', category: 'reminders', action: 'write' },

  // Special Permissions
  { name: 'patients.hidePhone', description: 'Hide Phone Numbers in Patients', category: 'patients', action: 'hidePhone' },

  // API-level permissions (for backwards compatibility)
  { name: 'users.read', description: 'Users - Read', category: 'users', action: 'read' },
  { name: 'users.create', description: 'Users - Create', category: 'users', action: 'create' },
  { name: 'users.update', description: 'Users - Update', category: 'users', action: 'update' },
  { name: 'users.deactivate', description: 'Users - Deactivate', category: 'users', action: 'delete' },
  { name: 'users.managePermissions', description: 'Users - Manage Permissions', category: 'users', action: 'full' },
  { name: 'appointments.read', description: 'Appointments - Read', category: 'appointments', action: 'read' },
  { name: 'appointments.create', description: 'Appointments - Create', category: 'appointments', action: 'create' },
  { name: 'appointments.update', description: 'Appointments - Update', category: 'appointments', action: 'update' },
  { name: 'appointments.delete', description: 'Appointments - Delete', category: 'appointments', action: 'delete' },
];

/**
 * Ensures invoice_items table has all required columns.
 * Bypasses Prisma migration pipeline — runs raw SQL with IF NOT EXISTS.
 * Safe to run every startup (idempotent).
 */
export async function ensureInvoiceColumns(): Promise<void> {
  try {
    // Each statement must be a separate call (Prisma doesn't support multi-statement)
    await prisma.$executeRawUnsafe(`ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "priceBeforeTax" DOUBLE PRECISION`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 15`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "invoice_items" ADD COLUMN IF NOT EXISTS "discount" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    // Backfill priceBeforeTax from unitPrice where NULL
    await prisma.$executeRawUnsafe(`UPDATE "invoice_items" SET "priceBeforeTax" = "unitPrice" / (1 + "taxRate" / 100) WHERE "priceBeforeTax" IS NULL`);
    console.log('✅ Invoice columns ensured');
  } catch (error) {
    console.error('⚠️ ensureInvoiceColumns failed (non-fatal):', error);
  }
}

/**
 * Ensures service_products table has daftraCode and barcode columns.
 * Bypasses Prisma migration pipeline — runs raw SQL with IF NOT EXISTS.
 * Safe to run every startup (idempotent).
 */
export async function ensureServiceProductColumns(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "daftraCode" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "service_products" ADD COLUMN IF NOT EXISTS "barcode" TEXT`);
    console.log('✅ Service product columns ensured');
  } catch (error) {
    console.error('⚠️ ensureServiceProductColumns failed (non-fatal):', error);
  }
}

/**
 * Auto-creates missing permissions and links *.full to ADMIN role on server startup.
 * Idempotent — safe to run every startup. Only creates what's missing.
 */
export async function ensureScreenPermissions(): Promise<void> {
  try {
    let created = 0;
    const newPermissionIds: string[] = [];

    for (const perm of ALL_PERMISSIONS) {
      const existing = await prisma.permission.findUnique({
        where: { name: perm.name },
      });

      if (!existing) {
        const newPerm = await prisma.permission.create({ data: perm });
        created++;
        // Track *.full permissions for ADMIN auto-link
        if (perm.action === 'full' || perm.name.endsWith('.full')) {
          newPermissionIds.push(newPerm.id);
        }
      }
    }

    // Auto-link new *.full permissions to ADMIN role
    if (newPermissionIds.length > 0) {
      const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
      if (adminRole) {
        for (const permId of newPermissionIds) {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permId,
              },
            },
            update: {},
            create: {
              roleId: adminRole.id,
              permissionId: permId,
            },
          });
        }
        console.log(`🔗 Auto-linked ${newPermissionIds.length} new permissions to ADMIN role`);
      }
    }

    if (created > 0) {
      console.log(`📝 Auto-created ${created} new permissions`);
    }
  } catch (error) {
    console.error('⚠️ ensureScreenPermissions failed (non-fatal):', error);
    // Non-fatal — server continues even if permission seeding fails
  }
}
