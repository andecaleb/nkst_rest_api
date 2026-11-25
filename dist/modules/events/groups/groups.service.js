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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../database/prisma.service");
const privacy_util_1 = require("../../../common/utils/privacy.util");
let GroupsService = class GroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createGroup(actor, dto) {
        if (dto.scope === client_1.GroupScope.national && !actor.isPlatformAdmin) {
            throw new common_1.ForbiddenException('Only the Platform Admin can create national groups');
        }
        let churchId = dto.churchId ?? null;
        if (dto.scope === client_1.GroupScope.church) {
            churchId = churchId || actor.churchId;
            if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(churchId)) {
                throw new common_1.ForbiddenException('Church Admins can only create groups for their own church');
            }
        }
        const effectiveJoinMode = dto.visibility === client_1.GroupVisibility.private ? client_1.GroupJoinMode.approval : dto.joinMode;
        const allowedIds = dto.allowedChurchIds && dto.allowedChurchIds.length > 0
            ? dto.allowedChurchIds
            : dto.scope === client_1.GroupScope.church && churchId
                ? [churchId]
                : [];
        return this.prisma.group.create({
            data: {
                name: dto.name,
                description: dto.description,
                coverUrl: dto.coverUrl,
                scope: dto.scope,
                churchId,
                visibility: dto.visibility,
                joinMode: effectiveJoinMode,
                genderRestriction: dto.genderRestriction ?? 'any',
                minAge: dto.minAge,
                maxAge: dto.maxAge,
                verifiedOnly: Boolean(dto.verifiedOnly),
                createdById: actor.id,
                allowedChurches: allowedIds.length
                    ? { create: allowedIds.map((id) => ({ churchId: id })) }
                    : undefined,
                members: {
                    create: { memberId: actor.id, role: client_1.GroupMemberRole.admin },
                },
            },
            include: { allowedChurches: true, members: true },
        });
    }
    async listGroups(filters) {
        return this.prisma.group.findMany({
            where: {
                status: 'active',
                deletedAt: null,
                ...(filters.search
                    ? {
                        OR: [
                            { name: { contains: filters.search, mode: 'insensitive' } },
                            { description: { contains: filters.search, mode: 'insensitive' } },
                        ],
                    }
                    : {}),
                ...(filters.churchId ? { churchId: filters.churchId } : {}),
                ...(filters.scope ? { scope: filters.scope } : {}),
                ...(filters.visibility ? { visibility: filters.visibility } : {}),
            },
            include: {
                church: { select: { id: true, name: true } },
                allowedChurches: { select: { churchId: true } },
                _count: { select: { members: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async joinOrRequestGroup(groupId, user) {
        const [group, member] = await Promise.all([
            this.prisma.group.findFirst({
                where: { id: groupId, status: 'active', deletedAt: null },
                include: { allowedChurches: true },
            }),
            this.prisma.member.findUnique({ where: { id: user.id } }),
        ]);
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        if (!member)
            throw new common_1.NotFoundException('Member not found');
        const alreadyMember = await this.prisma.groupMember.findUnique({
            where: { groupId_memberId: { groupId, memberId: user.id } },
        });
        if (alreadyMember) {
            throw new common_1.ConflictException('You are already a member of this group');
        }
        this.assertMemberEligible(group, member);
        if (member.verificationState !== client_1.VerificationState.verified) {
            const heldReq = await this.prisma.groupJoinRequest.create({
                data: {
                    groupId,
                    memberId: user.id,
                    status: client_1.GroupJoinRequestStatus.held_unverified,
                },
            });
            return {
                joined: false,
                status: heldReq.status,
                message: 'Join request saved and held until your membership is verified.',
                request: heldReq,
            };
        }
        if (group.joinMode === client_1.GroupJoinMode.open && group.visibility === client_1.GroupVisibility.public) {
            const membership = await this.prisma.groupMember.create({
                data: { groupId, memberId: user.id, role: client_1.GroupMemberRole.member },
            });
            return { joined: true, membership };
        }
        const request = await this.prisma.groupJoinRequest.create({
            data: {
                groupId,
                memberId: user.id,
                status: client_1.GroupJoinRequestStatus.pending,
            },
        });
        const admins = await this.prisma.groupMember.findMany({
            where: { groupId, role: client_1.GroupMemberRole.admin },
            select: { memberId: true },
        });
        if (admins.length > 0) {
            await this.prisma.notification.createMany({
                data: admins.map((a) => ({
                    memberId: a.memberId,
                    type: 'group_join_request',
                    subjectType: 'group',
                    subjectId: groupId,
                    title: `New Join Request for ${group.name}`,
                    body: 'A member has requested to join your group.',
                })),
            });
        }
        return { joined: false, status: request.status, request };
    }
    async listJoinRequests(groupId, actor) {
        await this.assertGroupAdmin(groupId, actor);
        const requests = await this.prisma.groupJoinRequest.findMany({
            where: { groupId, status: client_1.GroupJoinRequestStatus.pending },
            include: { member: true },
            orderBy: { createdAt: 'asc' },
        });
        return requests.map((r) => ({ ...r, member: (0, privacy_util_1.serializeMemberCard)(r.member, actor) }));
    }
    async decideJoinRequest(groupId, requestId, actor, dto) {
        await this.assertGroupAdmin(groupId, actor);
        const req = await this.prisma.groupJoinRequest.findFirst({
            where: { id: requestId, groupId },
            include: { group: true },
        });
        if (!req)
            throw new common_1.NotFoundException('Join request not found');
        if (dto.decision === 'approve') {
            return this.prisma.$transaction(async (tx) => {
                const updated = await tx.groupJoinRequest.update({
                    where: { id: requestId },
                    data: {
                        status: client_1.GroupJoinRequestStatus.approved,
                        decidedById: actor.id,
                        decidedAt: new Date(),
                        reason: dto.reason,
                    },
                });
                await tx.groupMember.upsert({
                    where: { groupId_memberId: { groupId, memberId: req.memberId } },
                    update: {},
                    create: { groupId, memberId: req.memberId, role: client_1.GroupMemberRole.member },
                });
                await tx.notification.create({
                    data: {
                        memberId: req.memberId,
                        type: 'group_join_approved',
                        subjectType: 'group',
                        subjectId: groupId,
                        title: `Joined ${req.group.name}`,
                        body: 'Your request to join the group has been approved.',
                    },
                });
                return updated;
            });
        }
        const rejected = await this.prisma.groupJoinRequest.update({
            where: { id: requestId },
            data: {
                status: client_1.GroupJoinRequestStatus.rejected,
                decidedById: actor.id,
                decidedAt: new Date(),
                reason: dto.reason,
            },
        });
        await this.prisma.notification.create({
            data: {
                memberId: req.memberId,
                type: 'group_join_rejected',
                subjectType: 'group',
                subjectId: groupId,
                title: `Join Request Declined — ${req.group.name}`,
                body: dto.reason || 'Your request to join the group was declined.',
            },
        });
        return rejected;
    }
    async inviteMember(groupId, targetMemberId, actor) {
        await this.assertGroupAdmin(groupId, actor);
        const [group, target] = await Promise.all([
            this.prisma.group.findUnique({
                where: { id: groupId },
                include: { allowedChurches: true },
            }),
            this.prisma.member.findUnique({ where: { id: targetMemberId } }),
        ]);
        if (!group || !target)
            throw new common_1.NotFoundException('Group or member not found');
        this.assertMemberEligible(group, target);
        const membership = await this.prisma.groupMember.upsert({
            where: { groupId_memberId: { groupId, memberId: targetMemberId } },
            update: {},
            create: { groupId, memberId: targetMemberId, role: client_1.GroupMemberRole.member },
        });
        await this.prisma.notification.create({
            data: {
                memberId: targetMemberId,
                type: 'group_invitation',
                subjectType: 'group',
                subjectId: groupId,
                title: `Added to ${group.name}`,
                body: `You were invited to join ${group.name}.`,
            },
        });
        return membership;
    }
    async promoteToGroupAdmin(groupId, targetMemberId, actor) {
        await this.assertGroupAdmin(groupId, actor);
        return this.prisma.groupMember.update({
            where: { groupId_memberId: { groupId, memberId: targetMemberId } },
            data: { role: client_1.GroupMemberRole.admin },
        });
    }
    async removeMember(groupId, targetMemberId, actor) {
        await this.assertGroupAdmin(groupId, actor);
        await this.prisma.groupMember.delete({
            where: { groupId_memberId: { groupId, memberId: targetMemberId } },
        });
        return { removed: true, groupId, memberId: targetMemberId };
    }
    async leaveGroup(groupId, user) {
        const existing = await this.prisma.groupMember.findUnique({
            where: { groupId_memberId: { groupId, memberId: user.id } },
        });
        if (!existing)
            throw new common_1.NotFoundException('You are not a member of this group');
        await this.prisma.groupMember.delete({ where: { id: existing.id } });
        return { left: true, groupId };
    }
    async listGroupMembers(groupId, viewer) {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group)
            throw new common_1.NotFoundException('Group not found');
        if (group.visibility === client_1.GroupVisibility.private) {
            const isMember = viewer
                ? await this.prisma.groupMember.findUnique({
                    where: { groupId_memberId: { groupId, memberId: viewer.id } },
                })
                : null;
            if (!isMember && !viewer?.isPlatformAdmin) {
                throw new common_1.ForbiddenException('Private group member list is only visible to members');
            }
        }
        const members = await this.prisma.groupMember.findMany({
            where: { groupId },
            include: { member: true },
            orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
        });
        return members.map((gm) => ({
            role: gm.role,
            joinedAt: gm.joinedAt,
            member: (0, privacy_util_1.serializeMemberCard)(gm.member, viewer),
        }));
    }
    assertMemberEligible(group, member) {
        const reasons = [];
        if (group.genderRestriction !== 'any' && group.genderRestriction !== member.gender) {
            reasons.push(`Open to ${group.genderRestriction} members only`);
        }
        const age = (0, privacy_util_1.calculateAge)(member.dateOfBirth);
        if (group.minAge !== null && age < group.minAge) {
            reasons.push(`Minimum age is ${group.minAge}`);
        }
        if (group.maxAge !== null && age > group.maxAge) {
            reasons.push(`Maximum age is ${group.maxAge}`);
        }
        if (group.verifiedOnly && member.verificationState !== client_1.VerificationState.verified) {
            reasons.push('Open to verified members only');
        }
        if (group.allowedChurches.length > 0) {
            const ok = group.allowedChurches.some((ac) => ac.churchId === member.churchId);
            if (!ok)
                reasons.push('Restricted to specific churches');
        }
        else if (group.scope === client_1.GroupScope.church && group.churchId && group.churchId !== member.churchId) {
            reasons.push('Restricted to members of this church');
        }
        if (reasons.length > 0) {
            throw new common_1.ForbiddenException(`You do not meet group eligibility rules: ${reasons.join('; ')}`);
        }
    }
    async assertGroupAdmin(groupId, actor) {
        if (actor.isPlatformAdmin)
            return;
        const gm = await this.prisma.groupMember.findUnique({
            where: { groupId_memberId: { groupId, memberId: actor.id } },
        });
        if (gm?.role === client_1.GroupMemberRole.admin)
            return;
        throw new common_1.ForbiddenException('Requires Group Admin privileges for this group');
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map