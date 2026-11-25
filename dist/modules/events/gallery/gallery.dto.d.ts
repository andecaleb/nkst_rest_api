import { PhotoCategory } from '@prisma/client';
export declare class CreateAlbumDto {
    title: string;
    description?: string;
    eventName?: string;
    eventDate?: string;
}
export declare class UploadPhotoDto {
    fileUrl: string;
    caption?: string;
    category: PhotoCategory;
    albumId?: string;
    eventName?: string;
    consentConfirmed: boolean;
    hasMinors: boolean;
    parentalConsentConfirmed?: boolean;
}
export declare class ReviewPhotoDto {
    decision: 'approve' | 'reject';
    reason?: string;
    moveToAlbumId?: string;
}
