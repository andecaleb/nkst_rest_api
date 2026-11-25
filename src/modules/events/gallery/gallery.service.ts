import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationSubjectType,
  PhotoCategory,
  PhotoStatus,
  VerificationState,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAlbumDto, ReviewPhotoDto, UploadPhotoDto } from './gallery.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { serializeMemberCard } from '../../../common/utils/privacy.util';

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async createAlbum(churchId: string, actor: AuthenticatedUser, dto: CreateAlbumDto) {
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

  async listAlbums(churchId: string) {
    const gallery = await this.prisma.gallery.findUnique({ where: { churchId } });
    if (!gallery) return [];
    return this.prisma.album.findMany({
      where: { galleryId: gallery.id, deletedAt: null },
      include: { _count: { select: { photos: { where: { status: PhotoStatus.approved } } } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * GAL-02, GAL-03, GAL-10, GAL-11, GAL-12:
   * - Requires consentConfirmed = true
   * - Unverified members -> held_unverified
   * - Church Admin uploads -> approved directly (unless hasMinors, still flagged for safeguarding)
   * - Verified members -> pending_review
   */
  async uploadPhoto(user: AuthenticatedUser, dto: UploadPhotoDto) {
    if (!dto.consentConfirmed) {
      throw new BadRequestException(
        'You must confirm: "I have the right to share this photo, and people in it have agreed where required." (GAL-11)',
      );
    }

    const isChurchAdmin =
      user.isPlatformAdmin || user.administeredChurchIds.includes(user.churchId);

    let status: PhotoStatus = PhotoStatus.pending_review;
    if (user.verificationState !== VerificationState.verified) {
      status = PhotoStatus.held_unverified;
    } else if (isChurchAdmin && !dto.hasMinors) {
      status = PhotoStatus.approved;
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
      allowDownload: !photo.hasMinors, // GAL-15
      uploader: serializeMemberCard(photo.uploader, user),
    };
  }

  /**
   * GAL-05, GAL-06, GAL-07, GAL-09, GAL-15: Browse approved photos across all churches or one church.
   */
  async listPhotos(
    filters: {
      churchId?: string;
      category?: PhotoCategory;
      albumId?: string;
      eventName?: string;
      uploaderId?: string;
    },
    viewer?: AuthenticatedUser,
  ) {
    const photos = await this.prisma.photo.findMany({
      where: {
        status: PhotoStatus.approved,
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
      allowDownload: !p.hasMinors, // GAL-15: Photos of minors are viewing-only
      uploader: serializeMemberCard(p.uploader, viewer),
    }));
  }

  async getReviewQueue(actor: AuthenticatedUser) {
    const where: any = { status: PhotoStatus.pending_review, deletedAt: null };
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
      uploader: serializeMemberCard(p.uploader, actor),
    }));
  }

  async reviewPhoto(photoId: string, actor: AuthenticatedUser, dto: ReviewPhotoDto) {
    const photo = await this.prisma.photo.findFirst({ where: { id: photoId, deletedAt: null } });
    if (!photo) throw new NotFoundException('Photo not found');
    this.assertChurchAdmin(actor, photo.churchId);

    if (dto.decision === 'reject' && !dto.reason) {
      throw new BadRequestException('A rejection reason is required');
    }

    const nextStatus = dto.decision === 'approve' ? PhotoStatus.approved : PhotoStatus.rejected;

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
          subjectType: ModerationSubjectType.photo,
          subjectId: photoId,
          moderatorId: actor.id,
          action:
            dto.decision === 'approve'
              ? ModerationActionType.approve
              : ModerationActionType.reject,
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
          body:
            dto.decision === 'approve'
              ? 'Your photo is now visible in the church gallery.'
              : `Your photo was declined. Reason: ${dto.reason}`,
        },
      });

      return updated;
    });
  }

  private assertChurchAdmin(actor: AuthenticatedUser, churchId: string) {
    if (actor.isPlatformAdmin) return;
    if (!actor.administeredChurchIds.includes(churchId)) {
      throw new ForbiddenException('Only the Church Admin can manage this church gallery');
    }
  }
}
