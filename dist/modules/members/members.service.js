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
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const privacy_util_1 = require("../../common/utils/privacy.util");
let MembersService = class MembersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getMyProfile(user) {
        const member = await this.prisma.member.findUnique({
            where: { id: user.id },
            include: {
                church: true,
                socialLinks: true,
            },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        return (0, privacy_util_1.serializeMember)(member, user);
    }
    async getMemberProfile(memberId, viewer) {
        const member = await this.prisma.member.findFirst({
            where: { id: memberId, deletedAt: null, deactivatedAt: null },
            include: {
                church: true,
                socialLinks: true,
            },
        });
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        const [approvedPosts, publicGroups, approvedResources] = await Promise.all([
            this.prisma.post.findMany({
                where: {
                    authorId: memberId,
                    status: client_1.PostStatus.approved,
                    deletedAt: null,
                    ...(viewer?.id === memberId || viewer?.isPlatformAdmin
                        ? {}
                        : {
                            OR: [
                                { audience: client_1.Audience.general },
                                ...(viewer
                                    ? [{ audience: client_1.Audience.church, audienceChurchId: viewer.churchId }]
                                    : []),
                            ],
                        }),
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
            this.prisma.groupMember.findMany({
                where: {
                    memberId,
                    group: { visibility: 'public', status: 'active', deletedAt: null },
                },
                include: { group: { select: { id: true, name: true, scope: true, visibility: true } } },
            }),
            this.prisma.resource.findMany({
                where: { ownerId: memberId, status: client_1.ResourceStatus.approved, deletedAt: null },
                orderBy: { createdAt: 'desc' },
                take: 10,
            }),
        ]);
        return {
            profile: (0, privacy_util_1.serializeMember)(member, viewer),
            community: {
                posts: approvedPosts,
                groups: publicGroups.map((gm) => gm.group),
                resources: approvedResources,
            },
        };
    }
    async updateMyProfile(user, dto) {
        const updated = await this.prisma.member.update({
            where: { id: user.id },
            data: {
                ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
                ...(dto.middleName !== undefined ? { middleName: dto.middleName } : {}),
                ...(dto.surname !== undefined ? { surname: dto.surname } : {}),
                ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
                ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
                ...(dto.gender !== undefined ? { gender: dto.gender } : {}),
                ...(dto.dateOfBirth !== undefined ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
                ...(dto.state !== undefined ? { state: dto.state } : {}),
                ...(dto.lga !== undefined ? { lga: dto.lga } : {}),
                ...(dto.residentialLocation !== undefined
                    ? { residentialLocation: dto.residentialLocation }
                    : {}),
            },
            include: { church: true, socialLinks: true },
        });
        const removedGroups = await this.enforceGroupEligibilityAfterProfileChange(updated);
        return {
            profile: (0, privacy_util_1.serializeMember)(updated, user),
            removedFromIneligibleGroups: removedGroups,
        };
    }
    async togglePrivacy(user, dto) {
        const updated = await this.prisma.member.update({
            where: { id: user.id },
            data: { profileVisibility: dto.profileVisibility },
            include: { church: true, socialLinks: true },
        });
        return (0, privacy_util_1.serializeMember)(updated, user);
    }
    async addSocialLink(user, dto) {
        return this.prisma.memberSocialLink.create({
            data: {
                memberId: user.id,
                label: dto.label,
                url: dto.url,
            },
        });
    }
    async deleteSocialLink(user, linkId) {
        const link = await this.prisma.memberSocialLink.findFirst({
            where: { id: linkId, memberId: user.id },
        });
        if (!link)
            throw new common_1.NotFoundException('Social link not found');
        await this.prisma.memberSocialLink.delete({ where: { id: linkId } });
        return { deleted: true, id: linkId };
    }
    async changeChurch(user, dto) {
        const [member, newChurch] = await Promise.all([
            this.prisma.member.findUnique({ where: { id: user.id } }),
            this.prisma.church.findFirst({ where: { id: dto.churchId, deletedAt: null } }),
        ]);
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        if (!newChurch)
            throw new common_1.NotFoundException('Target church not found');
        if (newChurch.status !== client_1.ChurchStatus.active) {
            throw new common_1.BadRequestException('Cannot transfer to an inactive church (CHR-07)');
        }
        if (member.churchId === newChurch.id) {
            throw new common_1.BadRequestException('You are already affiliated with this church');
        }
        const nextVerificationState = member.verificationState === client_1.VerificationState.verified && !member.platformVerified
            ? client_1.VerificationState.pending_verification
            : member.verificationState;
        const updated = await this.prisma.member.update({
            where: { id: user.id },
            data: {
                churchId: newChurch.id,
                verificationState: nextVerificationState,
            },
            include: { church: true, socialLinks: true },
        });
        const removedGroups = await this.enforceGroupEligibilityAfterProfileChange(updated);
        return {
            profile: (0, privacy_util_1.serializeMember)(updated, user),
            verificationReset: nextVerificationState !== member.verificationState,
            platformVerificationRetained: member.platformVerified,
            removedFromIneligibleGroups: removedGroups,
        };
    }
    async suspendMember(targetId, dto, actor) {
        const target = await this.prisma.member.findFirst({ where: { id: targetId, deletedAt: null } });
        if (!target)
            throw new common_1.NotFoundException('Member not found');
        if (target.isPlatformAdmin) {
            throw new common_1.ForbiddenException('Cannot suspend the Platform Admin');
        }
        const canManage = actor.isPlatformAdmin || actor.administeredChurchIds.includes(target.churchId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You can only suspend members of your own church');
        }
        const updated = await this.prisma.member.update({
            where: { id: targetId },
            data: {
                verificationState: client_1.VerificationState.suspended,
                suspensionReason: dto.reason,
                suspendedAt: new Date(),
                suspendedById: actor.id,
            },
        });
        await this.prisma.$transaction([
            this.prisma.notification.create({
                data: {
                    memberId: targetId,
                    type: 'account_suspended',
                    subjectType: 'member',
                    subjectId: targetId,
                    title: 'Account Suspended',
                    body: `Your account has been placed in read-only mode. Reason: ${dto.reason}`,
                },
            }),
            this.prisma.auditLog.create({
                data: {
                    actorId: actor.id,
                    action: 'member:suspend',
                    entityType: 'member',
                    entityId: targetId,
                    metadata: { reason: dto.reason },
                },
            }),
        ]);
        return (0, privacy_util_1.serializeMember)(updated, actor);
    }
    async reinstateMember(targetId, actor) {
        const target = await this.prisma.member.findFirst({ where: { id: targetId, deletedAt: null } });
        if (!target)
            throw new common_1.NotFoundException('Member not found');
        const canManage = actor.isPlatformAdmin || actor.administeredChurchIds.includes(target.churchId);
        if (!canManage) {
            throw new common_1.ForbiddenException('You can only reinstate members of your own church');
        }
        const hasApprovedVerification = await this.prisma.verificationRequest.findFirst({
            where: { memberId: targetId, status: 'approved' },
        });
        const restoredState = target.platformVerified || hasApprovedVerification
            ? client_1.VerificationState.verified
            : client_1.VerificationState.registered;
        const updated = await this.prisma.member.update({
            where: { id: targetId },
            data: {
                verificationState: restoredState,
                suspensionReason: null,
                suspendedAt: null,
                suspendedById: null,
            },
        });
        await this.prisma.$transaction([
            this.prisma.notification.create({
                data: {
                    memberId: targetId,
                    type: 'account_reinstated',
                    subjectType: 'member',
                    subjectId: targetId,
                    title: 'Account Reinstated',
                    body: 'Your account suspension has been lifted.',
                },
            }),
            this.prisma.auditLog.create({
                data: {
                    actorId: actor.id,
                    action: 'member:reinstate',
                    entityType: 'member',
                    entityId: targetId,
                    metadata: { restoredState },
                },
            }),
        ]);
        return (0, privacy_util_1.serializeMember)(updated, actor);
    }
    async enforceGroupEligibilityAfterProfileChange(member) {
        const memberships = await this.prisma.groupMember.findMany({
            where: { memberId: member.id },
            include: {
                group: { include: { allowedChurches: true } },
            },
        });
        const age = (0, privacy_util_1.calculateAge)(member.dateOfBirth);
        const removedGroupIds = [];
        for (const gm of memberships) {
            const g = gm.group;
            let eligible = true;
            if (g.genderRestriction !== 'any' && g.genderRestriction !== member.gender)
                eligible = false;
            if (g.minAge !== null && age < g.minAge)
                eligible = false;
            if (g.maxAge !== null && age > g.maxAge)
                eligible = false;
            if (g.verifiedOnly && member.verificationState !== client_1.VerificationState.verified) {
                eligible = false;
            }
            if (g.allowedChurches.length > 0) {
                const allowed = g.allowedChurches.some((ac) => ac.churchId === member.churchId);
                if (!allowed)
                    eligible = false;
            }
            else if (g.scope === 'church' && g.churchId && g.churchId !== member.churchId) {
                eligible = false;
            }
            if (!eligible) {
                await this.prisma.groupMember.delete({ where: { id: gm.id } });
                await this.prisma.notification.create({
                    data: {
                        memberId: member.id,
                        type: 'group_removed_ineligible',
                        subjectType: 'group',
                        subjectId: g.id,
                        title: `Removed from ${g.name}`,
                        body: 'Your profile update means you no longer meet the eligibility rules for this group.',
                    },
                });
                removedGroupIds.push(g.id);
            }
        }
        return removedGroupIds;
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MembersService);
//# sourceMappingURL=members.service.js.map