import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Audience,
  ChurchStatus,
  PostStatus,
  ResourceStatus,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangeChurchDto,
  SocialLinkDto,
  SuspendMemberDto,
  TogglePrivacyDto,
  UpdateProfileDto,
} from './dto/member.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { calculateAge, serializeMember } from '../../common/utils/privacy.util';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(user: AuthenticatedUser) {
    const member = await this.prisma.member.findUnique({
      where: { id: user.id },
      include: {
        church: true,
        socialLinks: true,
      },
    });
    if (!member) throw new NotFoundException('Member not found');
    return serializeMember(member, user);
  }

  /**
   * PRO-01..04, PRIV-01..05: Member profile page with strict privacy masking
   * and community section listing only items visible to the viewer.
   */
  async getMemberProfile(memberId: string, viewer?: AuthenticatedUser) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, deletedAt: null, deactivatedAt: null },
      include: {
        church: true,
        socialLinks: true,
      },
    });
    if (!member) throw new NotFoundException('Member not found');

    const [approvedPosts, publicGroups, approvedResources] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId: memberId,
          status: PostStatus.approved,
          deletedAt: null,
          ...(viewer?.id === memberId || viewer?.isPlatformAdmin
            ? {}
            : {
                OR: [
                  { audience: Audience.general },
                  ...(viewer
                    ? [{ audience: Audience.church, audienceChurchId: viewer.churchId }]
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
        where: { ownerId: memberId, status: ResourceStatus.approved, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      profile: serializeMember(member, viewer),
      community: {
        posts: approvedPosts,
        groups: publicGroups.map((gm) => gm.group),
        resources: approvedResources,
      },
    };
  }

  /**
   * PRO-01, GRP-09: Update own profile and re-evaluate group eligibility if gender/DOB changed.
   */
  async updateMyProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
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
      profile: serializeMember(updated, user),
      removedFromIneligibleGroups: removedGroups,
    };
  }

  /**
   * PRIV-01, PRIV-02: Toggle public/private visibility immediately.
   */
  async togglePrivacy(user: AuthenticatedUser, dto: TogglePrivacyDto) {
    const updated = await this.prisma.member.update({
      where: { id: user.id },
      data: { profileVisibility: dto.profileVisibility },
      include: { church: true, socialLinks: true },
    });

    return serializeMember(updated, user);
  }

  async addSocialLink(user: AuthenticatedUser, dto: SocialLinkDto) {
    return this.prisma.memberSocialLink.create({
      data: {
        memberId: user.id,
        label: dto.label,
        url: dto.url,
      },
    });
  }

  async deleteSocialLink(user: AuthenticatedUser, linkId: string) {
    const link = await this.prisma.memberSocialLink.findFirst({
      where: { id: linkId, memberId: user.id },
    });
    if (!link) throw new NotFoundException('Social link not found');
    await this.prisma.memberSocialLink.delete({ where: { id: linkId } });
    return { deleted: true, id: linkId };
  }

  /**
   * PRO-05 & VER-09: Self-service church change.
   * - Resets church-level verification (pathways A, B, C) to pending_verification
   * - Retains platform-level verification (pathway D)
   * - Removes group memberships that no longer satisfy church restrictions
   */
  async changeChurch(user: AuthenticatedUser, dto: ChangeChurchDto) {
    const [member, newChurch] = await Promise.all([
      this.prisma.member.findUnique({ where: { id: user.id } }),
      this.prisma.church.findFirst({ where: { id: dto.churchId, deletedAt: null } }),
    ]);

    if (!member) throw new NotFoundException('Member not found');
    if (!newChurch) throw new NotFoundException('Target church not found');
    if (newChurch.status !== ChurchStatus.active) {
      throw new BadRequestException('Cannot transfer to an inactive church (CHR-07)');
    }
    if (member.churchId === newChurch.id) {
      throw new BadRequestException('You are already affiliated with this church');
    }

    const nextVerificationState =
      member.verificationState === VerificationState.verified && !member.platformVerified
        ? VerificationState.pending_verification
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
      profile: serializeMember(updated, user),
      verificationReset: nextVerificationState !== member.verificationState,
      platformVerificationRetained: member.platformVerified,
      removedFromIneligibleGroups: removedGroups,
    };
  }

  /**
   * VER-08: Suspend a member with reason (Platform Admin or Member's Church Admin).
   */
  async suspendMember(targetId: string, dto: SuspendMemberDto, actor: AuthenticatedUser) {
    const target = await this.prisma.member.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!target) throw new NotFoundException('Member not found');
    if (target.isPlatformAdmin) {
      throw new ForbiddenException('Cannot suspend the Platform Admin');
    }

    const canManage =
      actor.isPlatformAdmin || actor.administeredChurchIds.includes(target.churchId);
    if (!canManage) {
      throw new ForbiddenException('You can only suspend members of your own church');
    }

    const updated = await this.prisma.member.update({
      where: { id: targetId },
      data: {
        verificationState: VerificationState.suspended,
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

    return serializeMember(updated, actor);
  }

  /**
   * VER-08: Reinstate a suspended member.
   */
  async reinstateMember(targetId: string, actor: AuthenticatedUser) {
    const target = await this.prisma.member.findFirst({ where: { id: targetId, deletedAt: null } });
    if (!target) throw new NotFoundException('Member not found');

    const canManage =
      actor.isPlatformAdmin || actor.administeredChurchIds.includes(target.churchId);
    if (!canManage) {
      throw new ForbiddenException('You can only reinstate members of your own church');
    }

    const hasApprovedVerification = await this.prisma.verificationRequest.findFirst({
      where: { memberId: targetId, status: 'approved' },
    });

    const restoredState =
      target.platformVerified || hasApprovedVerification
        ? VerificationState.verified
        : VerificationState.registered;

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

    return serializeMember(updated, actor);
  }

  /**
   * GRP-09: Re-evaluate group memberships whenever church, gender, or DOB changes.
   */
  private async enforceGroupEligibilityAfterProfileChange(member: {
    id: string;
    churchId: string;
    gender: string;
    dateOfBirth: Date;
    verificationState: VerificationState;
  }) {
    const memberships = await this.prisma.groupMember.findMany({
      where: { memberId: member.id },
      include: {
        group: { include: { allowedChurches: true } },
      },
    });

    const age = calculateAge(member.dateOfBirth);
    const removedGroupIds: string[] = [];

    for (const gm of memberships) {
      const g = gm.group;
      let eligible = true;

      if (g.genderRestriction !== 'any' && g.genderRestriction !== member.gender) eligible = false;
      if (g.minAge !== null && age < g.minAge) eligible = false;
      if (g.maxAge !== null && age > g.maxAge) eligible = false;
      if (g.verifiedOnly && member.verificationState !== VerificationState.verified) {
        eligible = false;
      }
      if (g.allowedChurches.length > 0) {
        const allowed = g.allowedChurches.some((ac) => ac.churchId === member.churchId);
        if (!allowed) eligible = false;
      } else if (g.scope === 'church' && g.churchId && g.churchId !== member.churchId) {
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
}
