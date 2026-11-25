import { PrismaClient, Gender, VerificationState, ProfileVisibility, ChurchStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin(prisma: PrismaClient) {
  console.log('Seeding National Headquarters (Mkar) church and Platform Admin...');

  // 1. Seed National Headquarters, Mkar, Benue State (03-churches-and-affiliation.md)
  const hqChurch = await prisma.church.upsert({
    where: {
      name_lga: {
        name: 'NKST National Headquarters, Mkar',
        lga: 'Gboko',
      },
    },
    update: {
      isHeadquarters: true,
      status: ChurchStatus.active,
    },
    create: {
      name: 'NKST National Headquarters, Mkar',
      state: 'Benue',
      lga: 'Gboko',
      town: 'Mkar',
      address: 'NKST Church Headquarters, Mkar, Gboko LGA, Benue State, Nigeria',
      landmark: 'Mkar Hill / NKST Synod Secretariat',
      phones: ['+2348000000001'],
      email: 'hq@nkst.org.ng',
      latitude: 7.3195,
      longitude: 9.0378,
      isHeadquarters: true,
      status: ChurchStatus.active,
    },
  });

  // Ensure HQ Church has a Gallery (1:1)
  await prisma.gallery.upsert({
    where: { churchId: hqChurch.id },
    update: {},
    create: { churchId: hqChurch.id },
  });

  // 2. Seed Platform Admin member affiliated with Mkar HQ (01-product-overview.md)
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@nkst.org.ng';
  const adminPhone = process.env.SEED_ADMIN_PHONE || '+2348000000001';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe@123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminMember = await prisma.member.upsert({
    where: { email: adminEmail },
    update: {
      isPlatformAdmin: true,
      verificationState: VerificationState.verified,
      platformVerified: true,
    },
    create: {
      firstName: 'NKST',
      middleName: 'Platform',
      surname: 'Administrator',
      email: adminEmail,
      phone: adminPhone,
      passwordHash,
      gender: Gender.male,
      dateOfBirth: new Date('1985-01-01'),
      state: 'Benue',
      lga: 'Gboko',
      residentialLocation: 'Mkar, Gboko, Benue State',
      churchId: hqChurch.id,
      verificationState: VerificationState.verified,
      platformVerified: true,
      profileVisibility: ProfileVisibility.public,
      isPlatformAdmin: true,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
    },
  });

  // Assign Platform Admin as HQ Church Admin if none assigned
  if (!hqChurch.adminMemberId) {
    await prisma.church.update({
      where: { id: hqChurch.id },
      data: { adminMemberId: adminMember.id },
    });
  }

  // Assign PLATFORM_ADMIN role
  const platformRole = await prisma.role.findUnique({ where: { name: 'PLATFORM_ADMIN' } });
  if (platformRole) {
    const existing = await prisma.memberRole.findFirst({
      where: { memberId: adminMember.id, roleId: platformRole.id },
    });
    if (!existing) {
      await prisma.memberRole.create({
        data: {
          memberId: adminMember.id,
          roleId: platformRole.id,
          churchId: hqChurch.id,
          assignedBy: adminMember.id,
        },
      });
    }
  }

  // Default notification preference for admin
  await prisma.notificationPreference.upsert({
    where: { memberId: adminMember.id },
    update: {},
    create: { memberId: adminMember.id },
  });

  console.log(`Seeded HQ Church (${hqChurch.id}) and Platform Admin (${adminEmail}).`);
}
