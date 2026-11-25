import { PostCategory } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateOfficialAnnouncementDto, CreateRecitationDto, RegisterDeviceTokenDto, UpdateNotificationPreferencesDto } from './dto/communication.dto';
import { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class AnnouncementsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    publishAnnouncement(actor: AuthenticatedUser, dto: CreateOfficialAnnouncementDto): Promise<{
        author: {
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
        media: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fileUrl: string;
            postId: string;
            kind: import(".prisma/client").$Enums.MediaKind;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            position: number;
        }[];
        type: import(".prisma/client").$Enums.PostType;
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        audience: import(".prisma/client").$Enums.Audience;
        authorId: string;
        category: import(".prisma/client").$Enums.PostCategory;
        audienceChurchId: string | null;
        audienceGroupId: string | null;
        body: string | null;
        isOfficial: boolean;
        publisherLabel: string | null;
        isPinned: boolean;
        pinnedUntil: Date | null;
        sharedFromPostId: string | null;
        approvedAt: Date | null;
    }>;
    listAnnouncements(filters: {
        category?: PostCategory;
        churchId?: string;
    }): Promise<{
        author: {
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
        media: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            fileUrl: string;
            postId: string;
            kind: import(".prisma/client").$Enums.MediaKind;
            fileName: string;
            mimeType: string;
            sizeBytes: number;
            position: number;
        }[];
        type: import(".prisma/client").$Enums.PostType;
        churchId: string;
        id: string;
        status: import(".prisma/client").$Enums.PostStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        audience: import(".prisma/client").$Enums.Audience;
        authorId: string;
        category: import(".prisma/client").$Enums.PostCategory;
        audienceChurchId: string | null;
        audienceGroupId: string | null;
        body: string | null;
        isOfficial: boolean;
        publisherLabel: string | null;
        isPinned: boolean;
        pinnedUntil: Date | null;
        sharedFromPostId: string | null;
        approvedAt: Date | null;
    }[]>;
    createRecitation(actor: AuthenticatedUser, dto: CreateRecitationDto): Promise<{
        title: string;
        id: string;
        status: import(".prisma/client").$Enums.RecitationStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        body: string;
        attachmentUrl: string | null;
        appliesOn: Date;
        publishedAt: Date | null;
        publishedById: string;
    }>;
    publishRecitation(recitationId: string): Promise<{
        title: string;
        id: string;
        status: import(".prisma/client").$Enums.RecitationStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        body: string;
        attachmentUrl: string | null;
        appliesOn: Date;
        publishedAt: Date | null;
        publishedById: string;
    }>;
    unpublishRecitation(recitationId: string): Promise<{
        title: string;
        id: string;
        status: import(".prisma/client").$Enums.RecitationStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        body: string;
        attachmentUrl: string | null;
        appliesOn: Date;
        publishedAt: Date | null;
        publishedById: string;
    }>;
    listPublishedRecitations(search?: string): Promise<{
        title: string;
        id: string;
        status: import(".prisma/client").$Enums.RecitationStatus;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        body: string;
        attachmentUrl: string | null;
        appliesOn: Date;
        publishedAt: Date | null;
        publishedById: string;
    }[]>;
    listNotifications(user: AuthenticatedUser): Promise<{
        unreadCount: number;
        items: {
            type: string;
            title: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            memberId: string;
            body: string;
            subjectType: string | null;
            subjectId: string | null;
            readAt: Date | null;
        }[];
    }>;
    markNotificationRead(user: AuthenticatedUser, notificationId: string): Promise<{
        type: string;
        title: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        memberId: string;
        body: string;
        subjectType: string | null;
        subjectId: string | null;
        readAt: Date | null;
    }>;
    markAllNotificationsRead(user: AuthenticatedUser): Promise<{
        markedRead: number;
    }>;
    registerDeviceToken(user: AuthenticatedUser, dto: RegisterDeviceTokenDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        memberId: string;
        token: string;
        platform: import(".prisma/client").$Enums.DevicePlatform;
    }>;
    updateNotificationPreferences(user: AuthenticatedUser, dto: UpdateNotificationPreferencesDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        pushReactions: boolean;
        pushComments: boolean;
        pushAnnouncements: boolean;
        memberId: string;
    }>;
    private notifyAnnouncementAudience;
}
