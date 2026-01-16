import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    console.log('Resetting admin password...');

    const newPassword = 'Admin@123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log('New hash:', hashedPassword.substring(0, 30) + '...');

    // Test the hash immediately
    const testResult = await bcrypt.compare(newPassword, hashedPassword);
    console.log('Hash test:', testResult ? 'PASS' : 'FAIL');

    if (testResult) {
      const user = await prisma.user.update({
        where: { email: 'admin@fluffnwoof.com' },
        data: { password: hashedPassword },
      });

      console.log('Password updated successfully for:', user.email);

      // Verify the update
      const updatedUser = await prisma.user.findUnique({
        where: { email: 'admin@fluffnwoof.com' },
      });

      if (updatedUser) {
        const finalTest = await bcrypt.compare(newPassword, updatedUser.password);
        console.log('Final verification:', finalTest ? 'SUCCESS' : 'FAILED');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
