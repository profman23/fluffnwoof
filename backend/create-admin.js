// Script to create admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    console.log('Creating admin user...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.create({
      data: {
        email: 'admin@fluffnwoof.com',
        password: hashedPassword,
        firstName: 'أحمد',
        lastName: 'محمد',
        role: 'ADMIN',
        phone: '01234567890',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Password: admin123');
    console.log('👤 Name:', admin.firstName, admin.lastName);
    console.log('\n👉 You can now login at: http://localhost:5173');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️ Admin user already exists!');
      console.log('📧 Email: admin@fluffnwoof.com');
      console.log('🔑 Password: admin123');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
