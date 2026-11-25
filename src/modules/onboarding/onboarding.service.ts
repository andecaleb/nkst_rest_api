import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CommentStatus,
  GroupJoinRequestStatus,
  PhotoStatus,
  PostStatus,
  ResourceStatus,
  VerificationPathway,
  VerificationRequestStatus,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AcknowledgeMemberDto,
  DirectValidateMemberDto,
  RejectVerificationDto,
  ReviewVerificationDto,
  SubmitVerificationRequestDto,
} from './dto/verification.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { REQUIRED_ACKNOWLEDGEMENTS } from '../../common/constants/roles.constant';
import { serializeMemberCard } from '../../common/utils/privacy.util';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * VER-01, VER-02, VER-05, VER-06: Get member's verification status, progress, and full history.
   */
  async getMyVerificationStatus(user: AuthenticatedUser) {
    const [member, requests] = await Promise.all([
      this.prisma.member.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          verificationState: true,
          platformVerified: true,
          churchId: true,
        },
      }),
      this.prisma.verificationRequest.findMany({
        where: { memberId: user.id },
        include: {
          acknowledgements: {
            include: { acknowledger: true },
          },
          reviewer: true,
          church: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      member,
      requests: requests.map((req) => ({
        ...req,
        reviewer: serializeMemberCard(req.reviewer, user),
        acknowledgementCount: req.acknowledgements.length,
        acknowledgementsRequired: REQUIRED_ACKNOWLEDGEMENTS,
        acknowledgementsProgress:
          req.pathway === VerificationPathway.acknowledgement
            ? `${req.acknowledgements.length} of ${REQUIRED_ACKNOWLEDGEMENTS}`
            : null,
        acknowledgements: req.acknowledgements.map((ack) => ({
          id: ack.id,
          note: ack.note,
          createdAt: ack.createdAt,
          acknowledger: serializeMemberCard(ack.acknowledger, user),
        })),
      })),
    };
  }

  /**
   * VER-01, VER-02: Submit a verification request via any of the 4 pathways.
   */
  async submitRequest(user: AuthenticatedUser, dto: SubmitVerificationRequestDto) {
    if (user.verificationState === VerificationState.verified) {
      throw new BadRequestException('Your account is already verified');
    }
    if (user.verificationState === VerificationState.suspended) {
      throw new ForbiddenException('Suspended accounts cannot submit verification requests');
    }

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.verificationRequest.create({
        data: {
          memberId: user.id,
          churchId: user.churchId,
          pathway: dto.pathway,
          programme: dto.programme,
          completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
          evidenceText: dto.evidenceText,
          evidenceFileUrl: dto.evidenceFileUrl,
          status:
            dto.pathway === VerificationPathway.acknowledgement
              ? VerificationRequestStatus.submitted
              : VerificationRequestStatus.ready_for_review,
        },
      });

      await tx.member.update({
        where: { id: user.id },
        data: { verificationState: VerificationState.pending_verification },
      });

      const church = await tx.church.findUnique({ where: { id: user.churchId } });
      if (church?.adminMemberId && dto.pathway !== VerificationPathway.acknowledgement) {
        await tx.notification.create({
          data: {
            memberId: church.adminMemberId,
            type: 'verification_request_received',
            subjectType: 'verification_request',
            subjectId: created.id,
            title: 'New Verification Request',
            body: `A member submitted a ${dto.pathway} verification request for your review.`,
          },
        });
      }

      return created;
    });

    return request;
  }

  /**
   * Pathway B: Ten Acknowledgements.
   * - Only verified members (of any church) can acknowledge
   * - No self-acknowledgement, no duplicates
   * - At 10 acknowledgements -> ready_for_review (not auto-approved!)
   */
  async acknowledgeRequest(
    requestId: string,
    user: AuthenticatedUser,
    dto: AcknowledgeMemberDto,
  ) {
    if (user.verificationState !== VerificationState.verified) {
      throw new ForbiddenException('Only verified members can acknowledge another member');
    }

    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { church: true },
    });

    if (!request) throw new NotFoundException('Verification request not found');
    if (request.pathway !== VerificationPathway.acknowledgement) {
      throw new BadRequestException('This verification request does not use the acknowledgement pathway');
    }
    if (request.memberId === user.id) {
      throw new BadRequestException('Self-acknowledgement is not allowed');
    }
    if (
      request.status === VerificationRequestStatus.approved ||
      request.status === VerificationRequestStatus.rejected
    ) {
      throw new BadRequestException('This verification request has already been decided');
    }

    const existing = await this.prisma.acknowledgement.findUnique({
      where: {
        requestId_acknowledgerId: {
          requestId,
          acknowledgerId: user.id,
        },
      },
    });
    if (existing) {
      throw new ConflictException('You have already acknowledged this verification request');
    }

    const ack = await this.prisma.acknowledgement.create({
      data: {
        requestId,
        acknowledgerId: user.id,
        note: dto.note,
      },
    });

    const totalCount = await this.prisma.acknowledgement.count({ where: { requestId } });

    await this.prisma.notification.create({
      data: {
        memberId: request.memberId,
        type: 'acknowledgement_received',
        subjectType: 'verification_request',
        subjectId: requestId,
        title: 'Verification Acknowledgement Received',
        body: `You now have ${totalCount} of ${REQUIRED_ACKNOWLEDGEMENTS} acknowledgements.`,
      },
    });

    let readyForReview = request.status === VerificationRequestStatus.ready_for_review;
    if (totalCount >= REQUIRED_ACKNOWLEDGEMENTS && !readyForReview) {
      await this.prisma.verificationRequest.update({
        where: { id: requestId },
        data: { status: VerificationRequestStatus.ready_for_review },
      });
      readyForReview = true;

      if (request.church.adminMemberId) {
        await this.prisma.notification.create({
          data: {
            memberId: request.church.adminMemberId,
            type: 'verification_ready_for_review',
            subjectType: 'verification_request',
            subjectId: requestId,
            title: 'Verification Ready for Review',
            body: `A member has reached ${REQUIRED_ACKNOWLEDGEMENTS} acknowledgements and is ready for review.`,
          },
        });
      }
    }

    return {
      acknowledgement: ack,
      acknowledgementCount: totalCount,
      required: REQUIRED_ACKNOWLEDGEMENTS,
      readyForReview,
    };
  }

  /**
   * VER-03: Church Admin verification queue (for their church); Platform Admin sees all.
   */
  async getVerificationQueue(actor: AuthenticatedUser, churchId?: string) {
    const where: any = {
      status: { in: [VerificationRequestStatus.submitted, VerificationRequestStatus.ready_for_review] },
    };

    if (!actor.isPlatformAdmin) {
      where.churchId = { in: actor.administeredChurchIds };
    } else if (churchId) {
      where.churchId = churchId;
    }

    const items = await this.prisma.verificationRequest.findMany({
      where,
      include: {
        member: true,
        church: { select: { id: true, name: true } },
        _count: { select: { acknowledgements: true } },
      },
      orderBy: [{ status: 'desc' }, { createdAt: 'asc' }],
    });

    return items.map((item) => ({
      ...item,
      member: serializeMemberCard(item.member, actor),
      acknowledgementCount: item._count.acknowledgements,
    }));
  }

  /**
   * Approve a verification request and release all held_unverified content (VER-07, Overview 4.2).
   */
  async approveRequest(
    requestId: string,
    actor: AuthenticatedUser,
    dto: ReviewVerificationDto,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
      include: { _count: { select: { acknowledgements: true } } },
    });
    if (!request) throw new NotFoundException('Verification request not found');

    this.assertCanReviewChurch(actor, request.churchId);

    if (
      request.pathway === VerificationPathway.acknowledgement &&
      request._count.acknowledgements < REQUIRED_ACKNOWLEDGEMENTS &&
      !actor.isPlatformAdmin
    ) {
      throw new BadRequestException(
        `Acknowledgement pathway requires at least ${REQUIRED_ACKNOWLEDGEMENTS} acknowledgements before approval`,
      );
    }

    const isPlatformPathway =
      request.pathway === VerificationPathway.platform || actor.isPlatformAdmin;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedReq = await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: VerificationRequestStatus.approved,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          decisionNote: dto.decisionNote,
          ...(dto.completionDate ? { completionDate: new Date(dto.completionDate) } : {}),
        },
      });

      await tx.member.update({
        where: { id: request.memberId },
        data: {
          verificationState: VerificationState.verified,
          ...(isPlatformPathway ? { platformVerified: true } : {}),
        },
      });

      const released = await this.releaseHeldContentTx(tx, request.memberId);

      await tx.notification.create({
        data: {
          memberId: request.memberId,
          type: 'verification_approved',
          subjectType: 'verification_request',
          subjectId: requestId,
          title: 'Membership Verified',
          body: 'Your NKST membership has been verified. Any held content has been released to its review queue.',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'verification:approve',
          entityType: 'verification_request',
          entityId: requestId,
          metadata: { memberId: request.memberId, pathway: request.pathway, released },
        },
      });

      return { request: updatedReq, releasedHeldContent: released };
    });

    return result;
  }

  /**
   * VER-04: Reject a verification request with a mandatory reason.
   */
  async rejectRequest(
    requestId: string,
    actor: AuthenticatedUser,
    dto: RejectVerificationDto,
  ) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Verification request not found');

    this.assertCanReviewChurch(actor, request.churchId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const req = await tx.verificationRequest.update({
        where: { id: requestId },
        data: {
          status: VerificationRequestStatus.rejected,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          decisionNote: dto.reason,
        },
      });

      await tx.member.update({
        where: { id: request.memberId },
        data: { verificationState: VerificationState.rejected },
      });

      await tx.notification.create({
        data: {
          memberId: request.memberId,
          type: 'verification_rejected',
          subjectType: 'verification_request',
          subjectId: requestId,
          title: 'Verification Request Declined',
          body: `Your verification request was declined. Reason: ${dto.reason}. You may resubmit.`,
        },
      });

      return req;
    });

    return updated;
  }

  /**
   * Pathway C (Church Validation) & Pathway D (Platform Validation):
   * Direct validation by Church Admin or Platform Admin.
   */
  async directValidate(actor: AuthenticatedUser, dto: DirectValidateMemberDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, deletedAt: null },
    });
    if (!member) throw new NotFoundException('Member not found');

    this.assertCanReviewChurch(actor, member.churchId);

    const pathway = actor.isPlatformAdmin
      ? VerificationPathway.platform
      : VerificationPathway.church;

    return this.prisma.$transaction(async (tx) => {
      const req = await tx.verificationRequest.create({
        data: {
          memberId: member.id,
          churchId: member.churchId,
          pathway,
          status: VerificationRequestStatus.approved,
          reviewerId: actor.id,
          reviewedAt: new Date(),
          decisionNote: dto.decisionNote || `Directly validated via ${pathway} pathway`,
        },
      });

      await tx.member.update({
        where: { id: member.id },
        data: {
          verificationState: VerificationState.verified,
          ...(pathway === VerificationPathway.platform ? { platformVerified: true } : {}),
        },
      });

      const released = await this.releaseHeldContentTx(tx, member.id);

      await tx.notification.create({
        data: {
          memberId: member.id,
          type: 'verification_approved',
          subjectType: 'verification_request',
          subjectId: req.id,
          title: 'Membership Verified',
          body: `Your membership was validated via the ${pathway} pathway.`,
        },
      });

      return { request: req, releasedHeldContent: released };
    });
  }

  /**
   * Overview 4.2 & VER-07: Automatic release of held_unverified content when member becomes verified.
   */
  private async releaseHeldContentTx(tx: any, memberId: string) {
    const [posts, photos, resources, comments, joinRequests] = await Promise.all([
      tx.post.updateMany({
        where: { authorId: memberId, status: PostStatus.held_unverified },
        data: { status: PostStatus.pending_review },
      }),
      tx.photo.updateMany({
        where: { uploaderId: memberId, status: PhotoStatus.held_unverified },
        data: { status: PhotoStatus.pending_review },
      }),
      tx.resource.updateMany({
        where: { ownerId: memberId, status: ResourceStatus.held_unverified },
        data: { status: ResourceStatus.pending_review },
      }),
      tx.comment.updateMany({
        where: { authorId: memberId, status: CommentStatus.held_unverified },
        data: { status: CommentStatus.visible },
      }),
      tx.groupJoinRequest.updateMany({
        where: { memberId, status: GroupJoinRequestStatus.held_unverified },
        data: { status: GroupJoinRequestStatus.pending },
      }),
    ]);

    return {
      postsReleasedToReview: posts.count,
      photosReleasedToReview: photos.count,
      resourcesReleasedToReview: resources.count,
      commentsMadeVisible: comments.count,
      groupJoinRequestsReleased: joinRequests.count,
    };
  }

  private assertCanReviewChurch(actor: AuthenticatedUser, churchId: string) {
    if (actor.isPlatformAdmin) return;
    if (!actor.administeredChurchIds.includes(churchId)) {
      throw new ForbiddenException('You can only review verification requests for your own church');
    }
  }
}
