import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ALL_PERMISSIONS } from '../src/services/ensurePermissions';

const prisma = new PrismaClient();

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
    'screens.boardingManagement.full',
    'screens.invoices.full',
    'screens.userManagement.full',
    'screens.rolesPermissions.full',
    'screens.audit.full',
    'screens.flowBoard.full',
    'flowBoard.checkout',
    'screens.reports.full',
    'screens.nextAppointments.full',
    'screens.salesReport.full',
    'salesReport.export',
    'screens.serviceProducts.full',
    'screens.crm.full',
    'screens.sms.full',
    'screens.reminders.full',
    'screens.clinicSetup.full',
    'screens.shiftsManagement.full',
    'screens.visitTypes.full',
    'screens.formsAndCertificates.full',
    'screens.boardingAndIcu.full',
    'screens.importData.full',
    'screens.importClients.full',
    // API-level permissions
    'reminders.read',
    'reminders.write',
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
    // Boarding Management - Full Control
    'screens.boardingManagement.full',
    // Invoices - Read Only
    'screens.invoices.read',
    // Flow Board - Full Control
    'screens.flowBoard.full',
    // Reports - Read Only
    'screens.reports.read',
    'screens.nextAppointments.read',
    'screens.salesReport.read',
    // Clinic Setup - Read Only (for viewing schedules)
    'screens.clinicSetup.read',
    'screens.shiftsManagement.read',
    'screens.visitTypes.read',
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
    // Boarding Management - Full Control
    'screens.boardingManagement.full',
    // Flow Board - Full Control
    'screens.flowBoard.full',
    // Reports - Read Only
    'screens.reports.read',
    'screens.nextAppointments.read',
    'screens.salesReport.read',
    // Clinic Setup - Read Only (for booking)
    'screens.clinicSetup.read',
    'screens.shiftsManagement.read',
    'screens.visitTypes.read',
    // Import Data - Full Control
    'screens.importData.full',
    'screens.importClients.full',
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
  for (const perm of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ تم إنشاء ${ALL_PERMISSIONS.length} صلاحية`);

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
