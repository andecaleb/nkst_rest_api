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
exports.AnnouncementsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../database/prisma.service");
const privacy_util_1 = require("../../common/utils/privacy.util");
let AnnouncementsService = class AnnouncementsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async publishAnnouncement(actor, dto) {
        let audienceChurchId = dto.audienceChurchId ?? null;
        let audienceGroupId = dto.audienceGroupId ?? null;
        let publisherLabel = 'Official · Platform Admin';
        if (actor.isPlatformAdmin) {
            publisherLabel = 'Official · Platform Admin, NKST HQ';
        }
        else if (dto.audience === client_1.Audience.church) {
            const targetChurchId = audienceChurchId || actor.churchId;
            if (!actor.administeredChurchIds.includes(targetChurchId)) {
                throw new common_1.ForbiddenException('Church Admins can only publish announcements to their own church');
            }
            const church = await this.prisma.church.findUnique({ where: { id: targetChurchId } });
            audienceChurchId = targetChurchId;
            publisherLabel = `Official · Church Admin, ${church?.name ?? 'Church'}`;
        }
        else if (dto.audience === client_1.Audience.group && audienceGroupId) {
            const gm = await this.prisma.groupMember.findUnique({
                where: { groupId_memberId: { groupId: audienceGroupId, memberId: actor.id } },
                include: { group: true },
            });
            if (gm?.role !== 'admin') {
                throw new common_1.ForbiddenException('Only Group Admins can publish official group announcements');
            }
            publisherLabel = `Official · Group Admin, ${gm.group.name}`;
        }
        else {
            throw new common_1.ForbiddenException('Only the Platform Admin can publish general-audience announcements');
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
                status: client_1.PostStatus.approved,
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
        await this.notifyAnnouncementAudience(post);
        return { ...post, author: (0, privacy_util_1.serializeMemberCard)(post.author, actor) };
    }
    async listAnnouncements(filters) {
        const items = await this.prisma.post.findMany({
            where: {
                isOfficial: true,
                status: client_1.PostStatus.approved,
                deletedAt: null,
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.churchId ? { audienceChurchId: filters.churchId } : {}),
            },
            include: { author: true, media: true },
            orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        });
        return items.map((p) => ({ ...p, author: (0, privacy_util_1.serializeMemberCard)(p.author) }));
    }
    async createRecitation(actor, dto) {
        return this.prisma.recitation.create({
            data: {
                title: dto.title,
                body: dto.body,
                attachmentUrl: dto.attachmentUrl,
                appliesOn: new Date(dto.appliesOn),
                status: client_1.RecitationStatus.draft,
                publishedById: actor.id,
            },
        });
    }
    async publishRecitation(recitationId) {
        const rec = await this.prisma.recitation.findFirst({
            where: { id: recitationId, deletedAt: null },
        });
        if (!rec)
            throw new common_1.NotFoundException('Recitation not found');
        const updated = await this.prisma.recitation.update({
            where: { id: recitationId },
            data: { status: client_1.RecitationStatus.published, publishedAt: new Date() },
        });
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
    async unpublishRecitation(recitationId) {
        return this.prisma.recitation.update({
            where: { id: recitationId },
            data: { status: client_1.RecitationStatus.draft },
        });
    }
    async listPublishedRecitations(search) {
        return this.prisma.recitation.findMany({
            where: {
                status: client_1.RecitationStatus.published,
                deletedAt: null,
                ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
            },
            orderBy: [{ appliesOn: 'desc' }, { publishedAt: 'desc' }],
        });
    }
    async listNotifications(user) {
        const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const expiringAccess = await this.prisma.sellerAccess.findFirst({
            where: {
                memberId: user.id,
                status: client_1.SellerAccessStatus.active,
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
    async markNotificationRead(user, notificationId) {
        const existing = await this.prisma.notification.findFirst({
            where: { id: notificationId, memberId: user.id },
        });
        if (!existing)
            throw new common_1.NotFoundException('Notification not found');
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: { readAt: new Date() },
        });
    }
    async markAllNotificationsRead(user) {
        const res = await this.prisma.notification.updateMany({
            where: { memberId: user.id, readAt: null },
            data: { readAt: new Date() },
        });
        return { markedRead: res.count };
    }
    async registerDeviceToken(user, dto) {
        return this.prisma.deviceToken.upsert({
            where: { token: dto.token },
            update: { memberId: user.id, platform: dto.platform },
            create: { memberId: user.id, platform: dto.platform, token: dto.token },
        });
    }
    async updateNotificationPreferences(user, dto) {
        return this.prisma.notificationPreference.upsert({
            where: { memberId: user.id },
            update: dto,
            create: { memberId: user.id, ...dto },
        });
    }
    async notifyAnnouncementAudience(post) {
        let recipientIds = [];
        if (post.audience === client_1.Audience.general) {
            recipientIds = (await this.prisma.member.findMany({
                where: { deactivatedAt: null, deletedAt: null },
                select: { id: true },
            })).map((m) => m.id);
        }
        else if (post.audience === client_1.Audience.church && post.audienceChurchId) {
            recipientIds = (await this.prisma.member.findMany({
                where: { churchId: post.audienceChurchId, deactivatedAt: null, deletedAt: null },
                select: { id: true },
            })).map((m) => m.id);
        }
        else if (post.audience === client_1.Audience.group && post.audienceGroupId) {
            recipientIds = (await this.prisma.groupMember.findMany({
                where: { groupId: post.audienceGroupId },
                select: { memberId: true },
            })).map((gm) => gm.memberId);
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
};
exports.AnnouncementsService = AnnouncementsService;
exports.AnnouncementsService = AnnouncementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnnouncementsService);
//# sourceMappingURL=announcements.service.js.map