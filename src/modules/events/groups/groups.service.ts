import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  GroupJoinMode,
  GroupJoinRequestStatus,
  GroupMemberRole,
  GroupScope,
  GroupVisibility,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateGroupDto, DecideJoinRequestDto } from './groups.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { calculateAge, serializeMemberCard } from '../../../common/utils/privacy.util';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 06-groups.md: Church Admins create church-scoped groups; Platform Admin creates national groups.
   * Private groups are always joinMode = approval.
   */
  async createGroup(actor: AuthenticatedUser, dto: CreateGroupDto) {
    if (dto.scope === GroupScope.national && !actor.isPlatformAdmin) {
      throw new ForbiddenException('Only the Platform Admin can create national groups');
    }

    let churchId = dto.churchId ?? null;
    if (dto.scope === GroupScope.church) {
      churchId = churchId || actor.churchId;
      if (!actor.isPlatformAdmin && !actor.administeredChurchIds.includes(churchId)) {
        throw new ForbiddenException('Church Admins can only create groups for their own church');
      }
    }

    const effectiveJoinMode =
      dto.visibility === GroupVisibility.private ? GroupJoinMode.approval : dto.joinMode;

    const allowedIds =
      dto.allowedChurchIds && dto.allowedChurchIds.length > 0
        ? dto.allowedChurchIds
        : dto.scope === GroupScope.church && churchId
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
          create: { memberId: actor.id, role: GroupMemberRole.admin },
        },
      },
      include: { allowedChurches: true, members: true },
    });
  }

  /**
   * GRP-01: Browse, search, and filter groups by church, scope, and visibility.
   */
  async listGroups(filters: {
    search?: string;
    churchId?: string;
    scope?: GroupScope;
    visibility?: GroupVisibility;
  }) {
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

  /**
   * GRP-02, GRP-03, GRP-08: Server-side eligibility check & join/request flow.
   */
  async joinOrRequestGroup(groupId: string, user: AuthenticatedUser) {
    const [group, member] = await Promise.all([
      this.prisma.group.findFirst({
        where: { id: groupId, status: 'active', deletedAt: null },
        include: { allowedChurches: true },
      }),
      this.prisma.member.findUnique({ where: { id: user.id } }),
    ]);

    if (!group) throw new NotFoundException('Group not found');
    if (!member) throw new NotFoundException('Member not found');

    const alreadyMember = await this.prisma.groupMember.findUnique({
      where: { groupId_memberId: { groupId, memberId: user.id } },
    });
    if (alreadyMember) {
      throw new ConflictException('You are already a member of this group');
    }

    this.assertMemberEligible(group, member);

    // GRP-08: Unverified members' join requests are held_unverified until verification
    if (member.verificationState !== VerificationState.verified) {
      const heldReq = await this.prisma.groupJoinRequest.create({
        data: {
          groupId,
          memberId: user.id,
          status: GroupJoinRequestStatus.held_unverified,
        },
      });
      return {
        joined: false,
        status: heldReq.status,
        message: 'Join request saved and held until your membership is verified.',
        request: heldReq,
      };
    }

    // GRP-03: Open groups auto-join eligible verified members
    if (group.joinMode === GroupJoinMode.open && group.visibility === GroupVisibility.public) {
      const membership = await this.prisma.groupMember.create({
        data: { groupId, memberId: user.id, role: GroupMemberRole.member },
      });
      return { joined: true, membership };
    }

    // Approval groups create a pending join request
    const request = await this.prisma.groupJoinRequest.create({
      data: {
        groupId,
        memberId: user.id,
        status: GroupJoinRequestStatus.pending,
      },
    });

    // Notify group admins
    const admins = await this.prisma.groupMember.findMany({
      where: { groupId, role: GroupMemberRole.admin },
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

  /**
   * GRP-04: Group Admin join requests queue.
   */
  async listJoinRequests(groupId: string, actor: AuthenticatedUser) {
    await this.assertGroupAdmin(groupId, actor);
    const requests = await this.prisma.groupJoinRequest.findMany({
      where: { groupId, status: GroupJoinRequestStatus.pending },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    });
    return requests.map((r) => ({ ...r, member: serializeMemberCard(r.member, actor) }));
  }

  async decideJoinRequest(
    groupId: string,
    requestId: string,
    actor: AuthenticatedUser,
    dto: DecideJoinRequestDto,
  ) {
    await this.assertGroupAdmin(groupId, actor);
    const req = await this.prisma.groupJoinRequest.findFirst({
      where: { id: requestId, groupId },
      include: { group: true },
    });
    if (!req) throw new NotFoundException('Join request not found');

    if (dto.decision === 'approve') {
      return this.prisma.$transaction(async (tx) => {
        const updated = await tx.groupJoinRequest.update({
          where: { id: requestId },
          data: {
            status: GroupJoinRequestStatus.approved,
            decidedById: actor.id,
            decidedAt: new Date(),
            reason: dto.reason,
          },
        });

        await tx.groupMember.upsert({
          where: { groupId_memberId: { groupId, memberId: req.memberId } },
          update: {},
          create: { groupId, memberId: req.memberId, role: GroupMemberRole.member },
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
        status: GroupJoinRequestStatus.rejected,
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

  /**
   * GRP-05: Group Admin invites a member (still checks eligibility).
   */
  async inviteMember(groupId: string, targetMemberId: string, actor: AuthenticatedUser) {
    await this.assertGroupAdmin(groupId, actor);
    const [group, target] = await Promise.all([
      this.prisma.group.findUnique({
        where: { id: groupId },
        include: { allowedChurches: true },
      }),
      this.prisma.member.findUnique({ where: { id: targetMemberId } }),
    ]);
    if (!group || !target) throw new NotFoundException('Group or member not found');

    this.assertMemberEligible(group, target);

    const membership = await this.prisma.groupMember.upsert({
      where: { groupId_memberId: { groupId, memberId: targetMemberId } },
      update: {},
      create: { groupId, memberId: targetMemberId, role: GroupMemberRole.member },
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

  /**
   * GRP-06: Assign another group admin or remove a member.
   */
  async promoteToGroupAdmin(groupId: string, targetMemberId: string, actor: AuthenticatedUser) {
    await this.assertGroupAdmin(groupId, actor);
    return this.prisma.groupMember.update({
      where: { groupId_memberId: { groupId, memberId: targetMemberId } },
      data: { role: GroupMemberRole.admin },
    });
  }

  async removeMember(groupId: string, targetMemberId: string, actor: AuthenticatedUser) {
    await this.assertGroupAdmin(groupId, actor);
    await this.prisma.groupMember.delete({
      where: { groupId_memberId: { groupId, memberId: targetMemberId } },
    });
    return { removed: true, groupId, memberId: targetMemberId };
  }

  /**
   * GRP-07: Member leaves a group at any time.
   */
  async leaveGroup(groupId: string, user: AuthenticatedUser) {
    const existing = await this.prisma.groupMember.findUnique({
      where: { groupId_memberId: { groupId, memberId: user.id } },
    });
    if (!existing) throw new NotFoundException('You are not a member of this group');
    await this.prisma.groupMember.delete({ where: { id: existing.id } });
    return { left: true, groupId };
  }

  async listGroupMembers(groupId: string, viewer?: AuthenticatedUser) {
    const group = await this.prisma.group.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');

    if (group.visibility === GroupVisibility.private) {
      const isMember = viewer
        ? await this.prisma.groupMember.findUnique({
            where: { groupId_memberId: { groupId, memberId: viewer.id } },
          })
        : null;
      if (!isMember && !viewer?.isPlatformAdmin) {
        throw new ForbiddenException('Private group member list is only visible to members');
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
      member: serializeMemberCard(gm.member, viewer),
    }));
  }

  private assertMemberEligible(
    group: {
      genderRestriction: string;
      minAge: number | null;
      maxAge: number | null;
      verifiedOnly: boolean;
      scope: GroupScope;
      churchId: string | null;
      allowedChurches: Array<{ churchId: string }>;
    },
    member: {
      gender: string;
      dateOfBirth: Date;
      verificationState: VerificationState;
      churchId: string;
    },
  ) {
    const reasons: string[] = [];

    if (group.genderRestriction !== 'any' && group.genderRestriction !== member.gender) {
      reasons.push(`Open to ${group.genderRestriction} members only`);
    }

    const age = calculateAge(member.dateOfBirth);
    if (group.minAge !== null && age < group.minAge) {
      reasons.push(`Minimum age is ${group.minAge}`);
    }
    if (group.maxAge !== null && age > group.maxAge) {
      reasons.push(`Maximum age is ${group.maxAge}`);
    }

    if (group.verifiedOnly && member.verificationState !== VerificationState.verified) {
      reasons.push('Open to verified members only');
    }

    if (group.allowedChurches.length > 0) {
      const ok = group.allowedChurches.some((ac) => ac.churchId === member.churchId);
      if (!ok) reasons.push('Restricted to specific churches');
    } else if (group.scope === GroupScope.church && group.churchId && group.churchId !== member.churchId) {
      reasons.push('Restricted to members of this church');
    }

    if (reasons.length > 0) {
      throw new ForbiddenException(`You do not meet group eligibility rules: ${reasons.join('; ')}`);
    }
  }

  private async assertGroupAdmin(groupId: string, actor: AuthenticatedUser) {
    if (actor.isPlatformAdmin) return;
    const gm = await this.prisma.groupMember.findUnique({
      where: { groupId_memberId: { groupId, memberId: actor.id } },
    });
    if (gm?.role === GroupMemberRole.admin) return;
    throw new ForbiddenException('Requires Group Admin privileges for this group');
  }
}
