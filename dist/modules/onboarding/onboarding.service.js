"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const roles_constant_1 = require("../../common/constants/roles.constant");
const privacy_util_1 = require("../../common/utils/privacy.util");
let OnboardingService = class OnboardingService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyVerificationStatus(user) {
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
                reviewer: (0, privacy_util_1.serializeMemberCard)(req.reviewer, user),
                acknowledgementCount: req.acknowledgements.length,
                acknowledgementsRequired: roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS,
                acknowledgementsProgress: req.pathway === client_1.VerificationPathway.acknowledgement
                    ? `${req.acknowledgements.length} of ${roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS}`
                    : null,
                acknowledgements: req.acknowledgements.map((ack) => ({
                    id: ack.id,
                    note: ack.note,
                    createdAt: ack.createdAt,
                    acknowledger: (0, privacy_util_1.serializeMemberCard)(ack.acknowledger, user),
                })),
            })),
        };
    }
    async submitRequest(user, dto) {
        if (user.verificationState === client_1.VerificationState.verified) {
            throw new common_1.BadRequestException('Your account is already verified');
        }
        if (user.verificationState === client_1.VerificationState.suspended) {
            throw new common_1.ForbiddenException('Suspended accounts cannot submit verification requests');
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
                    status: dto.pathway === client_1.VerificationPathway.acknowledgement
                        ? client_1.VerificationRequestStatus.submitted
                        : client_1.VerificationRequestStatus.ready_for_review,
                },
            });
            await tx.member.update({
                where: { id: user.id },
                data: { verificationState: client_1.VerificationState.pending_verification },
            });
            const church = await tx.church.findUnique({ where: { id: user.churchId } });
            if (church?.adminMemberId && dto.pathway !== client_1.VerificationPathway.acknowledgement) {
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
    async acknowledgeRequest(requestId, user, dto) {
        if (user.verificationState !== client_1.VerificationState.verified) {
            throw new common_1.ForbiddenException('Only verified members can acknowledge another member');
        }
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { church: true },
        });
        if (!request)
            throw new common_1.NotFoundException('Verification request not found');
        if (request.pathway !== client_1.VerificationPathway.acknowledgement) {
            throw new common_1.BadRequestException('This verification request does not use the acknowledgement pathway');
        }
        if (request.memberId === user.id) {
            throw new common_1.BadRequestException('Self-acknowledgement is not allowed');
        }
        if (request.status === client_1.VerificationRequestStatus.approved ||
            request.status === client_1.VerificationRequestStatus.rejected) {
            throw new common_1.BadRequestException('This verification request has already been decided');
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
            throw new common_1.ConflictException('You have already acknowledged this verification request');
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
                body: `You now have ${totalCount} of ${roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS} acknowledgements.`,
            },
        });
        let readyForReview = request.status === client_1.VerificationRequestStatus.ready_for_review;
        if (totalCount >= roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS && !readyForReview) {
            await this.prisma.verificationRequest.update({
                where: { id: requestId },
                data: { status: client_1.VerificationRequestStatus.ready_for_review },
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
                        body: `A member has reached ${roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS} acknowledgements and is ready for review.`,
                    },
                });
            }
        }
        return {
            acknowledgement: ack,
            acknowledgementCount: totalCount,
            required: roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS,
            readyForReview,
        };
    }
    async getVerificationQueue(actor, churchId) {
        const where = {
            status: { in: [client_1.VerificationRequestStatus.submitted, client_1.VerificationRequestStatus.ready_for_review] },
        };
        if (!actor.isPlatformAdmin) {
            where.churchId = { in: actor.administeredChurchIds };
        }
        else if (churchId) {
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
            member: (0, privacy_util_1.serializeMemberCard)(item.member, actor),
            acknowledgementCount: item._count.acknowledgements,
        }));
    }
    async approveRequest(requestId, actor, dto) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
            include: { _count: { select: { acknowledgements: true } } },
        });
        if (!request)
            throw new common_1.NotFoundException('Verification request not found');
        this.assertCanReviewChurch(actor, request.churchId);
        if (request.pathway === client_1.VerificationPathway.acknowledgement &&
            request._count.acknowledgements < roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS &&
            !actor.isPlatformAdmin) {
            throw new common_1.BadRequestException(`Acknowledgement pathway requires at least ${roles_constant_1.REQUIRED_ACKNOWLEDGEMENTS} acknowledgements before approval`);
        }
        const isPlatformPathway = request.pathway === client_1.VerificationPathway.platform || actor.isPlatformAdmin;
        const result = await this.prisma.$transaction(async (tx) => {
            const updatedReq = await tx.verificationRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.VerificationRequestStatus.approved,
                    reviewerId: actor.id,
                    reviewedAt: new Date(),
                    decisionNote: dto.decisionNote,
                    ...(dto.completionDate ? { completionDate: new Date(dto.completionDate) } : {}),
                },
            });
            await tx.member.update({
                where: { id: request.memberId },
                data: {
                    verificationState: client_1.VerificationState.verified,
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
    async rejectRequest(requestId, actor, dto) {
        const request = await this.prisma.verificationRequest.findUnique({
            where: { id: requestId },
        });
        if (!request)
            throw new common_1.NotFoundException('Verification request not found');
        this.assertCanReviewChurch(actor, request.churchId);
        const updated = await this.prisma.$transaction(async (tx) => {
            const req = await tx.verificationRequest.update({
                where: { id: requestId },
                data: {
                    status: client_1.VerificationRequestStatus.rejected,
                    reviewerId: actor.id,
                    reviewedAt: new Date(),
                    decisionNote: dto.reason,
                },
            });
            await tx.member.update({
                where: { id: request.memberId },
                data: { verificationState: client_1.VerificationState.rejected },
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
    async directValidate(actor, dto) {
        const member = await this.prisma.member.findFirst({
            where: { id: dto.memberId, deletedAt: null },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        this.assertCanReviewChurch(actor, member.churchId);
        const pathway = actor.isPlatformAdmin
            ? client_1.VerificationPathway.platform
            : client_1.VerificationPathway.church;
        return this.prisma.$transaction(async (tx) => {
            const req = await tx.verificationRequest.create({
                data: {
                    memberId: member.id,
                    churchId: member.churchId,
                    pathway,
                    status: client_1.VerificationRequestStatus.approved,
                    reviewerId: actor.id,
                    reviewedAt: new Date(),
                    decisionNote: dto.decisionNote || `Directly validated via ${pathway} pathway`,
                },
            });
            await tx.member.update({
                where: { id: member.id },
                data: {
                    verificationState: client_1.VerificationState.verified,
                    ...(pathway === client_1.VerificationPathway.platform ? { platformVerified: true } : {}),
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
    async releaseHeldContentTx(tx, memberId) {
        const [posts, photos, resources, comments, joinRequests] = await Promise.all([
            tx.post.updateMany({
                where: { authorId: memberId, status: client_1.PostStatus.held_unverified },
                data: { status: client_1.PostStatus.pending_review },
            }),
            tx.photo.updateMany({
                where: { uploaderId: memberId, status: client_1.PhotoStatus.held_unverified },
                data: { status: client_1.PhotoStatus.pending_review },
            }),
            tx.resource.updateMany({
                where: { ownerId: memberId, status: client_1.ResourceStatus.held_unverified },
                data: { status: client_1.ResourceStatus.pending_review },
            }),
            tx.comment.updateMany({
                where: { authorId: memberId, status: client_1.CommentStatus.held_unverified },
                data: { status: client_1.CommentStatus.visible },
            }),
            tx.groupJoinRequest.updateMany({
                where: { memberId, status: client_1.GroupJoinRequestStatus.held_unverified },
                data: { status: client_1.GroupJoinRequestStatus.pending },
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
    assertCanReviewChurch(actor, churchId) {
        if (actor.isPlatformAdmin)
            return;
        if (!actor.administeredChurchIds.includes(churchId)) {
            throw new common_1.ForbiddenException('You can only review verification requests for your own church');
        }
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map