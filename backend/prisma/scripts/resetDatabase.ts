/**
 * 🗄️ Database Reset Script - Fluff N' Woof
 * =========================================
 *
 * This script safely resets the database for testing purposes while preserving:
 * ✅ Roles & Permissions (system configuration)
 * ✅ Services & Products (business configuration)
 * ✅ Visit Types (clinic configuration)
 * ✅ Reminder Settings & Message Templates (CRM configuration)
 * ✅ One Admin user for login
 *
 * ❌ DELETES all transactional data:
 * - Owners (customers)
 * - Pets
 * - Appointments
 * - Medical Records & Prescriptions
 * - Vaccinations
 * - Invoices & Payments
 * - Staff Notifications
 * - Reminder Logs
 * - SMS Logs
 * - Audit Logs
 * - User Preferences
 * - Vet Schedules (will be recreated for admin)
 * - All Users except Admin
 *
 * Usage: npx tsx prisma/scripts/resetDatabase.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ========================================
// Configuration
// ========================================
const ADMIN_CONFIG = {
  email: 'admin@fluffnwoof.com',
  password: 'Admin@123', // Change this!
  firstName: 'Admin',
  lastName: 'User',
  phone: '+966500000000',
};

const DEFAULT_SCHEDULE = [
  { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
  { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
  { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
  { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
  { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: true },
  { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: false },
  { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '18:00', isWorkingDay: false },
];

// ========================================
// Helper Functions
// ========================================
const logStep = (step: number, total: number, message: string) => {
  console.log(`\n[${step}/${total}] ${message}`);
};

const logSuccess = (message: string) => {
  console.log(`   ✅ ${message}`);
};

const logInfo = (message: string) => {
  console.log(`   ℹ️  ${message}`);
};

const logWarning = (message: string) => {
  console.log(`   ⚠️  ${message}`);
};

const logError = (message: string) => {
  console.log(`   ❌ ${message}`);
};

// ========================================
// Main Reset Function
// ========================================
async function resetDatabase() {
  console.log('\n' + '='.repeat(60));
  console.log('🗄️  FLUFF N\' WOOF - DATABASE RESET');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: This will delete ALL transactional data!');
  console.log('   Preserved: Roles, Permissions, Services, Products, Visit Types\n');

  const totalSteps = 12;
  let currentStep = 0;

  try {
    // ========================================
    // Step 1: Get counts before deletion
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '📊 Getting current data counts...');

    const countsBefore = {
      owners: await prisma.owner.count(),
      pets: await prisma.pet.count(),
      appointments: await prisma.appointment.count(),
      medicalRecords: await prisma.medicalRecord.count(),
      invoices: await prisma.invoice.count(),
      users: await prisma.user.count(),
      vaccinations: await prisma.vaccination.count(),
      smsLogs: await prisma.smsLog.count(),
    };

    logInfo(`Owners: ${countsBefore.owners}`);
    logInfo(`Pets: ${countsBefore.pets}`);
    logInfo(`Appointments: ${countsBefore.appointments}`);
    logInfo(`Medical Records: ${countsBefore.medicalRecords}`);
    logInfo(`Invoices: ${countsBefore.invoices}`);
    logInfo(`Users: ${countsBefore.users}`);
    logInfo(`Vaccinations: ${countsBefore.vaccinations}`);
    logInfo(`SMS Logs: ${countsBefore.smsLogs}`);

    // ========================================
    // Step 2: Delete Staff Notifications
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '🔔 Deleting staff notifications...');
    const deletedNotifications = await prisma.staffNotification.deleteMany();
    logSuccess(`Deleted ${deletedNotifications.count} notifications`);

    // ========================================
    // Step 3: Delete Reminder Logs
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '📝 Deleting reminder logs...');
    const deletedReminderLogs = await prisma.reminderLog.deleteMany();
    logSuccess(`Deleted ${deletedReminderLogs.count} reminder logs`);

    // ========================================
    // Step 4: Delete Owner OTPs
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '🔐 Deleting owner OTPs...');
    const deletedOtps = await prisma.ownerOtp.deleteMany();
    logSuccess(`Deleted ${deletedOtps.count} OTPs`);

    // ========================================
    // Step 5: Delete Invoices & Payments
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '💰 Deleting payments and invoices...');
    const deletedPayments = await prisma.payment.deleteMany();
    const deletedInvoiceItems = await prisma.invoiceItem.deleteMany();
    const deletedInvoices = await prisma.invoice.deleteMany();
    logSuccess(`Deleted ${deletedPayments.count} payments`);
    logSuccess(`Deleted ${deletedInvoiceItems.count} invoice items`);
    logSuccess(`Deleted ${deletedInvoices.count} invoices`);

    // ========================================
    // Step 6: Delete Medical Records
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '📋 Deleting medical records...');
    const deletedPrescriptions = await prisma.prescription.deleteMany();
    const deletedAttachments = await prisma.medicalAttachment.deleteMany();
    const deletedMedicalRecords = await prisma.medicalRecord.deleteMany();
    logSuccess(`Deleted ${deletedPrescriptions.count} prescriptions`);
    logSuccess(`Deleted ${deletedAttachments.count} attachments`);
    logSuccess(`Deleted ${deletedMedicalRecords.count} medical records`);

    // ========================================
    // Step 7: Delete Vaccinations
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '💉 Deleting vaccinations...');
    const deletedVaccinations = await prisma.vaccination.deleteMany();
    logSuccess(`Deleted ${deletedVaccinations.count} vaccinations`);

    // ========================================
    // Step 8: Delete Appointments
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '📅 Deleting appointments...');
    const deletedAppointments = await prisma.appointment.deleteMany();
    logSuccess(`Deleted ${deletedAppointments.count} appointments`);

    // ========================================
    // Step 9: Delete Pets & Owners
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '🐾 Deleting pets and owners...');
    const deletedPets = await prisma.pet.deleteMany();
    const deletedOwners = await prisma.owner.deleteMany();
    logSuccess(`Deleted ${deletedPets.count} pets`);
    logSuccess(`Deleted ${deletedOwners.count} owners`);

    // ========================================
    // Step 10: Delete Logs & User Data
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '📜 Deleting logs and user data...');
    const deletedSmsLogs = await prisma.smsLog.deleteMany();
    const deletedAuditLogs = await prisma.auditLog.deleteMany();
    const deletedUserPrefs = await prisma.userPreferences.deleteMany();
    const deletedUserPerms = await prisma.userPermission.deleteMany();
    logSuccess(`Deleted ${deletedSmsLogs.count} SMS logs`);
    logSuccess(`Deleted ${deletedAuditLogs.count} audit logs`);
    logSuccess(`Deleted ${deletedUserPrefs.count} user preferences`);
    logSuccess(`Deleted ${deletedUserPerms.count} user permissions`);

    // ========================================
    // Step 11: Delete Vet Schedules & Users
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '👥 Deleting vet schedules and users...');
    const deletedVetSchedules = await prisma.vetSchedule.deleteMany();
    const deletedVetDaysOff = await prisma.vetDayOff.deleteMany();
    const deletedVetBreaks = await prisma.vetBreak.deleteMany();
    const deletedVetPeriods = await prisma.vetSchedulePeriod.deleteMany();
    const deletedUsers = await prisma.user.deleteMany();
    logSuccess(`Deleted ${deletedVetSchedules.count} vet schedules`);
    logSuccess(`Deleted ${deletedVetDaysOff.count} vet days off`);
    logSuccess(`Deleted ${deletedVetBreaks.count} vet breaks`);
    logSuccess(`Deleted ${deletedVetPeriods.count} vet schedule periods`);
    logSuccess(`Deleted ${deletedUsers.count} users`);

    // ========================================
    // Step 12: Create Admin User
    // ========================================
    currentStep++;
    logStep(currentStep, totalSteps, '👤 Creating admin user...');

    // Find ADMIN role
    const adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN' },
    });

    if (!adminRole) {
      logError('ADMIN role not found! Please run seed first.');
      throw new Error('ADMIN role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_CONFIG.password, 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: ADMIN_CONFIG.email,
        password: hashedPassword,
        firstName: ADMIN_CONFIG.firstName,
        lastName: ADMIN_CONFIG.lastName,
        phone: ADMIN_CONFIG.phone,
        isActive: true,
        isBookable: true,
        roleId: adminRole.id,
      },
    });

    logSuccess(`Created admin user: ${adminUser.email}`);

    // Create default schedule for admin
    for (const schedule of DEFAULT_SCHEDULE) {
      await prisma.vetSchedule.create({
        data: {
          vetId: adminUser.id,
          dayOfWeek: schedule.dayOfWeek as any,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          isWorkingDay: schedule.isWorkingDay,
        },
      });
    }
    logSuccess('Created default schedule for admin');

    // Create active schedule period for admin
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31); // Dec 31

    await prisma.vetSchedulePeriod.create({
      data: {
        vetId: adminUser.id,
        startDate: today,
        endDate: endOfYear,
        workingDays: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'],
        workStartTime: '09:00',
        workEndTime: '18:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00',
        isActive: true,
      },
    });
    logSuccess('Created active schedule period for admin');

    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE RESET COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

    // Show preserved data
    const preservedRoles = await prisma.role.count();
    const preservedPermissions = await prisma.permission.count();
    const preservedServices = await prisma.serviceProduct.count();
    const preservedCategories = await prisma.category.count();
    const preservedVisitTypes = await prisma.visitTypeConfig.count();
    const preservedReminderSettings = await prisma.reminderSetting.count();
    const preservedTemplates = await prisma.messageTemplate.count();

    console.log('\n📦 PRESERVED DATA:');
    console.log(`   • Roles: ${preservedRoles}`);
    console.log(`   • Permissions: ${preservedPermissions}`);
    console.log(`   • Categories: ${preservedCategories}`);
    console.log(`   • Services/Products: ${preservedServices}`);
    console.log(`   • Visit Types: ${preservedVisitTypes}`);
    console.log(`   • Reminder Settings: ${preservedReminderSettings}`);
    console.log(`   • Message Templates: ${preservedTemplates}`);

    console.log('\n🔑 ADMIN LOGIN:');
    console.log(`   • Email: ${ADMIN_CONFIG.email}`);
    console.log(`   • Password: ${ADMIN_CONFIG.password}`);

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ========================================
// Execute
// ========================================
resetDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
