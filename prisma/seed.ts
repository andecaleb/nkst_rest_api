import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/seed-permissions';
import { seedRoles } from './seeds/seed-roles';
import { seedAdmin } from './seeds/seed-admin';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting NKST API database seed...');
  await seedPermissions(prisma);
  await seedRoles(prisma);
  await seedAdmin(prisma);
  console.log('NKST API database seed completed successfully.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
