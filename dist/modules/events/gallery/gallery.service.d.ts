import { PhotoCategory } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAlbumDto, ReviewPhotoDto, UploadPhotoDto } from './gallery.dto';
import { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
export declare class GalleryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createAlbum(churchId: string, actor: AuthenticatedUser, dto: CreateAlbumDto): Promise<{
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        eventName: string | null;
        eventDate: Date | null;
        coverPhotoId: string | null;
        galleryId: string;
    }>;
    listAlbums(churchId: string): Promise<({
        _count: {
            photos: number;
        };
    } & {
        description: string | null;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        eventName: string | null;
        eventDate: Date | null;
        coverPhotoId: string | null;
        galleryId: string;
    })[]>;
    uploadPhoto(user: AuthenticatedUser, dto: UploadPhotoDto): Promise<{
        allowDownload: boolean;
        uploader: {
            id: string;
            fullName: string;
            photoUrl: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
        } | null;
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PhotoStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        category: import(".prisma/client").$Enums.PhotoCategory;
        albumId: string | null;
        uploaderId: string;
        fileUrl: string;
        caption: string | null;
        eventName: string | null;
        hasMinors: boolean;
        consentConfirmed: boolean;
        parentalConsentConfirmed: boolean;
        rejectionReason: string | null;
    }>;
    listPhotos(filters: {
        churchId?: string;
        category?: PhotoCategory;
        albumId?: string;
        eventName?: string;
        uploaderId?: string;
    }, viewer?: AuthenticatedUser): Promise<{
        allowDownload: boolean;
        uploader: {
            id: string;
            fullName: string;
            photoUrl: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
        } | null;
        church: {
            name: string;
            id: string;
        };
        album: {
            title: string;
            id: string;
        } | null;
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PhotoStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        category: import(".prisma/client").$Enums.PhotoCategory;
        albumId: string | null;
        uploaderId: string;
        fileUrl: string;
        caption: string | null;
        eventName: string | null;
        hasMinors: boolean;
        consentConfirmed: boolean;
        parentalConsentConfirmed: boolean;
        rejectionReason: string | null;
    }[]>;
    getReviewQueue(actor: AuthenticatedUser): Promise<{
        requiresSafeguardingReview: boolean;
        uploader: {
            id: string;
            fullName: string;
            photoUrl: string;
            churchId: string;
            church: {
                id: string;
                name: string;
                state?: string;
                lga?: string;
            } | undefined;
            isVerified: boolean;
            verificationBadge: string;
            profileVisibility: import(".prisma/client").$Enums.ProfileVisibility;
        } | null;
        album: {
            description: string | null;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            eventName: string | null;
            eventDate: Date | null;
            coverPhotoId: string | null;
            galleryId: string;
        } | null;
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PhotoStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        category: import(".prisma/client").$Enums.PhotoCategory;
        albumId: string | null;
        uploaderId: string;
        fileUrl: string;
        caption: string | null;
        eventName: string | null;
        hasMinors: boolean;
        consentConfirmed: boolean;
        parentalConsentConfirmed: boolean;
        rejectionReason: string | null;
    }[]>;
    reviewPhoto(photoId: string, actor: AuthenticatedUser, dto: ReviewPhotoDto): Promise<{
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PhotoStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        category: import(".prisma/client").$Enums.PhotoCategory;
        albumId: string | null;
        uploaderId: string;
        fileUrl: string;
        caption: string | null;
        eventName: string | null;
        hasMinors: boolean;
        consentConfirmed: boolean;
        parentalConsentConfirmed: boolean;
        rejectionReason: string | null;
    }>;
    private assertChurchAdmin;
}
