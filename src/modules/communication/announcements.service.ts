import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Audience,
  PostCategory,
  PostStatus,
  RecitationStatus,
  SellerAccessStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateOfficialAnnouncementDto,
  CreateRecitationDto,
  RegisterDeviceTokenDto,
  UpdateNotificationPreferencesDto,
} from './dto/communication.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { serializeMemberCard } from '../../common/utils/privacy.util';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ANN-01..06: Publish official announcement skipping moderation.
   */
  async publishAnnouncement(actor: AuthenticatedUser, dto: CreateOfficialAnnouncementDto) {
    let audienceChurchId = dto.audienceChurchId ?? null;
    let audienceGroupId = dto.audienceGroupId ?? null;
    let publisherLabel = 'Official · Platform Admin';

    if (actor.isPlatformAdmin) {
      publisherLabel = 'Official · Platform Admin, NKST HQ';
    } else if (dto.audience === Audience.church) {
      const targetChurchId = audienceChurchId || actor.churchId;
      if (!actor.administeredChurchIds.includes(targetChurchId)) {
        throw new ForbiddenException('Church Admins can only publish announcements to their own church');
      }
      const church = await this.prisma.church.findUnique({ where: { id: targetChurchId } });
      audienceChurchId = targetChurchId;
      publisherLabel = `Official · Church Admin, ${church?.name ?? 'Church'}`;
    } else if (dto.audience === Audience.group && audienceGroupId) {
      const gm = await this.prisma.groupMember.findUnique({
        where: { groupId_memberId: { groupId: audienceGroupId, memberId: actor.id } },
        include: { group: true },
      });
      if (gm?.role !== 'admin') {
        throw new ForbiddenException('Only Group Admins can publish official group announcements');
      }
      publisherLabel = `Official · Group Admin, ${gm.group.name}`;
    } else {
      throw new ForbiddenException('Only the Platform Admin can publish general-audience announcements');
    }

    const pinnedUntil = dto.isPinned
      ? new Date(Date.now() + (dto.pinDays ?? 7) * 24 * 60 * 60 * 1000)
      : null;

    const post = await this.prisma.post.create({
      data: {
        authorId: actor.id,
        churchId: audienceChurchId || actor.churchId,
        type: dto.type,
        category: dto.category,
        audience: dto.audience,
        audienceChurchId,
        audienceGroupId,
        body: dto.body,
        status: PostStatus.approved,
        isOfficial: true,
        publisherLabel,
        isPinned: Boolean(dto.isPinned),
        pinnedUntil,
        approvedAt: new Date(),
        media: dto.media?.length
          ? {
              create: dto.media.map((m, idx) => ({
                kind: m.kind,
                fileUrl: m.fileUrl,
                fileName: m.fileName,
                mimeType: m.mimeType,
                sizeBytes: m.sizeBytes,
                position: m.position ?? idx,
              })),
            }
          : undefined,
      },
      include: { author: true, media: true },
    });

    // ANN-06: Notify audience on official important/announcement posts
    await this.notifyAnnouncementAudience(post);

    return { ...post, author: serializeMemberCard(post.author, actor) };
  }

  async listAnnouncements(filters: { category?: PostCategory; churchId?: string }) {
    const items = await this.prisma.post.findMany({
      where: {
        isOfficial: true,
        status: PostStatus.approved,
        deletedAt: null,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.churchId ? { audienceChurchId: filters.churchId } : {}),
      },
      include: { author: true, media: true },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map((p) => ({ ...p, author: serializeMemberCard(p.author) }));
  }

  /**
   * REC-01..05: Recitations (Platform Admin creates/publishes; everyone reads).
   */
  async createRecitation(actor: AuthenticatedUser, dto: CreateRecitationDto) {
    return this.prisma.recitation.create({
      data: {
        title: dto.title,
        body: dto.body,
        attachmentUrl: dto.attachmentUrl,
        appliesOn: new Date(dto.appliesOn),
        status: RecitationStatus.draft,
        publishedById: actor.id,
      },
    });
  }

  async publishRecitation(recitationId: string) {
    const rec = await this.prisma.recitation.findFirst({
      where: { id: recitationId, deletedAt: null },
    });
    if (!rec) throw new NotFoundException('Recitation not found');

    const updated = await this.prisma.recitation.update({
      where: { id: recitationId },
      data: { status: RecitationStatus.published, publishedAt: new Date() },
    });

    // REC-05: Notify all active members
    const members = await this.prisma.member.findMany({
      where: { deactivatedAt: null, deletedAt: null },
      select: { id: true },
    });
    if (members.length > 0) {
      await this.prisma.notification.createMany({
        data: members.map((m) => ({
          memberId: m.id,
          type: 'recitation_published',
          subjectType: 'recitation',
          subjectId: updated.id,
          title: `New Recitation: ${updated.title}`,
          body: 'A new national NKST recitation has been published.',
        })),
      });
    }

    return updated;
  }

  async unpublishRecitation(recitationId: string) {
    return this.prisma.recitation.update({
      where: { id: recitationId },
      data: { status: RecitationStatus.draft },
    });
  }

  async listPublishedRecitations(search?: string) {
    return this.prisma.recitation.findMany({
      where: {
        status: RecitationStatus.published,
        deletedAt: null,
        ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
      },
      orderBy: [{ appliesOn: 'desc' }, { publishedAt: 'desc' }],
    });
  }

  /**
   * NOT-01..05: In-app notification list + on-read check for seller access expiring in 7 days.
   */
  async listNotifications(user: AuthenticatedUser) {
    // Compute "access expiring in 7 days" on read without scheduled job (file 10)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const expiringAccess = await this.prisma.sellerAccess.findFirst({
      where: {
        memberId: user.id,
        status: SellerAccessStatus.active,
        endsAt: { gt: new Date(), lte: sevenDaysFromNow },
      },
    });

    if (expiringAccess) {
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          memberId: user.id,
          type: 'seller_access_expiring',
          subjectId: expiringAccess.id,
        },
      });
      if (!alreadyNotified) {
        await this.prisma.notification.create({
          data: {
            memberId: user.id,
            type: 'seller_access_expiring',
            subjectType: 'seller_access',
            subjectId: expiringAccess.id,
            title: 'Seller Access Expiring Soon',
            body: 'Your marketplace seller access period expires within 7 days. Contact your Church Admin to renew.',
          },
        });
      }
    }

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { memberId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.notification.count({
        where: { memberId: user.id, readAt: null },
      }),
    ]);

    return { unreadCount, items };
  }

  async markNotificationRead(user: AuthenticatedUser, notificationId: string) {
    const existing = await this.prisma.notification.findFirst({
      where: { id: notificationId, memberId: user.id },
    });
    if (!existing) throw new NotFoundException('Notification not found');
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllNotificationsRead(user: AuthenticatedUser) {
    const res = await this.prisma.notification.updateMany({
      where: { memberId: user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return { markedRead: res.count };
  }

  async registerDeviceToken(user: AuthenticatedUser, dto: RegisterDeviceTokenDto) {
    return this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: { memberId: user.id, platform: dto.platform },
      create: { memberId: user.id, platform: dto.platform, token: dto.token },
    });
  }

  async updateNotificationPreferences(
    user: AuthenticatedUser,
    dto: UpdateNotificationPreferencesDto,
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { memberId: user.id },
      update: dto,
      create: { memberId: user.id, ...dto },
    });
  }

  private async notifyAnnouncementAudience(post: {
    id: string;
    audience: Audience;
    audienceChurchId: string | null;
    audienceGroupId: string | null;
    publisherLabel: string | null;
  }) {
    let recipientIds: string[] = [];

    if (post.audience === Audience.general) {
      recipientIds = (
        await this.prisma.member.findMany({
          where: { deactivatedAt: null, deletedAt: null },
          select: { id: true },
        })
      ).map((m) => m.id);
    } else if (post.audience === Audience.church && post.audienceChurchId) {
      recipientIds = (
        await this.prisma.member.findMany({
          where: { churchId: post.audienceChurchId, deactivatedAt: null, deletedAt: null },
          select: { id: true },
        })
      ).map((m) => m.id);
    } else if (post.audience === Audience.group && post.audienceGroupId) {
      recipientIds = (
        await this.prisma.groupMember.findMany({
          where: { groupId: post.audienceGroupId },
          select: { memberId: true },
        })
      ).map((gm) => gm.memberId);
    }

    if (recipientIds.length > 0) {
      await this.prisma.notification.createMany({
        data: recipientIds.map((memberId) => ({
          memberId,
          type: 'official_announcement',
          subjectType: 'post',
          subjectId: post.id,
          title: post.publisherLabel || 'Official Announcement',
          body: 'A new official announcement has been published.',
        })),
      });
    }
  }
}
