import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  // Get all users with roles and their permissions
  const users = await prisma.user.findMany({
    include: { role: true }
  });

  for (const user of users) {
    console.log('\n=== User:', user.email, '===');
    console.log('Role:', user.role?.name);

    if (user.roleId) {
      const perms = await prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true }
      });
      const flowBoardPerm = perms.find(p => p.permission.name.includes('flowBoard'));
      const usersReadPerm = perms.find(p => p.permission.name === 'users.read');
      console.log('Has flowBoard permission:', flowBoardPerm?.permission.name || 'NO');
      console.log('Has users.read permission:', usersReadPerm ? 'YES' : 'NO');
    }
  }

  await prisma.$disconnect();
}
check();
