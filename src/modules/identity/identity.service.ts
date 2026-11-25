import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ChurchStatus, PhotoStatus, PostStatus, ResourceStatus, VerificationState } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignChurchAdminDto,
  CreateChurchDto,
  FilterChurchesDto,
  UpdateChurchDto,
} from './dto/church.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { serializeMemberCard } from '../../common/utils/privacy.util';
import { NIGERIAN_STATES_LGAS, ROLES } from '../../common/constants/roles.constant';

@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  getNigerianLocations() {
    return NIGERIAN_STATES_LGAS;
  }

  /**
   * CHR-01: Search and browse the church directory by name, state, LGA, and town.
   */
  async listChurches(query: FilterChurchesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { town: { contains: query.search, mode: 'insensitive' } },
        { lga: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.state) where.state = { equals: query.state, mode: 'insensitive' };
    if (query.lga) where.lga = { equals: query.lga, mode: 'insensitive' };
    if (query.town) where.town = { contains: query.town, mode: 'insensitive' };
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.church.findMany({
        where,
        include: {
          adminMember: {
            select: {
              id: true,
              firstName: true,
              middleName: true,
              surname: true,
              photoUrl: true,
              churchId: true,
              verificationState: true,
              profileVisibility: true,
            },
          },
        },
        orderBy: [{ isHeadquarters: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.church.count({ where }),
    ]);

    return {
      data: items.map((c) => ({
        ...c,
        adminMember: serializeMemberCard(c.adminMember),
      })),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  /**
   * CHR-08: Map pins view using church geo-locations.
   */
  async getChurchMapPins(state?: string) {
    return this.prisma.church.findMany({
      where: {
        deletedAt: null,
        latitude: { not: null },
        longitude: { not: null },
        ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        state: true,
        lga: true,
        town: true,
        latitude: true,
        longitude: true,
        isHeadquarters: true,
        status: true,
      },
    });
  }

  /**
   * CHR-02: Church detail page with admin name, verified member count,
   * recent approved posts, gallery preview, church resources, and marketplace preview.
   */
  async getChurchDetail(churchId: string, viewer?: AuthenticatedUser) {
    const church = await this.prisma.church.findFirst({
      where: { id: churchId, deletedAt: null },
      include: {
        adminMember: true,
        gallery: { select: { id: true } },
      },
    });

    if (!church) {
      throw new NotFoundException('Church not found');
    }

    const [verifiedMemberCount, recentPosts, galleryPreview, recentResources, marketplaceCount] =
      await Promise.all([
        this.prisma.member.count({
          where: {
            churchId,
            verificationState: VerificationState.verified,
            deactivatedAt: null,
            deletedAt: null,
          },
        }),
        this.prisma.post.findMany({
          where: {
            OR: [{ audienceChurchId: churchId }, { churchId, audience: 'church' }],
            status: PostStatus.approved,
            deletedAt: null,
          },
          include: { author: true, media: true },
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 5,
        }),
        this.prisma.photo.findMany({
          where: { churchId, status: PhotoStatus.approved, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        this.prisma.resource.findMany({
          where: { churchId, status: ResourceStatus.approved, deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        this.prisma.resource.count({
          where: {
            churchId,
            status: ResourceStatus.approved,
            access: 'paid',
            isListingPaused: false,
            isHiddenByAdmin: false,
            deletedAt: null,
          },
        }),
      ]);

    return {
      ...church,
      adminMember: serializeMemberCard(church.adminMember, viewer),
      verifiedMemberCount,
      recentPosts: recentPosts.map((p) => ({
        ...p,
        author: serializeMemberCard(p.author, viewer),
      })),
      galleryPreview,
      recentResources,
      marketplaceListingsCount: marketplaceCount,
    };
  }

  /**
   * CHR-03: Platform Admin creates church record (and auto-creates its 1:1 Gallery).
   */
  async createChurch(dto: CreateChurchDto, actorId: string) {
    const existing = await this.prisma.church.findUnique({
      where: { name_lga: { name: dto.name, lga: dto.lga } },
    });
    if (existing) {
      throw new ConflictException(`A church named "${dto.name}" already exists in ${dto.lga} LGA`);
    }

    const church = await this.prisma.church.create({
      data: {
        ...dto,
        gallery: { create: {} },
      },
      include: { gallery: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'church:create',
        entityType: 'church',
        entityId: church.id,
        metadata: { name: church.name, state: church.state, lga: church.lga },
      },
    });

    return church;
  }

  /**
   * CHR-03, CHR-07, CHR-09: Update church details.
   * Church Admin can edit photo/details except name, state, LGA, status (Platform Admin only).
   */
  async updateChurch(churchId: string, dto: UpdateChurchDto, user: AuthenticatedUser) {
    const church = await this.prisma.church.findFirst({
      where: { id: churchId, deletedAt: null },
    });
    if (!church) {
      throw new NotFoundException('Church not found');
    }

    const isPlatformAdmin = user.isPlatformAdmin;
    const isChurchAdmin = church.adminMemberId === user.id;

    if (!isPlatformAdmin && !isChurchAdmin) {
      throw new ForbiddenException('Only the Platform Admin or this church admin can update church details');
    }

    if (!isPlatformAdmin && (dto.name || dto.state || dto.lga || dto.status)) {
      throw new ForbiddenException(
        'Only the Platform Admin may change church name, state, LGA, or status (CHR-09)',
      );
    }

    const updated = await this.prisma.church.update({
      where: { id: churchId },
      data: dto,
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'church:update',
        entityType: 'church',
        entityId: churchId,
        metadata: dto as any,
      },
    });

    return updated;
  }

  /**
   * CHR-04: Platform Admin assigns sole Church Admin (replacing previous admin if any).
   */
  async assignChurchAdmin(churchId: string, dto: AssignChurchAdminDto, actorId: string) {
    const [church, member, churchAdminRole] = await Promise.all([
      this.prisma.church.findFirst({ where: { id: churchId, deletedAt: null } }),
      this.prisma.member.findFirst({ where: { id: dto.memberId, deletedAt: null } }),
      this.prisma.role.findUnique({ where: { name: ROLES.CHURCH_ADMIN } }),
    ]);

    if (!church) throw new NotFoundException('Church not found');
    if (!member) throw new NotFoundException('Member not found');

    const previousAdminId = church.adminMemberId;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedChurch = await tx.church.update({
        where: { id: churchId },
        data: { adminMemberId: member.id },
        include: { adminMember: true },
      });

      if (churchAdminRole) {
        if (previousAdminId && previousAdminId !== member.id) {
          await tx.memberRole.deleteMany({
            where: {
              memberId: previousAdminId,
              roleId: churchAdminRole.id,
              churchId,
            },
          });
        }

        const existingRole = await tx.memberRole.findFirst({
          where: { memberId: member.id, roleId: churchAdminRole.id, churchId },
        });
        if (!existingRole) {
          await tx.memberRole.create({
            data: {
              memberId: member.id,
              roleId: churchAdminRole.id,
              churchId,
              assignedBy: actorId,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'church:assign_admin',
          entityType: 'church',
          entityId: churchId,
          metadata: { previousAdminId, newAdminId: member.id },
        },
      });

      return updatedChurch;
    });

    return {
      ...updated,
      adminMember: serializeMemberCard(updated.adminMember),
    };
  }

  async deactivateChurch(churchId: string, actorId: string) {
    const church = await this.prisma.church.findFirst({ where: { id: churchId, deletedAt: null } });
    if (!church) throw new NotFoundException('Church not found');

    const updated = await this.prisma.church.update({
      where: { id: churchId },
      data: { status: ChurchStatus.inactive },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: 'church:deactivate',
        entityType: 'church',
        entityId: churchId,
      },
    });

    return updated;
  }
}
