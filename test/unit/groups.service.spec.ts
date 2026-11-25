import { ForbiddenException } from '@nestjs/common';
import {
  Gender,
  GenderRestriction,
  GroupJoinMode,
  GroupJoinRequestStatus,
  GroupScope,
  GroupVisibility,
  VerificationState,
} from '@prisma/client';
import { GroupsService } from '../../src/modules/events/groups/groups.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('GroupsService (Unit)', () => {
  let service: GroupsService;
  let prisma: any;

  const user: AuthenticatedUser = {
    id: 'member-1',
    email: 'u@example.com',
    phone: '+2348001',
    churchId: 'church-1',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  beforeEach(() => {
    prisma = {
      group: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
      member: { findUnique: jest.fn() },
      groupMember: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      groupJoinRequest: { create: jest.fn() },
      notification: { createMany: jest.fn() },
    };
    service = new GroupsService(prisma);
  });

  it('blocks member who fails gender and age eligibility rules server-side (GRP-02)', async () => {
    prisma.group.findFirst.mockResolvedValue({
      id: 'grp-women',
      name: 'Young Women Fellowship',
      scope: GroupScope.church,
      churchId: 'church-1',
      visibility: GroupVisibility.public,
      joinMode: GroupJoinMode.open,
      genderRestriction: GenderRestriction.female,
      minAge: 18,
      maxAge: 35,
      verifiedOnly: true,
      allowedChurches: [{ churchId: 'church-1' }],
    });
    prisma.member.findUnique.mockResolvedValue({
      id: user.id,
      gender: Gender.male,
      dateOfBirth: new Date('1980-01-01'),
      verificationState: VerificationState.verified,
      churchId: 'church-1',
    });
    prisma.groupMember.findUnique.mockResolvedValue(null);

    await expect(service.joinOrRequestGroup('grp-women', user)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('holds join request as held_unverified for unverified members on non-verified-only groups (GRP-08)', async () => {
    prisma.group.findFirst.mockResolvedValue({
      id: 'grp-choir',
      name: 'General Choir',
      scope: GroupScope.church,
      churchId: 'church-1',
      visibility: GroupVisibility.public,
      joinMode: GroupJoinMode.open,
      genderRestriction: GenderRestriction.any,
      minAge: null,
      maxAge: null,
      verifiedOnly: false,
      allowedChurches: [{ churchId: 'church-1' }],
    });
    prisma.member.findUnique.mockResolvedValue({
      id: user.id,
      gender: Gender.male,
      dateOfBirth: new Date('1998-01-01'),
      verificationState: VerificationState.registered,
      churchId: 'church-1',
    });
    prisma.groupMember.findUnique.mockResolvedValue(null);
    prisma.groupJoinRequest.create.mockResolvedValue({
      id: 'req-held',
      status: GroupJoinRequestStatus.held_unverified,
    });

    const result = await service.joinOrRequestGroup('grp-choir', {
      ...user,
      verificationState: VerificationState.registered,
    });

    expect(result.joined).toBe(false);
    expect(result.status).toBe(GroupJoinRequestStatus.held_unverified);
  });

  it('auto-joins eligible verified member to an open public group (GRP-03)', async () => {
    prisma.group.findFirst.mockResolvedValue({
      id: 'grp-open',
      name: 'Bible Study',
      scope: GroupScope.church,
      churchId: 'church-1',
      visibility: GroupVisibility.public,
      joinMode: GroupJoinMode.open,
      genderRestriction: GenderRestriction.any,
      minAge: 18,
      maxAge: 60,
      verifiedOnly: true,
      allowedChurches: [{ churchId: 'church-1' }],
    });
    prisma.member.findUnique.mockResolvedValue({
      id: user.id,
      gender: Gender.male,
      dateOfBirth: new Date('1998-01-01'),
      verificationState: VerificationState.verified,
      churchId: 'church-1',
    });
    prisma.groupMember.findUnique.mockResolvedValue(null);
    prisma.groupMember.create.mockResolvedValue({ id: 'gm-1', role: 'member' });

    const result = await service.joinOrRequestGroup('grp-open', user);
    expect(result.joined).toBe(true);
  });
});
