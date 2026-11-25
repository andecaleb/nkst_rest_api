import { PrismaClient } from '@prisma/client';

export const PERMISSIONS = [
  { code: 'church:create', description: 'Create church records (Platform Admin)' },
  { code: 'church:update_core', description: 'Update church name, state, and LGA (Platform Admin)' },
  { code: 'church:update_details', description: 'Update church photo and details (Church/Platform Admin)' },
  { code: 'church:assign_admin', description: 'Assign or replace a church admin (Platform Admin)' },
  { code: 'church:deactivate', description: 'Mark a church inactive (Platform Admin)' },
  { code: 'member:verify', description: 'Verify or reject member verification requests' },
  { code: 'member:suspend', description: 'Suspend or reinstate members' },
  { code: 'member:view_private', description: 'View private profile fields for church administration' },
  { code: 'post:moderate', description: 'Approve, reject, or request corrections on posts' },
  { code: 'post:pin', description: 'Pin important posts or official announcements' },
  { code: 'report:handle', description: 'Review and action content reports' },
  { code: 'group:create_church', description: 'Create church-scoped groups' },
  { code: 'group:create_national', description: 'Create national-scoped groups' },
  { code: 'group:moderate', description: 'Approve join requests and moderate group posts' },
  { code: 'gallery:manage', description: 'Create albums and review gallery photos' },
  { code: 'resource:review', description: 'Review and approve member resources for church collection' },
  { code: 'resource:manage_church', description: 'Add and manage church-owned resources' },
  { code: 'seller:approve', description: 'Approve sellers and grant seller access periods' },
  { code: 'marketplace:manage_pool', description: 'Monitor and close hard-copy fulfilment pool orders' },
  { code: 'announcement:publish', description: 'Publish official announcements without moderation' },
  { code: 'recitation:publish', description: 'Create and publish national recitations (Platform Admin)' },
  { code: 'audit:read', description: 'Read audit logs and platform counts' },
] as const;

export async function seedPermissions(prisma: PrismaClient) {
  console.log('Seeding permissions...');
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description },
      create: perm,
    });
  }
  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}
