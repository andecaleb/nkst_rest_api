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
exports.GalleryService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../../database/prisma.service");
const privacy_util_1 = require("../../../common/utils/privacy.util");
let GalleryService = class GalleryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createAlbum(churchId, actor, dto) {
        this.assertChurchAdmin(actor, churchId);
        const gallery = await this.prisma.gallery.upsert({
            where: { churchId },
            update: {},
            create: { churchId },
        });
        return this.prisma.album.create({
            data: {
                galleryId: gallery.id,
                title: dto.title,
                description: dto.description,
                eventName: dto.eventName,
                eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
            },
        });
    }
    async listAlbums(churchId) {
        const gallery = await this.prisma.gallery.findUnique({ where: { churchId } });
        if (!gallery)
            return [];
        return this.prisma.album.findMany({
            where: { galleryId: gallery.id, deletedAt: null },
            include: { _count: { select: { photos: { where: { status: client_1.PhotoStatus.approved } } } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async uploadPhoto(user, dto) {
        if (!dto.consentConfirmed) {
            throw new common_1.BadRequestException('You must confirm: "I have the right to share this photo, and people in it have agreed where required." (GAL-11)');
        }
        const isChurchAdmin = user.isPlatformAdmin || user.administeredChurchIds.includes(user.churchId);
        let status = client_1.PhotoStatus.pending_review;
        if (user.verificationState !== client_1.VerificationState.verified) {
            status = client_1.PhotoStatus.held_unverified;
        }
        else if (isChurchAdmin && !dto.hasMinors) {
            status = client_1.PhotoStatus.approved;
        }
        const photo = await this.prisma.photo.create({
            data: {
                churchId: user.churchId,
                albumId: dto.albumId,
                uploaderId: user.id,
                fileUrl: dto.fileUrl,
                caption: dto.caption,
                category: dto.category,
                eventName: dto.eventName,
                hasMinors: dto.hasMinors,
                consentConfirmed: dto.consentConfirmed,
                parentalConsentConfirmed: Boolean(dto.parentalConsentConfirmed),
                status,
            },
            include: { uploader: true },
        });
        return {
            ...photo,
            allowDownload: !photo.hasMinors,
            uploader: (0, privacy_util_1.serializeMemberCard)(photo.uploader, user),
        };
    }
    async listPhotos(filters, viewer) {
        const photos = await this.prisma.photo.findMany({
            where: {
                status: client_1.PhotoStatus.approved,
                deletedAt: null,
                ...(filters.churchId ? { churchId: filters.churchId } : {}),
                ...(filters.category ? { category: filters.category } : {}),
                ...(filters.albumId ? { albumId: filters.albumId } : {}),
                ...(filters.eventName
                    ? { eventName: { contains: filters.eventName, mode: 'insensitive' } }
                    : {}),
                ...(filters.uploaderId ? { uploaderId: filters.uploaderId } : {}),
            },
            include: {
                uploader: true,
                church: { select: { id: true, name: true } },
                album: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return photos.map((p) => ({
            ...p,
            allowDownload: !p.hasMinors,
            uploader: (0, privacy_util_1.serializeMemberCard)(p.uploader, viewer),
        }));
    }
    async getReviewQueue(actor) {
        const where = { status: client_1.PhotoStatus.pending_review, deletedAt: null };
        if (!actor.isPlatformAdmin) {
            where.churchId = { in: actor.administeredChurchIds };
        }
        const photos = await this.prisma.photo.findMany({
            where,
            include: { uploader: true, album: true },
            orderBy: [{ hasMinors: 'desc' }, { createdAt: 'asc' }],
        });
        return photos.map((p) => ({
            ...p,
            requiresSafeguardingReview: p.hasMinors,
            uploader: (0, privacy_util_1.serializeMemberCard)(p.uploader, actor),
        }));
    }
    async reviewPhoto(photoId, actor, dto) {
        const photo = await this.prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
        if (!photo)
            throw new common_1.NotFoundException('Photo not found');
        this.assertChurchAdmin(actor, photo.churchId);
        if (dto.decision === 'reject' && !dto.reason) {
            throw new common_1.BadRequestException('A rejection reason is required');
        }
        const nextStatus = dto.decision === 'approve' ? client_1.PhotoStatus.approved : client_1.PhotoStatus.rejected;
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.photo.update({
                where: { id: photoId },
                data: {
                    status: nextStatus,
                    rejectionReason: dto.decision === 'reject' ? dto.reason : null,
                    ...(dto.moveToAlbumId ? { albumId: dto.moveToAlbumId } : {}),
                },
            });
            await tx.moderationAction.create({
                data: {
                    subjectType: client_1.ModerationSubjectType.photo,
                    subjectId: photoId,
                    moderatorId: actor.id,
                    action: dto.decision === 'approve'
                        ? client_1.ModerationActionType.approve
                        : client_1.ModerationActionType.reject,
                    reason: dto.reason,
                },
            });
            await tx.notification.create({
                data: {
                    memberId: photo.uploaderId,
                    type: `photo_${dto.decision}d`,
                    subjectType: 'photo',
                    subjectId: photoId,
                    title: dto.decision === 'approve' ? 'Photo Approved' : 'Photo Declined',
                    body: dto.decision === 'approve'
                        ? 'Your photo is now visible in the church gallery.'
                        : `Your photo was declined. Reason: ${dto.reason}`,
                },
            });
            return updated;
        });
    }
    assertChurchAdmin(actor, churchId) {
        if (actor.isPlatformAdmin)
            return;
        if (!actor.administeredChurchIds.includes(churchId)) {
            throw new common_1.ForbiddenException('Only the Church Admin can manage this church gallery');
        }
    }
};
exports.GalleryService = GalleryService;
exports.GalleryService = GalleryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GalleryService);
//# sourceMappingURL=gallery.service.js.map