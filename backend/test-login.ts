import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@fluffnwoof.com' },
    });

    console.log('User:', user ? 'Found' : 'Not found');

    if (user) {
      console.log('User details:');
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Active:', user.isActive);
      console.log('  Password hash:', user.password.substring(0, 30) + '...');

      const isValid = await bcrypt.compare('Admin@123', user.password);
      console.log('Password "Admin@123" valid:', isValid);

      // Try different passwords
      const testPasswords = ['admin@123', 'ADMIN@123', 'Admin@123 ', ' Admin@123'];
      for (const pwd of testPasswords) {
        const valid = await bcrypt.compare(pwd, user.password);
        if (valid) {
          console.log(`Password "${pwd}" is valid!`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
