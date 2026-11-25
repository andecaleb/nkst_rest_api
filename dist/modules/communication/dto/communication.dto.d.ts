import { Audience, DevicePlatform, MediaKind, ModerationActionType, PostCategory, PostType, ReactionKind, ReactionSubjectType, ReportReason, ReportSubjectType } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/utils/pagination.util';
export declare class PostMediaItemDto {
    kind: MediaKind;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    position?: number;
}
export declare class CreatePostDto {
    type: PostType;
    category: PostCategory;
    audience: Audience;
    audienceGroupId?: string;
    body?: string;
    media?: PostMediaItemDto[];
    saveAsDraft?: boolean;
}
export declare class UpdatePostDto {
    body?: string;
    category?: PostCategory;
}
export declare class ModeratePostDto {
    action: ModerationActionType;
    reason?: string;
}
export declare class FilterFeedDto extends PaginationQueryDto {
    category?: PostCategory;
    type?: PostType;
    churchId?: string;
    groupId?: string;
}
export declare class CreateCommentDto {
    body: string;
    parentCommentId?: string;
}
export declare class ToggleReactionDto {
    subjectType: ReactionSubjectType;
    subjectId: string;
    kind: ReactionKind;
}
export declare class SharePostDto {
    note?: string;
}
export declare class CreateReportDto {
    subjectType: ReportSubjectType;
    subjectId: string;
    reason: ReportReason;
    detail?: string;
}
export declare class HandleReportDto {
    decision: 'dismiss' | 'hide' | 'remove';
    resolutionNote?: string;
}
export declare class CreateOfficialAnnouncementDto {
    type: PostType;
    category: PostCategory;
    audience: Audience;
    audienceChurchId?: string;
    audienceGroupId?: string;
    body: string;
    isPinned?: boolean;
    pinDays?: number;
    media?: PostMediaItemDto[];
}
export declare class CreateRecitationDto {
    title: string;
    body: string;
    attachmentUrl?: string;
    appliesOn: string;
}
export declare class RegisterDeviceTokenDto {
    platform: DevicePlatform;
    token: string;
}
export declare class UpdateNotificationPreferencesDto {
    pushReactions?: boolean;
    pushComments?: boolean;
    pushAnnouncements?: boolean;
}
