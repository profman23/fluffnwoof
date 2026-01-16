import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// تعريف صلاحيات الشاشات (Screen-Level Permissions)
const permissions = [
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

  // Reports
  { name: 'screens.reports.read', description: 'Reports - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.reports.full', description: 'Reports - Full Control', category: 'screens', action: 'full' },

  // Services & Products
  { name: 'screens.serviceProducts.read', description: 'Services & Products - Read Only', category: 'screens', action: 'read' },
  { name: 'screens.serviceProducts.full', description: 'Services & Products - Full Control', category: 'screens', action: 'full' },

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

// Define role data
const roles = [
  {
    name: 'ADMIN',
    displayNameEn: 'Administrator',
    displayNameAr: 'مدير النظام',
    description: 'Full system access',
    isSystem: true,
  },
  {
    name: 'VET',
    displayNameEn: 'Veterinarian',
    displayNameAr: 'طبيب بيطري',
    description: 'Veterinarian with medical access',
    isSystem: true,
  },
  {
    name: 'RECEPTIONIST',
    displayNameEn: 'Receptionist',
    displayNameAr: 'موظف استقبال',
    description: 'Front desk operations',
    isSystem: true,
  },
];

// صلاحيات افتراضية لكل دور (Screen-Level)
const rolePermissions: Record<string, string[]> = {
  ADMIN: [
    // Admin has FULL control over all screens
    'screens.dashboard.full',
    'screens.patients.full',
    'screens.appointments.full',
    'screens.medical.full',
    'screens.invoices.full',
    'screens.userManagement.full',
    'screens.rolesPermissions.full',
    'screens.audit.full',
    'screens.flowBoard.full',
    'screens.reports.full',
    'screens.serviceProducts.full',
    // API-level permissions
    'users.read',
    'users.create',
    'users.update',
    'users.deactivate',
    'users.managePermissions',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.delete',
  ],
  VET: [
    // Dashboard - Read Only
    'screens.dashboard.read',
    // Patients - Full Control
    'screens.patients.full',
    // Appointments - Full Control
    'screens.appointments.full',
    // Medical - Full Control
    'screens.medical.full',
    // Invoices - Read Only
    'screens.invoices.read',
    // Flow Board - Full Control
    'screens.flowBoard.full',
    // Reports - Read Only
    'screens.reports.read',
    // API-level permissions
    'users.read',
    'appointments.read',
    'appointments.create',
    'appointments.update',
  ],
  RECEPTIONIST: [
    // Dashboard - Read Only
    'screens.dashboard.read',
    // Patients - Full Control
    'screens.patients.full',
    // Appointments - Full Control
    'screens.appointments.full',
    // Invoices - Full Control
    'screens.invoices.full',
    // Medical - Read Only
    'screens.medical.read',
    // Flow Board - Full Control
    'screens.flowBoard.full',
    // Reports - Read Only
    'screens.reports.read',
    // API-level permissions
    'users.read',
    'appointments.read',
    'appointments.create',
    'appointments.update',
  ],
};

async function main() {
  console.log('🌱 بدء عملية Seeding...');

  // 1. إنشاء الأدوار في قاعدة البيانات
  console.log('📝 إنشاء الأدوار...');
  const createdRoles: Record<string, { id: string }> = {};
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData,
    });
    createdRoles[roleData.name] = role;
  }
  console.log(`✅ تم إنشاء ${roles.length} أدوار`);

  // 2. إنشاء جميع الصلاحيات
  console.log('📝 إنشاء الصلاحيات...');
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ تم إنشاء ${permissions.length} صلاحية`);

  // 3. ربط الصلاحيات بالأدوار
  console.log('🔗 ربط الصلاحيات بالأدوار...');
  for (const roleName of Object.keys(rolePermissions)) {
    const rolePerms = rolePermissions[roleName];
    const role = createdRoles[roleName];

    if (!role) {
      console.log(`⚠️ الدور ${roleName} غير موجود`);
      continue;
    }

    for (const permName of rolePerms) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });

      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }
    console.log(`✅ تم ربط ${rolePerms.length} صلاحية للدور ${roleName}`);
  }

  // 4. إنشاء مستخدم Admin افتراضي
  console.log('👤 إنشاء مستخدم Admin افتراضي...');
  const hashedPassword = await bcrypt.hash('Admin@123', 10);

  // Delete existing admin user if exists
  await prisma.user.deleteMany({
    where: { email: 'admin@fluffnwoof.com' },
  });

  const adminRole = createdRoles['ADMIN'];
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@fluffnwoof.com',
      password: hashedPassword,
      roleId: adminRole.id,
      firstName: 'Admin',
      lastName: 'User',
      phone: '1234567890',
      isActive: true,
    },
  });
  console.log(`✅ تم إنشاء مستخدم Admin: ${adminUser.email}`);

  console.log('🎉 اكتمل Seeding بنجاح!');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
