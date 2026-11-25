import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import {
  VerificationPathway,
  VerificationRequestStatus,
  VerificationState,
} from '@prisma/client';
import { OnboardingService } from '../../src/modules/onboarding/onboarding.service';
import { AuthenticatedUser } from '../../src/common/decorators/current-user.decorator';

describe('OnboardingService (Unit)', () => {
  let service: OnboardingService;
  let prisma: any;

  const unverifiedMember: AuthenticatedUser = {
    id: 'member-1',
    email: 'm1@example.com',
    phone: '+2348001',
    churchId: 'church-1',
    verificationState: VerificationState.registered,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  const verifiedMember: AuthenticatedUser = {
    id: 'member-2',
    email: 'm2@example.com',
    phone: '+2348002',
    churchId: 'church-2',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: [],
    roles: ['MEMBER'],
  };

  const churchAdmin: AuthenticatedUser = {
    id: 'admin-1',
    email: 'ca@example.com',
    phone: '+2348003',
    churchId: 'church-1',
    verificationState: VerificationState.verified,
    isPlatformAdmin: false,
    administeredChurchIds: ['church-1'],
    roles: ['MEMBER', 'CHURCH_ADMIN'],
  };

  beforeEach(() => {
    prisma = {
      verificationRequest: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      acknowledgement: {
        findUnique: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      member: {
        update: jest.fn(),
        findFirst: jest.fn(),
      },
      church: { findUnique: jest.fn() },
      post: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
      photo: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      resource: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      comment: { updateMany: jest.fn().mockResolvedValue({ count: 3 }) },
      groupJoinRequest: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      notification: { create: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn((cb: any) => cb(prisma)),
    };
    service = new OnboardingService(prisma);
  });

  it('blocks self-acknowledgement on Pathway B', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      memberId: verifiedMember.id,
      pathway: VerificationPathway.acknowledgement,
      status: VerificationRequestStatus.submitted,
      church: { adminMemberId: 'admin-1' },
    });

    await expect(
      service.acknowledgeRequest('req-1', verifiedMember, { note: 'Self' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('blocks duplicate acknowledgement from the same verified member', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      memberId: unverifiedMember.id,
      pathway: VerificationPathway.acknowledgement,
      status: VerificationRequestStatus.submitted,
      church: { adminMemberId: 'admin-1' },
    });
    prisma.acknowledgement.findUnique.mockResolvedValue({ id: 'ack-existing' });

    await expect(
      service.acknowledgeRequest('req-1', verifiedMember, {}),
    ).rejects.toThrow(ConflictException);
  });

  it('moves Pathway B request to ready_for_review at 10 acknowledgements without auto-verifying', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      memberId: unverifiedMember.id,
      pathway: VerificationPathway.acknowledgement,
      status: VerificationRequestStatus.submitted,
      church: { adminMemberId: 'admin-1' },
    });
    prisma.acknowledgement.findUnique.mockResolvedValue(null);
    prisma.acknowledgement.create.mockResolvedValue({ id: 'ack-10' });
    prisma.acknowledgement.count.mockResolvedValue(10);

    const res = await service.acknowledgeRequest('req-1', verifiedMember, { note: 'Known in fellowship' });

    expect(res.acknowledgementCount).toBe(10);
    expect(res.readyForReview).toBe(true);
    expect(prisma.verificationRequest.update).toHaveBeenCalledWith({
      where: { id: 'req-1' },
      data: { status: VerificationRequestStatus.ready_for_review },
    });
    // Must NOT auto-verify the member
    expect(prisma.member.update).not.toHaveBeenCalled();
  });

  it('releases all held_unverified content when Church Admin approves verification', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      memberId: unverifiedMember.id,
      churchId: 'church-1',
      pathway: VerificationPathway.catechism,
      status: VerificationRequestStatus.ready_for_review,
      _count: { acknowledgements: 0 },
    });
    prisma.verificationRequest.update.mockResolvedValue({
      id: 'req-1',
      status: VerificationRequestStatus.approved,
    });

    const result = await service.approveRequest('req-1', churchAdmin, {
      decisionNote: 'Confirmed in catechism register',
    });

    expect(result.releasedHeldContent).toEqual({
      postsReleasedToReview: 2,
      photosReleasedToReview: 1,
      resourcesReleasedToReview: 1,
      commentsMadeVisible: 3,
      groupJoinRequestsReleased: 1,
    });
    expect(prisma.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: unverifiedMember.id },
        data: expect.objectContaining({ verificationState: VerificationState.verified }),
      }),
    );
  });

  it('prevents Church Admin from approving requests belonging to another church', async () => {
    prisma.verificationRequest.findUnique.mockResolvedValue({
      id: 'req-other',
      memberId: 'member-99',
      churchId: 'church-999',
      pathway: VerificationPathway.catechism,
      _count: { acknowledgements: 0 },
    });

    await expect(service.approveRequest('req-other', churchAdmin, {})).rejects.toThrow(
      ForbiddenException,
    );
  });
});
