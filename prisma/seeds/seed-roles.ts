import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from './seed-permissions';

export const ROLES = [
  {
    name: 'VISITOR',
    description: 'Unauthenticated visitor; public content only',
    permissions: [] as string[],
  },
  {
    name: 'MEMBER',
    description: 'Registered NKST member; verified members participate fully',
    permissions: [] as string[],
  },
  {
    name: 'GROUP_ADMIN',
    description: 'Functional group admin; reviews join requests and moderates group posts',
    permissions: ['group:moderate', 'post:moderate', 'post:pin', 'report:handle', 'announcement:publish'],
  },
  {
    name: 'CHURCH_ADMIN',
    description: 'One per church; verifies members, moderates church content, manages gallery, library, and marketplace pool',
    permissions: [
      'church:update_details',
      'member:verify',
      'member:suspend',
      'member:view_private',
      'post:moderate',
      'post:pin',
      'report:handle',
      'group:create_church',
      'group:moderate',
      'gallery:manage',
      'resource:review',
      'resource:manage_church',
      'seller:approve',
      'marketplace:manage_pool',
      'announcement:publish',
      'audit:read',
    ],
  },
  {
    name: 'PLATFORM_ADMIN',
    description: 'Single seeded super-user affiliated with National HQ (Mkar); full platform oversight',
    permissions: PERMISSIONS.map((p) => p.code),
  },
];

export async function seedRoles(prisma: PrismaClient) {
  console.log('Seeding roles and role-permission mappings...');
  for (const roleDef of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: {
        name: roleDef.name,
        description: roleDef.description,
      },
    });

    for (const permCode of roleDef.permissions) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } });
      if (!permission) continue;
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
  console.log(`Seeded ${ROLES.length} roles.`);
}
